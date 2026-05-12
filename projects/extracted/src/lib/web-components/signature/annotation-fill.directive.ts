import {
  computed,
  Directive,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import type {
  AnnotationsUnion,
  FormField,
  Instance,
  List,
  ViewState,
} from '@nutrient-sdk/viewer';
import {
  FileTypes,
  type ExistingFileMetadata,
  type FileMetadata,
} from '../../models/documents/fileModels';
import type { ClientRequest } from '../../services/client/requests/client-requests.service';
import { IAMService } from '../../services/identity/iam.service';
import { PDF_VIEWER_LOCALES } from '../documents/pdf-viewer/pdf-viewer.locales';
import { loadPSPDFKit } from '../documents/pdf-viewer/pspdfkit-loader';
import { FieldsBridgeService, isV2Custom } from '../pdf/field-framework';
import { FIELD_DATA_SCHEMA_VERSION } from '../pdf/field-framework/constants';
import { FIELD_PLUGINS } from '../pdf/field-framework/plugins/field-plugin';
import type { SignatureInstantJSON } from '../pdf/field-framework/types/instant-json';
import {
  buildAuthorizedSignersMap,
  canFillAnnotation,
  isAuthorizedForAnnotation,
  resolveImpersonatedSigner,
} from './annotation-authorization';
import {
  AnnotationType,
  type AnnotationData,
  extractSignatureMetadata,
  isSignatureDocumentFullySigned,
} from './annotation.types';

type PSPDFKitModule = Awaited<ReturnType<typeof loadPSPDFKit>>;

/**
 * Normalize a raw form-field value (which may be a string, an Immutable.List
 * of strings, a plain string array, null, or undefined) into a single string
 * or null. Returns the first element for list-shaped values; null for empty
 * lists / null / undefined.
 */
function coerceFormFieldValue(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' ? first : null;
  }
  // Immutable.List has a `.first()` method; duck-type to avoid importing the
  // immutable types here.
  if (typeof (raw as { first?: unknown }).first === 'function') {
    const first = (raw as { first: () => unknown }).first();
    return typeof first === 'string' ? first : null;
  }
  return null;
}

/**
 * Directive for PDF annotation field filling.
 * Renders existing annotations and allows filling fields based on user permissions.
 * Makes annotations readonly if the user is not authorized to fill them.
 */
@Directive({
  selector: '[lj-pdf-annotation-fill]',
  standalone: true,
  exportAs: 'ljPdfAnnotationFill',
})
export class PdfAnnotationFillDirective implements OnDestroy {
  private readonly bridge = inject(FieldsBridgeService);
  private readonly iamService = inject(IAMService);

  /** Cached PSPDFKit module — populated on first `getPSPDFKit()` call. */
  private pspdfkitModule: PSPDFKitModule | null = null;

  private async getPSPDFKit(): Promise<PSPDFKitModule> {
    if (!this.pspdfkitModule) {
      this.pspdfkitModule = await loadPSPDFKit();
    }
    return this.pspdfkitModule;
  }

  // Configuration inputs
  readonly users = input<ClientRequest['users']>([]);
  readonly pdfViewerInstance = input<Instance | null>(null);
  readonly fileMetadata = input<FileMetadata | ExistingFileMetadata | null>(
    null
  );
  // Internal state
  readonly currentFileMetadata = signal<FileMetadata | null>(null);
  private readonly lastSelectedAnnotation = signal<AnnotationsUnion | null>(
    null
  );

  private readonly previousInstance = signal<Instance | null>(null);
  private readonly previousInstanceRemoveListener = signal<VoidFunction[]>([]);

  currentUser = signal(this.iamService.getActiveUser());

  authorizedSigners = computed(() => buildAuthorizedSignersMap(this.users()));

  currentUserImpersonate = computed((): string | null =>
    resolveImpersonatedSigner(this.currentUser(), this.authorizedSigners())
  );

  signatureMetadata = computed(() => {
    const metadata = this.fileMetadata();
    const signatureMetadata = extractSignatureMetadata(
      metadata as FileMetadata
    );
    return signatureMetadata;
  });

