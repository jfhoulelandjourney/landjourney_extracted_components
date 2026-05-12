import {
  CdkDropList,
  type CdkDragDrop,
  type CdkDragEnter,
} from '@angular/cdk/drag-drop';
import {
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  AnnotationsUnion,
  Instance,
  List,
  Point,
} from '@nutrient-sdk/viewer';
import { noop } from 'es-toolkit';
import { loadPSPDFKit } from '../documents/pdf-viewer/pspdfkit-loader';
import {
  DEFAULT_FIELD_HEIGHT_PX,
  DEFAULT_FIELD_WIDTH_PX,
  FieldsBridgeService,
  FieldsService,
  isRegisteredFieldType,
} from '../pdf/field-framework';
import type { SignatureInstantJSON } from '../pdf/field-framework/types/instant-json';
import type { AnnotationData, InstantJSON } from './annotation.types';
import { AnnotationFactoryService } from './custom-renderer/annotation-factory.service';
import type { DragData } from './draggable-annotation/draggable-annotation.component';

type AnnotationsPressEvent = {
  annotation: AnnotationsUnion;
  nativeEvent: Event;
  preventDefault?: () => void;
  selected: boolean;
};

type AnnotationsBlurEvent = {
  annotation: AnnotationsUnion;
  nativeEvent: FocusEvent;
};

export interface ProcessedAnnotationDropEvent {
  itemData: DragData;
  pdfViewerInstance: Instance;
  pdfInformation: {
    dropPoint: Point;
    pageIndex: number;
  };
  sourceCdkEvent: CdkDragDrop<DragData>;
}

/**
 * Directive for drag-and-drop PDF annotation creation.
 * Supports signature, name, initials, and date annotations with proper error handling.
 */
@Directive({
  selector: '[lj-pdf-annotation-dropzone]',
  standalone: true,
  exportAs: 'ljPdfAnnotationDropZone',
  hostDirectives: [CdkDropList],
})
export class PdfAnnotationDropZoneDirective implements OnInit, OnDestroy {
  private readonly cdkDropList = inject(CdkDropList);
  private readonly destroyRef = inject(DestroyRef);
  private readonly annotationFactory = inject(AnnotationFactoryService);
  private readonly bridge = inject(FieldsBridgeService);
  private readonly fields = inject(FieldsService);

  // Cached PSPDFKit module for lazy loading
  private pspdfkitModule: Awaited<ReturnType<typeof loadPSPDFKit>> | null =
    null;

  // Configuration inputs
  readonly dropListId = input.required<string>();
  readonly droppable = input(true);
  readonly pdfViewerInstance = input<Instance | null>(null);
  readonly metadata = input<SignatureInstantJSON | null>(null);
  readonly enableAutoSave = input(true);

  // Internal state
  private readonly dropListDisabled = signal(false);
  private readonly isProcessingDrop = signal(false);
  private readonly previousInstance = signal<Instance | null>(null);
  private readonly previousInstanceRemoveListener = signal<VoidFunction>(noop);

  // Outputs
  readonly create = output<{
    annotations: AnnotationsUnion[];
    instantJson: InstantJSON;
  }>();
  readonly annotationDropped = output<ProcessedAnnotationDropEvent>();
  readonly fail = output<{
    code: string;
    message: string;
    context?: unknown;
  }>();
  readonly select = output<List<AnnotationsUnion> | null>();

  constructor() {
    this.setupDropListConfiguration();
    this.setupPdfInstanceManagement();
    this.setupToolbarItems();
  }

  ngOnInit(): void {
    this.setupDropListEventListeners();
  }

  ngOnDestroy(): void {
    // Clean up PSPDFKit listeners
    const removeListeners = this.previousInstanceRemoveListener();
    removeListeners();
    this.previousInstance.set(null);
    this.previousInstanceRemoveListener.set(noop);
  }

  /** Lazily loads and caches the PSPDFKit module */
  private async getPSPDFKit(): Promise<
    Awaited<ReturnType<typeof loadPSPDFKit>>
  > {
    if (!this.pspdfkitModule) {
      this.pspdfkitModule = await loadPSPDFKit();
    }
    return this.pspdfkitModule;
  }

