import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  Injector,
  OnDestroy,
  signal,
} from '@angular/core';
import type {
  AnnotationsUnion,
  Instance,
  RendererConfiguration,
} from '@nutrient-sdk/viewer';
import { loadPSPDFKit } from '../../../documents/pdf-viewer/pspdfkit-loader';
import { createCustomRenderer } from '../../../signature/custom-renderer/custom-renderer';
import {
  LABEL_GAP_PX,
  LABEL_HEIGHT_PX,
  makeLabelAnnotation,
} from '../api/label';
import type { AssignmentMode } from '../assignment-mode';
import { FieldOverlayComponent } from '../components/field-overlay.component';
import {
  syncDropdownFormFieldFromCustomData,
  type DropdownOption,
} from '../plugins/dropdown/dropdown.plugin';
import { FIELD_PLUGINS } from '../plugins/field-plugin';
import { isV2Custom } from '../utils/custom-data-guards';
import {
  ANNOTATION_KIND_LABEL,
  ANNOTATION_KIND_OPTION_LABEL,
} from '../constants';

/**
 * Form-field-name prefixes used by v1's legacy custom renderer to decide
 * whether to draw v1 chrome. Replicates v1's `CustomRendererService` filter
 * so the legacy branch of the dispatcher is bit-identical to today.
 */
const V1_FIELD_PREFIXES = [
  'custom-signature-',
  'custom-name-',
  'custom-initials-',
  'custom-date-',
  'custom-custom-',
] as const;

/** Cached overlay so PSPDFKit's repeated render calls reuse one DOM node. */
interface OverlayCacheEntry {
  readonly annotation: AnnotationsUnion;
  readonly componentRef: ComponentRef<FieldOverlayComponent>;
  readonly hostNode: HTMLElement;
}

function isV1LegacyWidget(
  annotation: AnnotationsUnion,
  PSPDFKit: typeof import('@nutrient-sdk/viewer').default
): boolean {
  if (!(annotation instanceof PSPDFKit.Annotations.WidgetAnnotation)) {
    return false;
  }
  const formFieldName = annotation.formFieldName;
  if (typeof formFieldName !== 'string') {
    return false;
  }
  return V1_FIELD_PREFIXES.some(prefix => formFieldName.startsWith(prefix));
}

/** Safely access an annotation's customData as a generic record. */
function getCustomData(
  annotation: AnnotationsUnion
): Record<string, unknown> | undefined {
  return annotation.customData as Record<string, unknown> | undefined;
}

/** Extract the groupId from an annotation's customData, if present. */
function getGroupId(annotation: AnnotationsUnion): string | undefined {
  const cd = getCustomData(annotation);
  return typeof cd?.groupId === 'string' ? cd.groupId : undefined;
}

/** Extract the optionIndex from an annotation's customData, if present. */
function getOptionIndex(annotation: AnnotationsUnion): number | undefined {
  const cd = getCustomData(annotation);
  return typeof cd?.optionIndex === 'number' ? cd.optionIndex : undefined;
}

/** Snapshot a Rect-like into a plain bbox tuple for the lastKnownBbox map. */
function snapBbox(b: {
  left: number;
  top: number;
  width: number;
  height: number;
}): { left: number; top: number; width: number; height: number } {
  return { left: b.left, top: b.top, width: b.width, height: b.height };
}

/**
 * Internal glue between the v2 framework and PSPDFKit.
 *
 * Owns the SINGLE `setCustomRenderers` callback for the `<pdf-viewer>`
 * instance under this provider scope. Dispatches each annotation render call:
 * - v2 (`customData.schemaVersion === 2`) → mount `FieldOverlayComponent`
 * - v1 legacy (prefix-matched `formFieldName`) → call `createCustomRenderer`
 * - other → return null (PSPDFKit's own rendering wins)
 *
 * Also wires the global `annotations.press` listener: when the pressed
 * annotation is v2 signature, the plugin's `onPress` opens the signature
 * modal (PSPDFKit's native modal-trigger breaks once a custom renderer is
 * registered, even with `append: true`).
 *
 * Scoping: provided by `provideFieldFramework()`, NOT `providedIn: 'root'`.
 * Multiple `<pdf-viewer>` instances on one page each get their own scope
 * and their own bridge.
 */
@Injectable()
export class FieldsBridgeService implements OnDestroy {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  /**
   * Element injector chain at the bridge's provider site. Passed to
   * `createComponent()` when mounting field overlays so they can `inject()`
   * the bridge (and other element-scoped providers) themselves.
   */
  private readonly elementInjector = inject(Injector);

  /** Currently-attached PSPDFKit Instance, if any. */
  private currentInstance: Instance | null = null;
  /** Cached PSPDFKit module. */
  private pspdfkit: typeof import('@nutrient-sdk/viewer').default | null = null;
  /** Cleanup callback for the current instance's listeners + cache. */
  private currentCleanup: VoidFunction | null = null;
  /** annotation-id → cached overlay for the current instance. */
  private readonly overlayCache = new Map<string, OverlayCacheEntry>();
  /** groupId → label annotation id (for label move/delete glue). */
  private readonly groupIdToLabelId = new Map<string, string>();
  /**
   * groupId → ordered list of per-option label annotation ids (index =
   * `customData.optionIndex`). Populated for multi-widget plugins
   * (checkbox / radio); empty for single-widget plugins.
   */
  private readonly groupIdToOptionLabelIds = new Map<string, string[]>();
  /**
   * annotation id → last-known bounding box. Seeded on create + on attach
   * (`indexExistingLabels`). Used by `syncGroupPosition` to compute the
   * (dx, dy) translation to apply to sibling widgets and per-option labels
   * when ANY member of a multi-widget group is dragged. The snap-before-update
   * write is what prevents `instance.update(...)` re-firing this branch in a
   * loop — secondary updates compute (dx === dy === 0) and short-circuit.
   */
  private readonly lastKnownBbox = new Map<
    string,
    { left: number; top: number; width: number; height: number }
  >();
  /**
   * formFieldName → latest committed value. Tracked via `formFieldValues.update`
   * because `getFormFieldValues()` is stale at `annotations.blur` time — the
   * blur event fires BEFORE the typed value commits to PSPDFKit's internal
   * store, so reading directly returned the previous value (causing the
   * "blur twice to format" bug).
   */
  private readonly latestFieldValues = new Map<string, string>();
  /**
   * Currently focused annotation id, or null. Distinct from
   * `selectedAnnotationId` (which press also sets) because format-on-blur
   * needs to know "is the user actively editing this field RIGHT NOW".
   */
  private focusedAnnotationId: string | null = null;