  /**
   * Checks if the user has already confirmed their signature (persisted to server).
   * This checks the server metadata to see if user already signed.
   */
  alreadySignedByUser = computed(() => {
    const currentFileMetadata = this.fileMetadata();
    const signatureMetadata = extractSignatureMetadata(
      currentFileMetadata as FileMetadata
    );

    if (!signatureMetadata) {
      return false;
    }

    const currentUserId =
      this.currentUser()?.activeOrganizationUserId ??
      this.currentUser()?.id ??
      '';
    if (!currentUserId) {
      return false;
    }

    const userAnnotations = signatureMetadata.annotations.filter(
      annotation =>
        this.userIsAuthorizedForAnnotation(annotation) && annotation.customData
    );

    if (userAnnotations.length === 0) {
      return false;
    }

    // Check if user has confirmed by looking at signedBy array
    return userAnnotations.every(annotation => {
      const customData = annotation.customData as
        | { filledBy?: { representing?: string } }
        | undefined;
      return customData?.filledBy?.representing === currentUserId;
    });
  });

  /**
   * Checks if the user has filled all their required fields locally but hasn't confirmed yet.
   * This is true when fields are filled but the user is NOT in the signedBy array.
   */
  allUserRequiredFieldsFilled = computed(() => {
    // First check if already signed in server state to avoid false positives
    if (this.alreadySignedByUser()) {
      return false;
    }

    const currentFileMetadata = this.currentFileMetadata();
    const signatureMetadata = extractSignatureMetadata(
      currentFileMetadata as FileMetadata
    );

    if (!signatureMetadata) {
      return false;
    }

    const currentUserId =
      this.currentUser()?.activeOrganizationUserId ??
      this.currentUser()?.id ??
      '';
    if (!currentUserId) {
      return false;
    }

    const userAnnotations = signatureMetadata.annotations.filter(
      annotation =>
        this.userIsAuthorizedForAnnotation(annotation) && annotation.customData
    );

    if (userAnnotations.length === 0) {
      return false;
    }

    // Gate on required optional-assignment fields (e.g. date) regardless of
    // authorization: mapCustomersToSigners may set a signer entity ID that
    // doesn't match the IAM user ID, which would exclude the date field from
    // userAnnotations entirely and allow the banner to appear prematurely.
    const hasRequiredOptionalUnfilled = signatureMetadata.annotations.some(
      annotation => {
        const cd = annotation.customData as unknown as
          | Record<string, unknown>
          | null
          | undefined;
        if (!cd || cd['schemaVersion'] !== FIELD_DATA_SCHEMA_VERSION)
          return false;
        const plugin = Object.values(FIELD_PLUGINS).find(
          p => p.type === cd['type']
        );
        if (!plugin || plugin.requiresAssignment) return false;
        return (
          cd['required'] === true &&
          cd['filled'] !== true &&
          !(annotation.flags ?? []).includes('noView')
        );
      }
    );
    if (hasRequiredOptionalUnfilled) return false;

    // Check if all fields are filled but NOT yet confirmed (not in signedBy).
    // v1: every authorized annotation must be filled.
    // v2: only annotations with required === true must be filled; optional fields
    //     (required === false) can be submitted without a value.
    return userAnnotations.every(annotation => {
      const customData = annotation.customData as
        | {
            filled?: boolean;
            signedBy?: { id?: string }[];
            required?: boolean;
            type?: string;
          }
        | undefined;
      const isFilledLocally = customData?.filled === true;
      const isConfirmed =
        customData?.signedBy?.some(signer => signer.id === currentUserId) ??
        false;

      if (isV2Custom(annotation.customData)) {
        // v2: required fields must be filled. A field is effectively required
        // when customData.required is explicitly true OR the plugin has
        // requiresAssignment:true (signature/initials always require filling
        // even if older fields lack the explicit `required` flag).
        const plugin = Object.values(FIELD_PLUGINS).find(
          p => p.type === customData?.type
        );
        const effectiveRequired =
          customData?.required === true || plugin?.requiresAssignment === true;
        return !effectiveRequired || (isFilledLocally && !isConfirmed);
      }

      // v1: must be filled AND not yet confirmed
      return isFilledLocally && !isConfirmed;
    });
  });