  applyCustomFields(state: SignatureInstantJSON) {
    const instance = this.pdfViewerInstance();
    if (!instance) {
      this.emitError('NO_PDF_INSTANCE', 'PDF viewer instance is not available');
      return;
    }
    instance.applyOperations([
      {
        type: 'applyInstantJson',
        instantJson: state as unknown as InstantJSON,
      },
    ]);
  }

  private setupToolbarItems(): void {
    effect(() => {
      const instance = this.pdfViewerInstance();
      if (instance) {
        instance.setToolbarItems([
          { type: 'sidebar-thumbnails' },
          { type: 'pager-expanded' },
          { type: 'pan' },
          { type: 'zoom-out' },
          { type: 'zoom-in' },
          { type: 'zoom-mode' },
          { type: 'spacer' },
          { type: 'print' },
          { type: 'debug' },
          { type: 'search' },
        ]);
      }
    });
  }

  /** Sets up CDK drop list configuration with optimized effects. */
  private setupDropListConfiguration(): void {
    effect(() => {
      // Configure drop list properties
      this.cdkDropList.disabled =
        this.droppable() === false ? true : this.dropListDisabled();
      this.cdkDropList.id = this.dropListId();
      this.cdkDropList.sortPredicate = () => false;
    });
  }

  /** Manages PDF instance setup and cleanup with proper lifecycle handling. */
  private setupPdfInstanceManagement(): void {
    effect(() => {
      const instance = this.pdfViewerInstance();
      const previousInstance = this.previousInstance();
      const metadata = this.metadata();

      // Only setup if instance changed
      if (instance && instance !== previousInstance) {
        untracked(() => {
          this.setupInstanceFeatures(instance);
          this.previousInstance.set(instance);
        });
      }

      // Clear ID when instance is removed
      if (!instance) {
        untracked(() => {
          this.previousInstance.set(null);
        });
      }

      if (instance && metadata) {
        this.applyCustomFields(metadata);
      }
    });
  }

  /** Sets up PDF instance features (rendering, event listeners). */
  private setupInstanceFeatures(instance: Instance): void {
    try {
      // Hand the instance to the v2 bridge — owns setCustomRenderers and the
      // press dispatcher. Routes v1 customData through the legacy renderer
      // and v2 customData through the FieldOverlayComponent.
      void this.bridge.attach(instance);
      // Setup annotation event listeners
      this.setupAnnotationEventListeners(instance);
      // Setup form design mode if applicable
      instance.setViewState(viewState => viewState.set('formDesignMode', true));
    } catch (error) {
      this.emitError(
        'INSTANCE_SETUP_FAILED',
        'Failed to setup PDF instance features',
        error
      );
    }
  }

  private async selectAnnotation(
    instance: Instance,
    annotation: AnnotationsUnion,
    multiSelect = false
  ): Promise<void> {
    const PSPDFKit = await this.getPSPDFKit();
    const selectedAnnotations = instance.getSelectedAnnotations();
    if (!selectedAnnotations) {
      instance.setSelectedAnnotations(PSPDFKit.Immutable.List([annotation]));
      return;
    }

    if (multiSelect) {
      // If multi-select, add to existing selection
      if (selectedAnnotations.some(ann => ann.id === annotation.id)) {
        return; // Already selected
      }
      instance.setSelectedAnnotations(selectedAnnotations.push(annotation));
    } else {
      // Single select: replace current selection
      instance.setSelectedAnnotations(PSPDFKit.Immutable.List([annotation]));
    }
  }

  private deselectAnnotation(
    instance: Instance,
    annotation: AnnotationsUnion
  ): void {
    const selectedAnnotations = instance.getSelectedAnnotations();
    if (!selectedAnnotations) {
      return;
    }
    const index = selectedAnnotations.findIndex(
      ann => ann.id === annotation.id
    );
    if (index < 0) {
      return;
    }
    instance.setSelectedAnnotations(selectedAnnotations.set(index, annotation));
  }