  /** Currently selected annotation id (set by press/focus events), or null. */
  readonly selectedAnnotationId = signal<string | null>(null);
  /** Bumped on any annotation event (create/update/delete) to trigger reactivity. */
  readonly annotationsVersion = signal(0);

  /**
   * How the inspector's assignment section should behave for the current
   * host flow. `null` until a host (template builder, request builder, …)
   * sets it via `setAssignmentMode`. Inspector hides the "Assigned to"
   * section while null.
   */
  readonly assignmentMode = signal<AssignmentMode | null>(null);

  setAssignmentMode(mode: AssignmentMode | null): void {
    this.assignmentMode.set(mode);
  }

  /**
   * Host-supplied authorization gate consulted by the bridge before invoking
   * a plugin's `onPress`. Returns true when the current user is allowed to
   * fill the given annotation.
   *
   * The bridge has no awareness of users / impersonation / app-level entities
   * — that's the host's concern. Fill hosts (signature-attachment, the
   * back-office request document-viewer) feed `userCanFillAnnotation` here so
   * the press dispatcher can gate the signature modal without the plugin
   * itself depending on app-layer code.
   *
   * Null while no host has set it. When null, the bridge skips the gate
   * (builder hosts, where every drop is the user's own field).
   */
  private canFillAnnotationFn:
    | ((annotation: AnnotationsUnion) => boolean)
    | null = null;

  setCanFillAnnotation(
    fn: ((annotation: AnnotationsUnion) => boolean) | null
  ): void {
    this.canFillAnnotationFn = fn;
  }

  ngOnDestroy(): void {
    if (this.currentInstance) {
      this.detach(this.currentInstance);
    }
  }

  /**
   * Read the currently-attached Instance, throwing when nothing is attached.
   * Used by `FieldsService` to find the target of `create` calls.
   */
  requireInstance(): Instance {
    if (!this.currentInstance) {
      throw new Error(
        'FieldsBridgeService: no PSPDFKit instance attached. ' +
          'Ensure provideFieldFramework() is in a scope where the pdf-viewer ' +
          'has called attach(instance).'
      );
    }
    return this.currentInstance;
  }

  /**
   * Look up an annotation by its PSPDFKit id (synchronous).
   *
   * The framework uses this to read current customData for inspector display and
   * for the `FieldsService.update` flow. Reads from the overlay cache
   * (populated on attach + maintained via event listeners).
   *
   * @param annotationId - The PSPDFKit annotation id
   * @returns The live `WidgetAnnotation`, or null if not found
   */
  getAnnotationById(annotationId: string): AnnotationsUnion | null {
    return this.overlayCache.get(annotationId)?.annotation ?? null;
  }

  /**
   * Look up the DOM element for a field annotation (for Floating UI positioning).
   *
   * Returns the rendered host node from the overlay cache, or null if the
   * annotation hasn't been rendered yet or doesn't exist.
   *
   * @param annotationId - The PSPDFKit annotation id
   * @returns The DOM element (HTMLElement), or null if not found
   */
  getFieldElement(annotationId: string): HTMLElement | null {
    return this.overlayCache.get(annotationId)?.hostNode ?? null;
  }

  /**
   * Look up the linked label annotation for a given groupId.
   *
   * Labels are linked to their widget via a shared groupId. This method
   * returns the label annotation if one exists.
   *
   * @param groupId - The groupId from the widget's customData
   * @returns The label annotation, or null if not found
   */
  getLabelAnnotationByGroupId(groupId: string): AnnotationsUnion | null {
    const labelId = this.groupIdToLabelId.get(groupId);
    if (!labelId) return null;
    return this.getAnnotationById(labelId);
  }