  documentFullySigned = computed(() => {
    const currentFileMetadata = this.currentFileMetadata();
    return isSignatureDocumentFullySigned(
      currentFileMetadata as FileMetadata | null
    );
  });

  constructor() {
    this.setupPdfInstanceManagement();
  }

  ngOnDestroy(): void {
    // Clean up PSPDFKit listeners
    this.previousInstanceRemoveListener().forEach(cleanup => cleanup());
  }

  /** Manages PDF instance setup and cleanup with proper lifecycle handling. */
  private setupPdfInstanceManagement(): void {
    effect(() => {
      const metadata = this.fileMetadata();
      // Only initialize currentFileMetadata on first load
      // After that, we'll update it explicitly via syncToServerMetadata()
      if (this.currentFileMetadata() === null) {
        this.currentFileMetadata.set(metadata as FileMetadata | null);
      }
    });
    effect(() => {
      const instance = this.pdfViewerInstance();
      const previousInstance = this.previousInstance();

      // Only setup if instance changed
      if (instance && instance !== previousInstance) {
        untracked(() => {
          this.setupInstanceFeatures(instance);
          this.setupReadOnlyFields(instance);
          this.previousInstance.set(instance);
        });
      }

      // Clear when instance is removed
      if (!instance) {
        untracked(() => {
          this.previousInstance.set(null);
          this.previousInstanceRemoveListener().forEach(removeListener =>
            removeListener()
          );
          this.previousInstanceRemoveListener.set([]);
        });
      }
    });
  }

  userCanFillAnnotation(
    annotation: AnnotationsUnion | SignatureInstantJSON['annotations'][number]
  ): boolean {
    return canFillAnnotation(
      annotation,
      this.currentUser(),
      this.currentUserImpersonate()
    );
  }

  private userIsAuthorizedForAnnotation(
    annotation: AnnotationsUnion | SignatureInstantJSON['annotations'][number]
  ): boolean {
    return isAuthorizedForAnnotation(
      annotation,
      this.currentUser(),
      this.currentUserImpersonate()
    );
  }

  forceMetadata(metadata: FileMetadata): void {
    this.currentFileMetadata.set(metadata);
    this.refreshAnnotationReadonlyState();
  }

  /**
   * Syncs the current file metadata to match the server state.
   * Call this after the server metadata has been refetched to update the UI.
   */
  syncToServerMetadata(): void {
    const serverMetadata = this.fileMetadata();
    if (serverMetadata) {
      this.currentFileMetadata.set(serverMetadata as FileMetadata);
      this.refreshAnnotationReadonlyState();
    }
  }

  /**
   * Forces PSPDFKit to re-evaluate the readonly state of all annotations.
   * This is necessary after metadata changes to ensure filled annotations become readonly.
   */
  private refreshAnnotationReadonlyState(): void {
    const instance = this.pdfViewerInstance();
    if (!instance) {
      return;
    }
    // Re-set the callback to force PSPDFKit to re-evaluate all annotations
    instance.setIsEditableAnnotation((annotation: AnnotationsUnion): boolean =>
      this.userCanFillAnnotation(annotation)
    );
  }

  private setupReadOnlyFields(instance: Instance): void {
    if (!instance) {
      return;
    }
    instance.setIsEditableAnnotation((annotation: AnnotationsUnion): boolean =>
      this.userCanFillAnnotation(annotation)
    );
  }