  /** Sets up PDF annotation event listeners with proper cleanup. */
  private setupAnnotationEventListeners(instance: Instance): void {
    const emitAnnotations = async (annotations: List<AnnotationsUnion>) => {
      try {
        await instance.save();
        const json = await instance.exportInstantJSON();
        this.create.emit({
          annotations: annotations.toArray(),
          instantJson: json,
        });
      } catch (error) {
        this.emitError(
          'ANNOTATION_FAILED',
          'Failed to create or update annotations',
          error
        );
      }
    };

    const handleBlur = (event: AnnotationsBlurEvent) => {
      this.deselectAnnotation(instance, event.annotation);
      this.select.emit(instance.getSelectedAnnotations() ?? null);
    };

    const handleAnnotationPress = (event: AnnotationsPressEvent) => {
      const { nativeEvent, annotation, selected } = event;
      const ev = nativeEvent as PointerEvent;
      if (selected && ev.shiftKey) {
        this.deselectAnnotation(instance, annotation);
      } else if (!selected) {
        this.selectAnnotation(instance, annotation, ev.shiftKey);
      }
      this.select.emit(instance.getSelectedAnnotations() ?? null);
    };

    instance.addEventListener('annotations.create', emitAnnotations);
    instance.addEventListener('annotations.update', emitAnnotations);
    instance.addEventListener('annotations.delete', emitAnnotations);
    instance.addEventListener('annotations.press', handleAnnotationPress);
    instance.addEventListener('annotations.blur', handleBlur);

    this.previousInstanceRemoveListener.set(() => {
      instance.removeEventListener('annotations.create', emitAnnotations);
      instance.removeEventListener('annotations.update', emitAnnotations);
      instance.removeEventListener('annotations.delete', emitAnnotations);
      instance.removeEventListener('annotations.press', handleAnnotationPress);
      instance.removeEventListener('annotations.blur', handleBlur);
    });
  }

  /** Sets up CDK drop list event listeners. */
  private setupDropListEventListeners(): void {
    this.cdkDropList.entered
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.onDragEnter(event));