  /**
   * Register the bridge as the sole `setCustomRenderers` owner on this
   * Instance and wire the press listener.
   *
   * Idempotent for the same Instance; for a new Instance, detaches the
   * previous one first. Both v1 directives (drop-zone, fill) call `attach`
   * — the second call no-ops because the bridge already owns the dispatch.
   */
  async attach(instance: Instance): Promise<void> {
    if (this.currentInstance === instance) {
      return;
    }
    if (this.currentInstance) {
      this.detach(this.currentInstance);
    }
    this.currentInstance = instance;

    this.pspdfkit = await loadPSPDFKit();
    const PSPDFKit = this.pspdfkit;

    instance.setCustomRenderers({
      Annotation: ({ annotation }) => this.dispatchRender(annotation, PSPDFKit),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onPress = (event: any): void => {
      const annotation = event.annotation as AnnotationsUnion;

      // Labels (field + per-option) are framework-managed and should not be
      // directly selectable.
      const cdKind = getCustomData(annotation)?.kind;
      if (
        cdKind === ANNOTATION_KIND_LABEL ||
        cdKind === ANNOTATION_KIND_OPTION_LABEL
      ) {
        return;
      }

      // Only v2 widgets drive the v2 inspector. Pre-existing PDF form
      // widgets (not created via this framework) and v1 legacy widgets
      // are handled elsewhere — pressing them must NOT set
      // selectedAnnotationId, otherwise the v2 inspector pops open with
      // no meaningful customData to render.
      if (!(annotation instanceof PSPDFKit.Annotations.WidgetAnnotation)) {
        return;
      }
      if (!isV2Custom(annotation.customData)) {
        return;
      }

      // For multi-widget fields (checkbox/radio), redirect selection from any
      // option widget (optionIndex > 0) to the PRIMARY widget so the inspector
      // shows the field consistently and `onPatch` rebuild flows don't strand
      // a stale selectedAnnotationId pointing at a deleted secondary.
      let selectionTargetId = annotation.id;
      const oi = getOptionIndex(annotation);
      if (typeof oi === 'number' && oi !== 0) {
        const groupId = getGroupId(annotation);
        if (groupId) {
          for (const entry of this.overlayCache.values()) {
            const a = entry.annotation;
            if (
              a instanceof PSPDFKit.Annotations.WidgetAnnotation &&
              getGroupId(a) === groupId &&
              getOptionIndex(a) === 0
            ) {
              selectionTargetId = a.id;
              break;
            }
          }
        }
      }
      this.selectedAnnotationId.set(selectionTargetId);

      // Auto-select group members (widget + label + ensemble siblings) on single
      // click. Builder-only: in fill hosts, calling `setSelectedAnnotations`
      // pushes PSPDFKit into annotation-manipulation mode and prevents the
      // form-fill flow (signature modal stays closed). Skip if Shift is held
      // (user manually managing selection) or if any sibling is already
      // selected (user intentionally managing the group).
      const isBuilderHost = this.assignmentMode() !== null;
      const groupId = getGroupId(annotation);
      if (isBuilderHost && groupId && !event.nativeEvent?.shiftKey) {
        const currentSelected = instance.getSelectedAnnotations();
        const selectedIds = new Set<string>(
          currentSelected?.toArray?.().map(a => a.id) ?? []
        );

        // If any sibling is already selected, skip (user is managing the group)
        const siblings = this.getAllAnnotationsWithGroupId(groupId);
        const hasSiblingSelected = siblings.some(a => selectedIds.has(a.id));

        if (!hasSiblingSelected) {
          // PSPDFKit's setSelectedAnnotations expects an `Immutable.List`, not
          // a plain JS array — passing an array silently no-ops in some builds
          // and triggers a type error in strict mode.
          instance.setSelectedAnnotations(
            PSPDFKit.Immutable.List(siblings.map(a => a.id))
          );
        }
      }

      // Builder hosts (template editors) press a field to configure it —
      // never to sign. isBuilderHost is already set above from assignmentMode().
      if (isBuilderHost) {
        return;
      }
      // Fill hosts: gate on the host-supplied authorization callback so
      // the signing modal only opens for the authorized signer.
      if (this.canFillAnnotationFn && !this.canFillAnnotationFn(annotation)) {
        return;
      }
      // `onPress` is absent on TextFormField-based plugins (date, etc.) — their
      // native click behaviour works without intervention. Use `in` narrowing
      // so TypeScript knows we only call it when the property exists.
      const plugin = FIELD_PLUGINS[annotation.customData.type];
      if ('onPress' in plugin) {
        plugin.onPress(instance, annotation);
      }
    };
    instance.addEventListener('annotations.press', onPress);

    const onFocus = ({
      annotation,
    }: {
      annotation: AnnotationsUnion;
    }): void => {
      // Labels are framework-managed and should not be selectable.
      if (getCustomData(annotation)?.kind === ANNOTATION_KIND_LABEL) {
        return;
      }
      // Same gate as onPress: only v2 widgets drive the v2 inspector.
      // Pre-existing PDF form widgets focus into PSPDFKit's native edit
      // mode (text input, checkbox toggle, etc.) and should not pop our
      // inspector. We still record `focusedAnnotationId` for them so
      // unrelated bridge bookkeeping (e.g. format-on-blur skipping
      // currently-focused widgets) keeps working.
      this.focusedAnnotationId = annotation.id;
      if (!(annotation instanceof PSPDFKit.Annotations.WidgetAnnotation)) {
        return;
      }
      if (!isV2Custom(annotation.customData)) {
        return;
      }
      this.selectedAnnotationId.set(annotation.id);
      // Note: parse-on-focus is intentionally NOT applied here. `setFormFieldValues`
      // is async and races with the user's first keystroke after focusing, causing
      // the typed value to be overwritten by the parsed display value. Format-on-blur
      // is enough to guarantee a valid stored value; users edit the formatted text
      // directly (PSPDFKit's input handles selection + replacement fine).
    };
    instance.addEventListener('annotations.focus', onFocus);

    const onBlur = ({
      annotation,
    }: {
      annotation: AnnotationsUnion;
    }): void => {
      this.focusedAnnotationId = null;
      // Defer until after the current task — PSPDFKit fires `annotations.blur`
      // BEFORE the typed value commits to its store and emits the corresponding
      // `formFieldValues.update`. Running synchronously meant the format read
      // a stale value and produced no diff (the dreaded "blur twice to format"
      // bug). A 0-ms timeout lands after both the commit and our update
      // listener has captured it in `latestFieldValues`. The
      // `formFieldValues.update` listener also re-runs format if the commit
      // arrives even later, so this is a belt-and-braces fix.
      setTimeout(() => {
        void this.applyFormatOnBlur(instance, annotation);
      }, 0);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance.addEventListener('annotations.blur' as any, onBlur);

    // PSPDFKit's annotation change events deliver `List<AnnotationsUnion>`
    // (Immutable.js List) directly as the event payload, not wrapped.
    // Convert to plain array for easier consumption.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractAnnotations = (event: any): AnnotationsUnion[] | undefined => {
      if (!event) return undefined;
      if (typeof event.toArray === 'function') return event.toArray();
      if (Array.isArray(event)) return event;
      // Fallback for legacy wrapped form `{ annotations: [...] }`
      if (event.annotations) {
        if (typeof event.annotations.toArray === 'function')
          return event.annotations.toArray();
        if (Array.isArray(event.annotations)) return event.annotations;
      }
      return undefined;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAnnotationCreate = (event: any): void => {
      const annotations = extractAnnotations(event);
      if (annotations) {
        this.handleAnnotationCreate(annotations);
      }
      this.annotationsVersion.update(v => v + 1);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAnnotationUpdate = (event: any): void => {
      const annotations = extractAnnotations(event);
      if (annotations) {
        this.handleAnnotationUpdate(instance, annotations);
      }
      this.annotationsVersion.update(v => v + 1);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAnnotationDelete = (event: any): void => {
      const annotations = extractAnnotations(event);
      if (annotations) {
        this.handleAnnotationDelete(annotations);
      }
      this.annotationsVersion.update(v => v + 1);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance.addEventListener('annotations.create' as any, onAnnotationCreate);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance.addEventListener('annotations.update' as any, onAnnotationUpdate);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance.addEventListener('annotations.delete' as any, onAnnotationDelete);

    // Track latest committed form field values + trigger format-on-blur when
    // the value commits AFTER the blur event (which is when PSPDFKit emits it).
    // Two reasons we care:
    // 1. `applyFormatOnBlur` reads `latestFieldValues` to avoid the stale-read
    //    bug where `getFormFieldValues()` returns the previous value at blur
    //    time.
    // 2. If the commit arrives so late that even the deferred blur handler
    //    misses it, the update handler itself runs format on any non-focused
    //    annotation — guarantees we never need a second blur.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFormFieldValuesUpdate = (event: any): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = event?.toArray?.() ?? (Array.isArray(event) ? event : []);
      for (const item of items) {
        const name = item?.get?.('name') ?? item?.name;
        const value = item?.get?.('value') ?? item?.value;
        if (typeof name !== 'string') continue;


        const valueStr = typeof value === 'string' ? value : '';
        this.latestFieldValues.set(name, valueStr);

        // Find the annotation owning this form field and run format if it's
        // not currently focused (i.e., the user finished editing).
        const annotation = this.findAnnotationByFormFieldName(name);
        if (
          annotation &&
          annotation.id !== this.focusedAnnotationId &&
          isV2Custom(annotation.customData)
        ) {
          const plugin = FIELD_PLUGINS[annotation.customData.type];
          if ('formatValueForDisplay' in plugin) {
            void this.applyFormatOnBlur(instance, annotation);
          }
        }
      }
    };
    instance.addEventListener(
      'formFieldValues.update',
      onFormFieldValuesUpdate
    );

    // Walk every page once to populate `groupIdToLabelId` for annotations
    // hydrated from the initial `instantJSON` load. PSPDFKit does NOT fire
    // `annotations.create` for those, so without this walk the bridge can't
    // sync label position when the user drags a widget on an existing template.
    void this.indexExistingLabels(instance, PSPDFKit);

    // Repair dropdown form fields after load: PSPDFKit's PDF serialization
    // drops the last character of the last option in a ChoiceFormField's
    // saved options list. customData round-trips correctly (it's preserved
    // verbatim as a JSON blob on the widget), so we use it as the source of
    // truth and rebuild the form field's options list to match. Without
    // this, the user sees `option02` truncated to `option0` in the popup
    // (and committed truncated when they pick it).
    void this.repairDropdownFormFieldsFromCustomData(instance, PSPDFKit);

    this.currentCleanup = (): void => {
      instance.removeEventListener('annotations.press', onPress);
      instance.removeEventListener('annotations.focus', onFocus);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance.removeEventListener('annotations.blur' as any, onBlur);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance.removeEventListener('annotations.create' as any, onAnnotationCreate);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance.removeEventListener('annotations.update' as any, onAnnotationUpdate);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance.removeEventListener('annotations.delete' as any, onAnnotationDelete);
      instance.removeEventListener(
        'formFieldValues.update',
        onFormFieldValuesUpdate
      );
      try {
        instance.setCustomRenderers({});
      } catch (e) {
        console.error('Failed to clear PSPDFKit custom renderers:', e);
      }
      for (const entry of this.overlayCache.values()) {
        entry.componentRef.destroy();
      }
      this.overlayCache.clear();
      this.groupIdToLabelId.clear();
      this.latestFieldValues.clear();
    };
  }

  /**
   * Tear down everything attached to this Instance. Safe to call when
   * nothing is attached or when called with a different Instance.
   */
  detach(instance: Instance): void {
    if (this.currentInstance !== instance) {
      return;
    }
    this.currentCleanup?.();
    this.currentCleanup = null;
    this.currentInstance = null;
    this.pspdfkit = null;
    this.selectedAnnotationId.set(null);
  }

  /** Check whether a label annotation is currently tracked for a given groupId. */
  hasLabelForGroup(groupId: string): boolean {
    return this.groupIdToLabelId.has(groupId);
  }

  /** Manually register a label annotation in the tracking map, before its create event fires. */
  trackLabel(groupId: string, labelId: string): void {
    this.groupIdToLabelId.set(groupId, labelId);
  }

  /**
   * Manually sync the bridge's cache with a freshly-updated annotation.
   *
   * Needed because PSPDFKit may NOT fire `annotations.update` after a
   * programmatic `instance.update()`. Without this:
   * - the cache stays stale and inspectors reopening the same field read
   *   old customData;
   * - the mounted `FieldOverlayComponent`'s `data` input is also never
   *   refreshed, so reactive computeds (e.g. `isOrphan`) stick on stale
   *   state — the overlay keeps showing the previous chrome even after
   *   the user patched signee/signer/etc.
   *
   * Both are addressed here: cache is updated AND the overlay's input is
   * pushed forward so its OnPush computeds re-evaluate.
   */
  syncCachedAnnotation(annotation: AnnotationsUnion): void {
    const entry = this.overlayCache.get(annotation.id);
    if (entry) {
      this.overlayCache.set(annotation.id, { ...entry, annotation });
      entry.componentRef.setInput('data', annotation.customData);
    }
    this.annotationsVersion.update(v => v + 1);
  }

  private handleAnnotationCreate(annotations: AnnotationsUnion[]): void {
    // Track groupId → labelId mapping for label sync glue.
    // Process labels FIRST so widgets in the same batch can detect them.
    if (!this.pspdfkit) return;
    const PSPDFKit = this.pspdfkit;

    // Pass 1: track newly-created label and option-label annotations,
    // and seed lastKnownBbox for them.
    for (const ann of annotations) {
      if (ann instanceof PSPDFKit.Annotations.TextAnnotation) {
        const cd = getCustomData(ann);
        const groupId =
          typeof cd?.groupId === 'string' ? cd.groupId : undefined;
        if (cd?.kind === ANNOTATION_KIND_LABEL && groupId) {
          this.groupIdToLabelId.set(groupId, ann.id);
          this.lastKnownBbox.set(ann.id, snapBbox(ann.boundingBox));
        } else if (
          cd?.kind === ANNOTATION_KIND_OPTION_LABEL &&
          groupId &&
          typeof cd.optionIndex === 'number'
        ) {
          const list = this.groupIdToOptionLabelIds.get(groupId) ?? [];
          list[cd.optionIndex] = ann.id;
          this.groupIdToOptionLabelIds.set(groupId, list);
          this.lastKnownBbox.set(ann.id, snapBbox(ann.boundingBox));
        }
      }
    }

    // Pass 2: handle v2 widgets — seed lastKnownBbox + detect paste
    // (groupId collision) and undo/restore (groupId orphan with non-empty
    // label).
    for (const ann of annotations) {
      if (
        ann instanceof PSPDFKit.Annotations.WidgetAnnotation &&
        isV2Custom(ann.customData)
      ) {
        // Seed last-known bbox for every v2 widget — required so the FIRST
        // drag after creation computes a correct (dx, dy) delta in
        // syncGroupPosition rather than treating the move as a phantom from
        // origin.
        this.lastKnownBbox.set(ann.id, snapBbox(ann.boundingBox));

        const groupId = getGroupId(ann);
        if (!groupId) continue;

        if (this.hasOtherWidgetWithGroupId(ann.id, groupId)) {
          // PASTE: another widget already uses this groupId — mint a new one
          void this.handlePastedWidget(ann);
        } else if (
          !this.groupIdToLabelId.has(groupId) &&
          getOptionIndex(ann) === undefined
        ) {
          // UNDO/RESTORE: widget restored without its label — recreate from
          // customData. Skipped for option widgets (optionIndex set) because
          // their per-option labels are recreated by a different code path.
          void this.maybeRecreateLabel(ann, groupId);
        }
      }
    }
  }

  /** Returns true if any cached widget OTHER than `excludeId` has the given groupId. */
  private hasOtherWidgetWithGroupId(
    excludeId: string,
    groupId: string
  ): boolean {
    if (!this.pspdfkit) return false;
    const PSPDFKit = this.pspdfkit;
    for (const entry of this.overlayCache.values()) {
      if (entry.annotation.id === excludeId) continue;
      if (!(entry.annotation instanceof PSPDFKit.Annotations.WidgetAnnotation))
        continue;
      if (getGroupId(entry.annotation) === groupId) return true;
    }
    return false;
  }

  /**
   * Get all annotations (widget + label) that share a given groupId.
   * Used by the group-selection auto-sync to select all related items together.
   */
  private getAllAnnotationsWithGroupId(groupId: string): AnnotationsUnion[] {
    const results: AnnotationsUnion[] = [];

    // Add all widgets with this groupId
    for (const entry of this.overlayCache.values()) {
      if (getGroupId(entry.annotation) === groupId) {
        results.push(entry.annotation);
      }
    }

    // Add the linked label if it exists
    const labelId = this.groupIdToLabelId.get(groupId);
    if (labelId) {
      for (const entry of this.overlayCache.values()) {
        if (entry.annotation.id === labelId) {
          results.push(entry.annotation);
          break;
        }
      }
    }

    return results;
  }

  /**
   * Handle a pasted widget: a widget was created with a groupId already used
   * by another widget. Mint a new groupId on the pasted widget and create a
   * fresh label if the original had one.
   */
  private async handlePastedWidget(widget: AnnotationsUnion): Promise<void> {
    if (!this.pspdfkit || !this.currentInstance) return;
    const PSPDFKit = this.pspdfkit;
    if (!(widget instanceof PSPDFKit.Annotations.WidgetAnnotation)) return;

    try {
      const newGroupId = PSPDFKit.generateInstantId();
      const customData = getCustomData(widget) ?? {};
      const updatedCustomData = { ...customData, groupId: newGroupId };
      const updatedWidget = widget.set(
        'customData',
        updatedCustomData as Record<string, unknown>
      );

      await this.currentInstance.update(updatedWidget);
      this.syncCachedAnnotation(updatedWidget);

      // If the original carried a label, create a new one for the pasted widget
      const label = customData.label;
      if (typeof label === 'string' && label.length > 0) {
        const labelId = PSPDFKit.generateInstantId();
        this.groupIdToLabelId.set(newGroupId, labelId);
        const labelAnn = PSPDFKit.Annotations.fromSerializableObject(
          makeLabelAnnotation({
            id: labelId,
            pageIndex: widget.pageIndex,
            widgetBbox: {
              x: widget.boundingBox.left,
              y: widget.boundingBox.top,
              w: widget.boundingBox.width,
              h: widget.boundingBox.height,
            },
            text: label,
            groupId: newGroupId,
            fieldType:
              typeof customData.type === 'string' ? customData.type : 'unknown',
          })
        );
        await this.currentInstance.create(labelAnn);
      }
    } catch (e) {
      console.error('Failed to handle pasted widget:', e);
    }
  }

  /**
   * Handle a restored widget (e.g., undo-after-delete): if the widget has a
   * non-empty `customData.label` but no label annotation exists for its
   * groupId, recreate the label.
   */
  private async maybeRecreateLabel(
    widget: AnnotationsUnion,
    groupId: string
  ): Promise<void> {
    if (!this.pspdfkit || !this.currentInstance) return;
    const PSPDFKit = this.pspdfkit;
    if (!(widget instanceof PSPDFKit.Annotations.WidgetAnnotation)) return;

    try {
      const customData = getCustomData(widget);
      const label = customData?.label;
      if (typeof label !== 'string' || label.length === 0) return;

      // Check if a label for this groupId actually exists on the page
      // (could be in the same create batch but processed after the widget).
      const pageAnnotations = await this.currentInstance.getAnnotations(
        widget.pageIndex
      );
      const existing = pageAnnotations.find(a => {
        if (!(a instanceof PSPDFKit.Annotations.TextAnnotation)) return false;
        const cd = getCustomData(a);
        return cd?.kind === ANNOTATION_KIND_LABEL && cd?.groupId === groupId;
      });
      if (existing) {
        // Already exists — just track it
        this.groupIdToLabelId.set(groupId, existing.id);
        return;
      }

      // Recreate the label
      const labelId = PSPDFKit.generateInstantId();
      this.groupIdToLabelId.set(groupId, labelId);
      const labelAnn = PSPDFKit.Annotations.fromSerializableObject(
        makeLabelAnnotation({
          id: labelId,
          pageIndex: widget.pageIndex,
          widgetBbox: {
            x: widget.boundingBox.left,
            y: widget.boundingBox.top,
            w: widget.boundingBox.width,
            h: widget.boundingBox.height,
          },
          text: label,
          groupId,
          fieldType:
            typeof customData?.type === 'string' ? customData.type : 'unknown',
        })
      );
      await this.currentInstance.create(labelAnn);
    } catch (e) {
      console.error('Failed to recreate label:', e);
    }
  }

  private handleAnnotationUpdate(
    instance: Instance,
    annotations: AnnotationsUnion[]
  ): void {
    // Update overlay cache with new annotations and sync linked label position.
    // When the user drags/resizes a widget, PSPDFKit fires this event after the
    // operation completes, and we sync the label's position to match.
    if (!this.pspdfkit) return;
    const PSPDFKit = this.pspdfkit;

    for (const ann of annotations) {
      if (
        ann instanceof PSPDFKit.Annotations.WidgetAnnotation &&
        isV2Custom(ann.customData)
      ) {
        const entry = this.overlayCache.get(ann.id);
        if (entry) {
          this.overlayCache.set(ann.id, { ...entry, annotation: ann });
        }

        const groupId = getGroupId(ann);
        if (!groupId) continue;

        // Multi-widget group (checkbox/radio): translate sibling widgets
        // and option-labels by the same (dx, dy). The single field-level
        // label is included via the existing groupIdToLabelId helper inside
        // syncGroupPosition.
        if (this.groupIdToOptionLabelIds.has(groupId)) {
          void this.syncGroupPosition(instance, ann, groupId);
        } else {
          // Single-widget plugin: keep the original label-only sync.
          void this.syncLabelPosition(instance, ann, groupId);
        }
      } else if (ann instanceof PSPDFKit.Annotations.TextAnnotation) {
        // Keep lastKnownBbox fresh for label/option-label moves so future
        // syncGroupPosition deltas remain accurate.
        this.lastKnownBbox.set(ann.id, snapBbox(ann.boundingBox));
      }
    }
  }

  /**
   * Translate every sibling widget + linked field label + per-option labels
   * by the same (dx, dy) computed from `movedWidget`'s last-known bbox.
   *
   * Called from `handleAnnotationUpdate` when a multi-widget plugin's
   * member is dragged. The snap-before-update write to `lastKnownBbox`
   * is critical: PSPDFKit re-fires `annotations.update` for the siblings we
   * update below, and on those re-entries we want the delta computation to
   * yield (0, 0) and short-circuit.
   *
   * Resize is intentionally not propagated — only width/height changes
   * yield (dx, dy) = (0, 0) and exit early. Per-widget resize is allowed
   * for V1 (deliberate).
   */
  private async syncGroupPosition(
    instance: Instance,
    movedWidget: AnnotationsUnion,
    groupId: string
  ): Promise<void> {
    if (!this.pspdfkit) return;
    const PSPDFKit = this.pspdfkit;
    if (!(movedWidget instanceof PSPDFKit.Annotations.WidgetAnnotation)) return;

    const cur = movedWidget.boundingBox;
    const snapCur = snapBbox(cur);
    const prev = this.lastKnownBbox.get(movedWidget.id);
    if (!prev) {
      // First time we see this widget — record bbox, nothing to translate.
      this.lastKnownBbox.set(movedWidget.id, snapCur);
      return;
    }
    const dx = snapCur.left - prev.left;
    const dy = snapCur.top - prev.top;
    if (dx === 0 && dy === 0) {
      // Resize-only or no-op. Keep the recorded bbox fresh (width/height
      // may have changed) but don't translate siblings.
      this.lastKnownBbox.set(movedWidget.id, snapCur);
      return;
    }

    // Snap-before-update: prevents the secondary annotations.update event
    // (fired by our own instance.update below) from re-triggering this
    // branch in a feedback loop.
    this.lastKnownBbox.set(movedWidget.id, snapCur);

    try {
      const pageAnnotations = await instance.getAnnotations(
        movedWidget.pageIndex
      );

      const memberIds = new Set<string>();
      // Sibling widgets: any widget on this page with the same groupId
      // (excluding the one that just moved).
      pageAnnotations.forEach(a => {
        if (a.id === movedWidget.id) return;
        if (
          a instanceof PSPDFKit.Annotations.WidgetAnnotation &&
          isV2Custom(a.customData) &&
          getGroupId(a) === groupId
        ) {
          memberIds.add(a.id);
        }
      });
      // Field-level label.
      const fieldLabelId = this.groupIdToLabelId.get(groupId);
      if (fieldLabelId) memberIds.add(fieldLabelId);
      // Per-option labels.
      const optionLabelIds = this.groupIdToOptionLabelIds.get(groupId) ?? [];
      for (const id of optionLabelIds) {
        if (typeof id === 'string') memberIds.add(id);
      }

      const updates: AnnotationsUnion[] = [];
      pageAnnotations.forEach(a => {
        if (!memberIds.has(a.id)) return;
        const mb = a.boundingBox;
        const next = new PSPDFKit.Geometry.Rect({
          left: mb.left + dx,
          top: mb.top + dy,
          width: mb.width,
          height: mb.height,
        });
        // Snap the destination bbox so the subsequent annotations.update
        // event computes (dx === dy === 0) and short-circuits.
        this.lastKnownBbox.set(a.id, snapBbox(next));
        updates.push(a.set('boundingBox', next));
      });

      if (updates.length > 0) {
        await instance.update(updates);
      }
    } catch (e) {
      console.error('Failed to sync group position:', e);
    }
  }

  /**
   * Sync the label TextAnnotation's position to follow the widget when moved/resized.
   *
   * Called after drag/resize operations complete. Reads label by groupId from the
   * tracking map, computes new bbox above the widget, and updates only if changed
   * to avoid feedback loops.
   */
  private async syncLabelPosition(
    instance: Instance,
    widget: AnnotationsUnion,
    groupId: string
  ): Promise<void> {
    if (!this.pspdfkit) return;
    const PSPDFKit = this.pspdfkit;
    if (!(widget instanceof PSPDFKit.Annotations.WidgetAnnotation)) return;

    const labelId = this.groupIdToLabelId.get(groupId);
    if (!labelId) return;

    try {
      const pageAnnotations = await instance.getAnnotations(widget.pageIndex);
      const label = pageAnnotations.find(a => a.id === labelId);
      if (!label || !(label instanceof PSPDFKit.Annotations.TextAnnotation)) {
        return;
      }

      const newBbox = new PSPDFKit.Geometry.Rect({
        left: widget.boundingBox.left,
        top: widget.boundingBox.top - LABEL_GAP_PX - LABEL_HEIGHT_PX,
        width: widget.boundingBox.width,
        height: LABEL_HEIGHT_PX,
      });

      // Skip no-op updates to prevent infinite event loops
      const cur = label.boundingBox;
      if (
        cur.left === newBbox.left &&
        cur.top === newBbox.top &&
        cur.width === newBbox.width &&
        cur.height === newBbox.height
      ) {
        return;
      }

      await instance.update(label.set('boundingBox', newBbox));
    } catch (e) {
      console.error('Failed to sync label position:', e);
    }
  }

  private handleAnnotationDelete(annotations: AnnotationsUnion[]): void {
    // - When a widget is deleted: cascade-delete its label, close the inspector
    //   if the deleted widget was selected.
    // - When ANY widget in a multi-widget group is deleted: cascade-delete
    //   ALL siblings + the field label + ALL option labels.
    // - When a label is deleted manually (independently): clear the linked
    //   widget's `customData.label` so the inspector reflects the actual state.
    if (!this.pspdfkit || !this.currentInstance) return;
    const PSPDFKit = this.pspdfkit;

    const idsToDelete = new Set<string>();
    const orphanedGroupIds: string[] = [];
    const groupsCleared = new Set<string>();

    for (const ann of annotations) {
      if (
        ann instanceof PSPDFKit.Annotations.WidgetAnnotation &&
        isV2Custom(ann.customData)
      ) {
        // Field deleted → close inspector if it was selected
        if (this.selectedAnnotationId() === ann.id) {
          this.selectedAnnotationId.set(null);
        }
        const groupId = getGroupId(ann);
        if (groupId && !groupsCleared.has(groupId)) {
          groupsCleared.add(groupId);

          // Cascade-delete the field-level label
          const labelId = this.groupIdToLabelId.get(groupId);
          if (labelId && labelId !== ann.id) {
            idsToDelete.add(labelId);
          }
          this.groupIdToLabelId.delete(groupId);

          // Cascade-delete sibling widgets (multi-widget group). PSPDFKit
          // does NOT auto-cascade widgets when a peer is deleted — we have
          // to enumerate them ourselves.
          const optionLabelIds =
            this.groupIdToOptionLabelIds.get(groupId) ?? [];
          for (const id of optionLabelIds) {
            if (typeof id === 'string') idsToDelete.add(id);
          }
          this.groupIdToOptionLabelIds.delete(groupId);

          for (const entry of this.overlayCache.values()) {
            const sibling = entry.annotation;
            if (sibling.id === ann.id) continue;
            if (
              sibling instanceof PSPDFKit.Annotations.WidgetAnnotation &&
              getGroupId(sibling) === groupId
            ) {
              idsToDelete.add(sibling.id);
            }
          }
        }
        // Drop the cached overlay entry for the deleted widget
        const entry = this.overlayCache.get(ann.id);
        if (entry) {
          entry.componentRef.destroy();
          this.overlayCache.delete(ann.id);
        }
        this.lastKnownBbox.delete(ann.id);
        continue;
      }
      // Label / option-label deleted manually
      const cd = getCustomData(ann);
      const groupId =
        typeof cd?.groupId === 'string' ? cd.groupId : undefined;
      if (cd?.kind === ANNOTATION_KIND_LABEL && groupId) {
        this.groupIdToLabelId.delete(groupId);
        this.lastKnownBbox.delete(ann.id);
        orphanedGroupIds.push(groupId);
      } else if (cd?.kind === ANNOTATION_KIND_OPTION_LABEL && groupId) {
        const list = this.groupIdToOptionLabelIds.get(groupId);
        if (list) {
          const idx = list.indexOf(ann.id);
          if (idx >= 0) list[idx] = '';
          // If every entry is empty, drop the map row entirely.
          if (list.every(v => !v)) {
            this.groupIdToOptionLabelIds.delete(groupId);
          }
        }
        this.lastKnownBbox.delete(ann.id);
      }
    }

    if (idsToDelete.size > 0) {
      this.currentInstance.delete(Array.from(idsToDelete)).catch(e => {
        console.error('Failed to cascade-delete grouped annotations:', e);
      });
      for (const id of idsToDelete) this.lastKnownBbox.delete(id);
    }

    // For each orphaned field label, clear the linked widget's customData.label
    for (const groupId of orphanedGroupIds) {
      void this.clearWidgetLabelForGroup(groupId);
    }
  }

  /**
   * Clear `customData.label` on the widget linked to `groupId`.
   * Called when the user manually deletes a label annotation — keeps the
   * widget's customData in sync with the visual state so the inspector
   * doesn't show a stale value when reopened.
   */
  private async clearWidgetLabelForGroup(groupId: string): Promise<void> {
    if (!this.pspdfkit || !this.currentInstance) return;
    const PSPDFKit = this.pspdfkit;

    try {
      // Find the widget with this groupId in the overlay cache
      let widget: AnnotationsUnion | null = null;
      for (const entry of this.overlayCache.values()) {
        if (
          entry.annotation instanceof PSPDFKit.Annotations.WidgetAnnotation &&
          getGroupId(entry.annotation) === groupId
        ) {
          widget = entry.annotation;
          break;
        }
      }
      if (!widget || !(widget instanceof PSPDFKit.Annotations.WidgetAnnotation))
        return;

      const customData = getCustomData(widget);
      if (!customData || !customData.label) return; // already empty

      const updatedCustomData = { ...customData, label: '' };
      const updatedWidget = widget.set(
        'customData',
        updatedCustomData as Record<string, unknown>
      );
      await this.currentInstance.update(updatedWidget);
      this.syncCachedAnnotation(updatedWidget);
    } catch (e) {
      console.error('Failed to clear widget label after label deletion:', e);
    }
  }

  /**
   * Look up a cached widget annotation by its form-field name.
   * Used by the `formFieldValues.update` listener to map a value-change event
   * back to its owning annotation so we can read its customData.
   */
  private findAnnotationByFormFieldName(
    formFieldName: string
  ): AnnotationsUnion | null {
    if (!this.pspdfkit) return null;
    const PSPDFKit = this.pspdfkit;
    for (const entry of this.overlayCache.values()) {
      const ann = entry.annotation;
      if (
        ann instanceof PSPDFKit.Annotations.WidgetAnnotation &&
        ann.formFieldName === formFieldName
      ) {
        return ann;
      }
    }
    return null;
  }

  /**
   * On annotation blur: ask the field plugin to validate, clamp, and format
   * the value (e.g. add thousands separators on a number field). Reads
   * customData LIVE so inspector edits to min/max/precision take effect
   * without recreating the field.
   *
   * Reads the value from `latestFieldValues` (kept fresh by the
   * `formFieldValues.update` listener) — `instance.getFormFieldValues()` is
   * stale at blur time because PSPDFKit fires blur BEFORE the typed value
   * commits.
   */
  private async applyFormatOnBlur(
    instance: Instance,
    annotation: AnnotationsUnion
  ): Promise<void> {
    if (!this.pspdfkit) return;
    const PSPDFKit = this.pspdfkit;
    if (!(annotation instanceof PSPDFKit.Annotations.WidgetAnnotation)) return;
    if (!isV2Custom(annotation.customData)) return;

    const plugin = FIELD_PLUGINS[annotation.customData.type];
    if (!('formatValueForDisplay' in plugin)) return;

    const formFieldName = annotation.formFieldName;
    if (typeof formFieldName !== 'string') return;

    try {
      const tracked = this.latestFieldValues.get(formFieldName);
      const fallback = instance.getFormFieldValues()[formFieldName];
      const currentStr =
        tracked ?? (typeof fallback === 'string' ? fallback : '');
      const formatted = plugin.formatValueForDisplay(
        currentStr,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        annotation.customData as any
      );
      if (formatted !== currentStr) {
        await instance.setFormFieldValues({ [formFieldName]: formatted });
        this.latestFieldValues.set(formFieldName, formatted);
      }
    } catch (e) {
      console.error('applyFormatOnBlur failed:', e);
    }
  }

  /**
   * Walk every page on attach and populate `groupIdToLabelId` from any label
   * TextAnnotations already in the document.
   *
   * Required because annotations loaded via `PSPDFKit.load({ instantJSON })`
   * (or `applyOperations({ type: 'applyInstantJson' })`) do NOT fire
   * `annotations.create`. Without this walk, the map stays empty until the
   * user creates a fresh field, breaking widget-drag → label-follow on any
   * pre-existing template.
   */
  private async indexExistingLabels(
    instance: Instance,
    PSPDFKit: typeof import('@nutrient-sdk/viewer').default
  ): Promise<void> {
    try {
      const totalPages = instance.totalPageCount;
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const pageAnnotations = await instance.getAnnotations(pageIndex);
        pageAnnotations.forEach(ann => {
          if (ann instanceof PSPDFKit.Annotations.TextAnnotation) {
            const cd = getCustomData(ann);
            const groupId =
              typeof cd?.groupId === 'string' ? cd.groupId : undefined;
            if (cd?.kind === ANNOTATION_KIND_LABEL && groupId) {
              this.groupIdToLabelId.set(groupId, ann.id);
              this.lastKnownBbox.set(ann.id, snapBbox(ann.boundingBox));
            } else if (
              cd?.kind === ANNOTATION_KIND_OPTION_LABEL &&
              groupId &&
              typeof cd.optionIndex === 'number'
            ) {
              const list = this.groupIdToOptionLabelIds.get(groupId) ?? [];
              list[cd.optionIndex] = ann.id;
              this.groupIdToOptionLabelIds.set(groupId, list);
              this.lastKnownBbox.set(ann.id, snapBbox(ann.boundingBox));
            }
            return;
          }
          // Seed lastKnownBbox for v2 widgets so the FIRST drag after
          // page-load yields a correct (dx, dy) delta.
          if (
            ann instanceof PSPDFKit.Annotations.WidgetAnnotation &&
            isV2Custom(ann.customData)
          ) {
            this.lastKnownBbox.set(ann.id, snapBbox(ann.boundingBox));
          }
        });
      }
    } catch (e) {
      console.error('Failed to index existing labels:', e);
    }
  }

  /**
   * Walk every page on attach and rebuild each dropdown's `ComboBoxFormField`
   * options list from its widget's `customData.options`.
   *
   * Why: PSPDFKit's PDF serialization drops the LAST character of the LAST
   * option's label/value when saving form field options. customData (a
   * separate JSON blob on the widget) round-trips correctly, so we use it
   * as the source of truth and rewrite the form field's options on load.
   * Verified end-to-end: customData has full strings; only the form field's
   * options list is corrupted on save+load.
   */
  private async repairDropdownFormFieldsFromCustomData(
    instance: Instance,
    PSPDFKit: typeof import('@nutrient-sdk/viewer').default
  ): Promise<void> {
    try {
      const totalPages = instance.totalPageCount;
      const pending: Promise<void>[] = [];
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const pageAnnotations = await instance.getAnnotations(pageIndex);
        pageAnnotations.forEach(ann => {
          if (!(ann instanceof PSPDFKit.Annotations.WidgetAnnotation)) return;
          if (!isV2Custom(ann.customData)) return;
          if (ann.customData.type !== 'dropdown') return;
          const formFieldName = ann.formFieldName;
          if (typeof formFieldName !== 'string') return;
          const cd = ann.customData as unknown as {
            options?: readonly DropdownOption[];
          };
          const options = cd.options ?? [];
          pending.push(
            syncDropdownFormFieldFromCustomData(
              instance,
              formFieldName,
              options
            )
          );
        });
      }
      await Promise.all(pending);
    } catch (e) {
      console.error(
        'Failed to repair dropdown form fields from customData:',
        e
      );
    }
  }

  private dispatchRender(
    annotation: AnnotationsUnion,
    PSPDFKit: typeof import('@nutrient-sdk/viewer').default
  ): RendererConfiguration | null {
    if (isV2Custom(annotation.customData)) {
      const cd = annotation.customData;
      const isCheckboxOrRadio =
        cd.type === 'checkbox' || cd.type === 'radio';

      // In FILL MODE for checkbox/radio, suppress the v2 overlay on every
      // option widget — PSPDFKit's native checkbox/radio rendering is what
      // the customer should see. Mounting our overlay here would draw a
      // 1px border around the primary widget (visible inconsistency vs
      // siblings) and overlap the native control with our type-badge
      // chrome (the "Checkbox" label + asterisk). The field-level label
      // and per-option labels are still rendered via the plain
      // TextAnnotation branch below.
      const isFillMode = this.assignmentMode() === null;
      if (isFillMode && isCheckboxOrRadio) {
        return null;
      }

      // Multi-widget plugins (checkbox/radio) in builder mode: only mount
      // the overlay on the PRIMARY widget (optionIndex === 0 or absent).
      // Secondary widgets get null so we don't show N badges/required rings
      // per field.
      const oi = getOptionIndex(annotation);
      if (typeof oi === 'number' && oi !== 0) {
        return null;
      }
      return this.mountV2Overlay(annotation);
    }
    // Labels and per-option labels are plain TextAnnotations — let PSPDFKit
    // render them natively. Returning a custom node here (even with
    // `append: true`) suppresses the text on initial load when annotations
    // are hydrated from instantJSON, making labels invisible in
    // builder/fill modes.
    if (annotation instanceof PSPDFKit.Annotations.TextAnnotation) {
      const kind = getCustomData(annotation)?.kind;
      if (kind === ANNOTATION_KIND_LABEL || kind === ANNOTATION_KIND_OPTION_LABEL) {
        return null;
      }
    }
    if (isV1LegacyWidget(annotation, PSPDFKit)) {
      const node = createCustomRenderer(
        annotation,
        this.currentInstance ?? undefined
      );
      return node ? { node, append: true, noZoom: false } : null;
    }
    return null;
  }

  private mountV2Overlay(
    annotation: AnnotationsUnion
  ): RendererConfiguration | null {
    const cd = annotation.customData;
    if (!cd) {
      return null;
    }
    if (!isV2Custom(cd)) {
      return null;
    }

    let entry = this.overlayCache.get(annotation.id);
    if (!entry) {
      const hostNode = document.createElement('div');
      hostNode.setAttribute('data-v2-annotation-id', annotation.id);
      hostNode.style.width = '100%';
      hostNode.style.height = '100%';
      hostNode.style.pointerEvents = 'none';

      const componentRef = createComponent(FieldOverlayComponent, {
        hostElement: hostNode,
        environmentInjector: this.envInjector,
        // Pass the bridge's element injector so the overlay can `inject()`
        // FieldsBridgeService (and any other element-scoped providers) from
        // the same scope where `provideFieldFramework()` lives.
        elementInjector: this.elementInjector,
      });
      componentRef.setInput('data', cd);
      this.appRef.attachView(componentRef.hostView);

      entry = { annotation, componentRef, hostNode };
      this.overlayCache.set(annotation.id, entry);
    } else {
      // Update the data input with the latest customData
      entry.componentRef.setInput('data', annotation.customData);
    }

    entry.componentRef.changeDetectorRef.detectChanges();

    return { node: entry.hostNode, append: true, noZoom: false };
  }
}