  /** Sets up PDF instance features (rendering, event listeners). */
  private setupInstanceFeatures(instance: Instance): void {
    try {
      // Hand the instance to the v2 bridge — owns setCustomRenderers and the
      // press dispatcher. v1 customData routes through the legacy renderer.
      void this.bridge.attach(instance);
      // Feed the host's authorization gate to the bridge so the press
      // dispatcher only opens the signing modal for fields the current user
      // is allowed to fill (resolves impersonation correctly).
      this.bridge.setCanFillAnnotation(annotation =>
        this.userCanFillAnnotation(annotation)
      );
      this.setupEventListeners(instance);
      void this.initializeFormFieldValues(instance);
    } catch {
      console.error(
        '[PdfAnnotationFillDirective] Failed to setup custom rendering'
      );
    }
  }

  private async initializeFormFieldValues(instance: Instance): Promise<void> {
    try {
      const currentMetadata = this.currentFileMetadata();
      const signatureJson = extractSignatureMetadata(currentMetadata);
      if (!signatureJson) {
        return;
      }

      if (
        signatureJson.formFieldValues &&
        signatureJson.formFieldValues.length > 0
      ) {
        return;
      }

      const formFields = await instance.getFormFields();
      if (!formFields || formFields.size === 0) {
        return;
      }

      const exported = await instance.exportInstantJSON();
      const exportedValues = exported.formFieldValues ?? [];
      const exportedByName = new Map(exportedValues.map(v => [v.name, v]));

      const allFieldNames = formFields
        .toArray()
        .map(f => f.toJSON().name)
        .filter((name): name is string => Boolean(name));

      const formFieldValues = allFieldNames.map(name => {
        const existing = exportedByName.get(name);
        return (
          existing ?? {
            name,
            type: 'pspdfkit/form-field-value' as const,
            v: 1,
            value: '',
          }
        );
      });

      this.currentFileMetadata.update(fileMetadata => {
        const json = extractSignatureMetadata(fileMetadata);
        if (!json) {
          return fileMetadata;
        }
        return this.mergeSignatureTaskIntoFileMetadata(fileMetadata, {
          ...json,
          formFieldValues,
        });
      });
    } catch (error) {
      console.error(
        '[PdfAnnotationFillDirective] Failed to initialize formFieldValues:',
        error
      );
    }
  }

  private mergeSignatureTaskIntoFileMetadata(
    fileMetadata: FileMetadata | null,
    signatureTask: unknown
  ): FileMetadata | null {
    if (!fileMetadata) {
      return fileMetadata;
    }

    return {
      ...fileMetadata,
      fileType: fileMetadata.fileType ?? FileTypes.PDF,
      fileMetadata: {
        ...(typeof fileMetadata.fileMetadata === 'object' &&
        fileMetadata.fileMetadata
          ? fileMetadata.fileMetadata
          : {}),
        signatureTask,
      },
    };
  }

  private setupEventListeners(instance: Instance): void {
    this.selectAnnotationListener(instance);
    this.signAnnotationListener(instance);
    this.fieldUpdateListener(instance);
    this.signatureModalListener(instance);
  }

  private selectAnnotationListener(instance: Instance) {
    const listenerFn = ({ annotation }: { annotation: AnnotationsUnion }) => {
      this.lastSelectedAnnotation.set(annotation);
    };

    instance.addEventListener('annotations.press', listenerFn);
    instance.addEventListener('annotations.focus', listenerFn);

    this.previousInstanceRemoveListener.update(list => [
      ...list,
      () => instance.removeEventListener('annotations.press', listenerFn),
      () => instance.removeEventListener('annotations.focus', listenerFn),
    ]);
  }

  private signAnnotationListener(instance: Instance) {
    const listenerFn = async (annotations: List<AnnotationsUnion>) => {
      const createdAnnotation = annotations.toArray().at(0);

      if (!createdAnnotation) {
        return;
      }

      const isSignatureCreated =
        await this.isSignatureAnnotationCreated(createdAnnotation);
      if (
        isSignatureCreated &&
        (this.signatureAnnotationSelected() ||
          this.initialsAnnotationSelected())
      ) {
        createdAnnotation.set('readOnly', true);
        instance.update(createdAnnotation);
        const signedAnnotation = this.lastSelectedAnnotation();
        this.registerAnnotationRecentlySigned(
          signedAnnotation,
          createdAnnotation
        );
      }
    };

    instance.addEventListener('annotations.create', listenerFn);

    this.previousInstanceRemoveListener.update(list => [
      ...list,
      () => instance.removeEventListener('annotations.create', listenerFn),
    ]);
  }