    this.cdkDropList.dropped
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.onDrop(event));
  }

  /** Handles drag enter with performance optimizations. */
  private onDragEnter(event: CdkDragEnter<DragData>): void {
    if (this.droppable()) {
      this.dropListDisabled.set(false);
      this.hidePlaceholder(event);
    }
  }

  /** Handles drop events with comprehensive validation and error handling. */
  private async onDrop(event: CdkDragDrop<DragData>): Promise<void> {
    // Prevent concurrent drops
    if (this.isProcessingDrop()) {
      this.emitError('CONCURRENT_DROP', 'Drop operation already in progress');
      return;
    }

    this.isProcessingDrop.set(true);

    try {
      await this.processDropEvent(event);
    } catch (error) {
      this.emitError('DROP_PROCESSING_ERROR', 'Failed to process drop event', {
        error,
        event,
      });
    } finally {
      this.dropListDisabled.set(true);
      this.isProcessingDrop.set(false);
    }
  }

  /**
   * Processes drop event with proper validation pipeline.
   */
  private async processDropEvent(
    event: CdkDragDrop<DragData>
  ): Promise<void> {
    const { isValid, errorCode, errorMessage, data, context } =
      await this.validateDropEvent(event);
    if (!isValid || !data) {
      this.emitError(
        errorCode ?? 'UNKNOWN',
        errorMessage ?? 'Unknown error',
        context
      );
      return;
    }

    const { instance, itemData, pdfInfo } = data;

    // Emit drop event
    this.annotationDropped.emit({
      itemData,
      pdfViewerInstance: instance,
      pdfInformation: pdfInfo,
      sourceCdkEvent: event,
    });

    // Create annotation. Drops whose type is registered in `FIELD_PLUGINS`
    // (signature, initials, date, name) always take the v2 path. The v1
    // factory remains as a safety net for legacy types (e.g. `custom`) that
    // have no v2 plugin equivalent.
    const useV2Field = isRegisteredFieldType(itemData.type);

    try {
      if (useV2Field) {
        const fieldType = itemData.type;
        const width = itemData.width ?? DEFAULT_FIELD_WIDTH_PX;
        const height = itemData.height ?? DEFAULT_FIELD_HEIGHT_PX;
        await this.fields.create({
          type: fieldType,
          pageIndex: pdfInfo.pageIndex,
          // v2 anchors the field's top-left corner at the cursor (vs v1's
          // mouse-centered placement); the relevant trade-off is recorded in
          // the rollout plan.
          bbox: {
            x: pdfInfo.dropPoint.x,
            y: pdfInfo.dropPoint.y,
            w: width,
            h: height,
          },
          data: {
            signee: itemData.signee
              ? {
                  id: itemData.signee.id,
                  name: itemData.signee.name,
                  roles: [...itemData.signee.roles],
                }
              : null,
            signer: itemData.signer ?? null,
          },
        });
      } else {
        await this.annotationFactory.createAnnotation({
          instance,
          pageIndex: pdfInfo.pageIndex,
          dropPoint: pdfInfo.dropPoint,
          annotationData: itemData,
        });
      }
    } catch (error) {
      this.emitError(
        'ANNOTATION_CREATION_FAILED',
        `Failed to create ${itemData.type} annotation`,
        { error, itemData }
      );
    }
  }

  /**
   * Validates drop event and extracts required data.
   */
  private async validateDropEvent(event: CdkDragDrop<DragData>): Promise<{
    isValid: boolean;
    errorCode?: string;
    errorMessage?: string;
    context?: unknown;
    data?: {
      instance: Instance;
      itemData: AnnotationData;
      pdfInfo: { dropPoint: Point; pageIndex: number };
    };
  }> {
    // Validate PDF instance
    const instance = this.pdfViewerInstance();
    if (!instance) {
      return {
        isValid: false,
        errorCode: 'NO_PDF_INSTANCE',
        errorMessage: 'PDF viewer instance not available',
      };
    }

    // Validate item data
    const itemData = event.item.data;
    if (!itemData?.type) {
      return {
        isValid: false,
        errorCode: 'INVALID_ITEM_DATA',
        errorMessage: 'Invalid or missing annotation type',
        context: { itemData },
      };
    }

    // Validate drop zone
    if (!this.isDroppedInZone(event)) {
      return {
        isValid: false,
        errorCode: 'OUTSIDE_DROP_ZONE',
        errorMessage: 'Item dropped outside designated drop zone',
      };
    }

    // Validate and transform coordinates
    const { success, errorCode, errorMessage, data, context } =
      await this.transformDropCoordinates(instance, event);
    if (!success || !data) {
      return {
        isValid: false,
        errorCode,
        errorMessage,
        context,
      };
    }

    return {
      isValid: true,
      data: {
        instance,
        itemData,
        pdfInfo: data,
      },
    };
  }

  /** Transforms drop coordinates to PDF space. */
  private async transformDropCoordinates(
    instance: Instance,
    event: CdkDragDrop<DragData>
  ): Promise<{
    success: boolean;
    data?: { dropPoint: Point; pageIndex: number };
    errorCode?: string;
    errorMessage?: string;
    context?: unknown;
  }> {
    try {
      const pageIndex = instance.viewState.currentPageIndex;
      if (pageIndex === undefined || pageIndex === null) {
        return {
          success: false,
          errorCode: 'NO_PAGE_INDEX',
          errorMessage: 'Could not determine current page index',
        };
      }

      const PSPDFKit = await this.getPSPDFKit();
      const clientPoint = new PSPDFKit.Geometry.Point(event.dropPoint);
      const pdfPoint = instance.transformContentClientToPageSpace(
        clientPoint,
        pageIndex
      );

      if (!pdfPoint) {
        return {
          success: false,
          errorCode: 'COORDINATE_TRANSFORM_FAILED',
          errorMessage: 'Could not transform coordinates to PDF space',
          context: { clientPoint, pageIndex },
        };
      }

      return {
        success: true,
        data: { dropPoint: pdfPoint, pageIndex },
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 'COORDINATE_TRANSFORM_ERROR',
        errorMessage: 'Error during coordinate transformation',
        context: { error },
      };
    }
  }

  /**
   * Checks if drop point is within the designated drop zone.
   */
  private isDroppedInZone(event: CdkDragDrop<DragData>): boolean {
    const rect = event.container.element.nativeElement.getBoundingClientRect();
    const { x, y } = event.dropPoint;

    return (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
  }

  /**
   * Hides CDK drag placeholder for better visual experience.
   */
  private hidePlaceholder(event: CdkDragEnter<DragData>): void {
    const placeholder =
      event.container.element.nativeElement.querySelector<HTMLElement>(
        '.cdk-drag-placeholder'
      );

    if (placeholder) {
      placeholder.style.display = 'none';
    }
  }

  /**
   * Emits structured error events with proper context.
   */
  private emitError(code: string, message: string, context?: unknown): void {
    console.error(`[PdfAnnotationDropZone] ${message}`, context);
    this.fail.emit({ code, message, context });
  }
}