  private fieldUpdateListener(instance: Instance) {
    const listenerFn = (formFieldValues: List<FormField>) => {
      const formFieldValue = formFieldValues.first<FormField>();
      if (!formFieldValue) {
        return;
      }
      const fieldName = formFieldValue.get('name') ?? null;
      // PSPDFKit emits `value` as a string for text/date/number/combobox
      // single-select, but as an Immutable.List<string> or string[] for
      // ChoiceFormField variants and multi-select. Normalize to a single
      // string so downstream callers (`registerAnnotationUpdate`,
      // `syncFormFieldValue`) keep their string contract.
      const fieldValue = coerceFormFieldValue(formFieldValue.get('value'));

      this.registerAnnotationUpdate(fieldName, fieldValue);
      this.syncFormFieldValue(fieldName, fieldValue ?? '');
    };

    instance.addEventListener('formFieldValues.update', listenerFn);

    this.previousInstanceRemoveListener.update(list => [
      ...list,
      () => instance.removeEventListener('formFieldValues.update', listenerFn),
    ]);
  }

  private syncFormFieldValue(fieldName: string | null, value: string): void {
    if (!fieldName) {
      return;
    }
    this.currentFileMetadata.update(fileMetadata => {
      const json = extractSignatureMetadata(fileMetadata);
      if (!json) {
        return fileMetadata;
      }

      const existing = json.formFieldValues ?? [];
      const index = existing.findIndex(v => v.name === fieldName);

      const entry = {
        name: fieldName,
        type: 'pspdfkit/form-field-value' as const,
        v: 1,
        value,
      };

      const updated =
        index >= 0
          ? existing.map((v, i) => (i === index ? entry : v))
          : [...existing, entry];

      return this.mergeSignatureTaskIntoFileMetadata(fileMetadata, {
        ...json,
        formFieldValues: updated,
      });
    });
  }

  /**
   * Handles signature modal customization when it opens.
   * - Changes popup text from "Add Signature" to "Add Initials" for initials fields
   * - Sets "Type" as the default signature option instead of "Draw"
   * - Forces modal re-render to display updated I18n messages
   */
  private signatureModalListener(instance: Instance) {
    const listenerFn = async (viewState: ViewState) => {
      // Check if signature modal is opening
      const PSPDFKit = await this.getPSPDFKit();
      if (viewState.interactionMode === PSPDFKit.InteractionMode.SIGNATURE) {
        // Update I18n messages BEFORE modal renders
        await this.updateSignatureModalMessages(instance);

        this.setDefaultTypeTab(instance);
      }
    };

    instance.addEventListener('viewState.change', listenerFn);

    this.previousInstanceRemoveListener.update(list => [
      ...list,
      () => instance.removeEventListener('viewState.change', listenerFn),
    ]);
  }

  /**
   * Updates I18n messages based on the selected annotation type
   */
  private async updateSignatureModalMessages(
    instance: Instance
  ): Promise<void> {
    const PSPDFKit = await this.getPSPDFKit();
    const currentAnnotation = this.lastSelectedAnnotation();
    const customData = currentAnnotation?.get('customData');
    const currentLocale = instance.locale ?? 'en';

    // Ensure PSPDFKit.I18n.messages locale exists
    if (!PSPDFKit.I18n?.messages?.[currentLocale]) {
      // Use Object.assign to safely extend the messages object
      Object.assign(PSPDFKit.I18n?.messages || {}, {
        [currentLocale]: {},
      });
    }

    await instance.setLocale(
      customData?.type === AnnotationType.Initials
        ? PDF_VIEWER_LOCALES.INITIALS
        : PDF_VIEWER_LOCALES.BASE
    );
  }

  /**
   * Sets "Type" as the default signature option instead of "Draw"
   */
  private setDefaultTypeTab(instance: Instance): void {
    const typeTab = instance.contentDocument.querySelector(
      '.PSPDFKit-Electronic-Signatures-Tab-Type'
    );

    if (typeTab && typeTab instanceof HTMLElement) {
      typeTab.click();
    }
  }

  async isSignatureAnnotationCreated(
    annotation: AnnotationsUnion
  ): Promise<boolean> {
    const PSPDFKit = await this.getPSPDFKit();
    if (
      annotation instanceof PSPDFKit.Annotations.InkAnnotation ||
      annotation instanceof PSPDFKit.Annotations.ImageAnnotation
    ) {
      return (
        annotation as
          | InstanceType<typeof PSPDFKit.Annotations.InkAnnotation>
          | InstanceType<typeof PSPDFKit.Annotations.ImageAnnotation>
      ).isSignature;
    }
    return false;
  }

  signatureAnnotationSelected(): boolean {
    const annotation = this.lastSelectedAnnotation();
    return annotation?.customData?.type === 'signature';
  }

  initialsAnnotationSelected(): boolean {
    const annotation = this.lastSelectedAnnotation();
    return annotation?.customData?.type === 'initials';
  }

  dateAnnotationSelected(): boolean {
    const annotation = this.lastSelectedAnnotation();
    return annotation?.customData?.type === 'date';
  }

  registerAnnotationRecentlySigned(
    signedAnnotation: AnnotationsUnion | null,
    createdInkSignature: AnnotationsUnion
  ): void {
    this.currentFileMetadata.update(fileMetadata => {
      const signatureJson = extractSignatureMetadata(fileMetadata);
      if (!signatureJson) {
        return fileMetadata;
      }
      const updatedAnnotations = signatureJson.annotations.map(annotation => {
        if (annotation.id === signedAnnotation?.id) {
          // Update the annotation with the new signature data
          const cd = (annotation.customData as object | null) ?? {};
          return {
            ...annotation,
            customData: {
              ...cd,
              filled: true,
              filledBy: {
                userId: this.currentUser()?.activeOrganizationUserId ?? '',
                userFirstName: this.currentUser()?.firstName ?? '',
                userLastName: this.currentUser()?.lastName ?? '',
                representing: this.currentUserImpersonate(),
              },
              filledAt: new Date().getTime(),
            },
          };
        }
        return annotation;
      });
      const updatedSignatureJson = {
        ...signatureJson,
        annotations: [...updatedAnnotations, createdInkSignature.toJS()],
      };
      return this.mergeSignatureTaskIntoFileMetadata(
        fileMetadata,
        updatedSignatureJson
      );
    });
  }

  registerAnnotationUpdate(
    formFieldName: string | null,
    value: string | null
  ): void {
    this.currentFileMetadata.update(fileMetadata => {
      const signatureJson = extractSignatureMetadata(fileMetadata);
      if (!signatureJson) {
        return fileMetadata;
      }
      const updatedAnnotations = signatureJson.annotations.map(annotation => {
        if (annotation.formFieldName === formFieldName) {
          const filled = Boolean(value?.trim());
          const cd = annotation.customData as AnnotationData | null;
          // Update the annotation with the new signature data
          return {
            ...annotation,
            customData: {
              ...(cd ?? {}),
              filled,
              filledBy: filled
                ? {
                    userId: this.currentUser()?.activeOrganizationUserId ?? '',
                    userFirstName: this.currentUser()?.firstName ?? '',
                    userLastName: this.currentUser()?.lastName ?? '',
                    representing: this.currentUserImpersonate(),
                  }
                : undefined,
              filledAt: filled ? new Date().getTime() : undefined,
              date: cd?.type === 'date' && filled ? value : null,
              name: cd?.type === 'name' && filled ? value : null,
            },
          };
        }
        return annotation;
      });
      const updatedSignatureJson = {
        ...signatureJson,
        annotations: updatedAnnotations,
      };
      return this.mergeSignatureTaskIntoFileMetadata(
        fileMetadata,
        updatedSignatureJson
      );
    });
  }
}
