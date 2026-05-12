import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import type { AssignmentMode } from '../assignment-mode';
import { isV2Custom } from '../utils/custom-data-guards';
import { FieldsBridgeService } from '../services/fields-bridge.service';
import { INSPECTOR_REGISTRY } from '../plugins/inspector-registry';

/** Bounding rectangle of a PDF field element in screen coordinates. */
interface FieldRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

/** Event fired when a PDF annotation is pressed or clicked. */
interface PSPDFKitAnnotationPressEvent {
  annotation?: { id?: string };
}

/** PSPDFKit instance with event listener support. */
interface PSPDFKitInstance {
  addEventListener(event: 'annotations.press', handler: (e: PSPDFKitAnnotationPressEvent) => void): void;
  removeEventListener(event: 'annotations.press', handler: (e: PSPDFKitAnnotationPressEvent) => void): void;
}

/** Debug API exposed on window for Storybook and testing. */
interface FieldFrameworkDebugApi {
  enabled: boolean;
  toggle(): void;
  enable(): void;
  disable(): void;
}

/**
 * Floating inspector panel for v2 field widgets.
 *
 * Displays a field configuration UI showing the form field name and common controls.
 * Mounts the appropriate plugin-specific inspector for type-specific configuration.
 * Positions intelligently using Floating UI relative to the selected field's bounding box.
 * For v1 annotations, renders nothing.
 */
@Component({
  selector: 'lj-pdf-field-inspector',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field-inspector.component.html',
  styleUrl: './field-inspector.component.scss',
})
export class FieldInspectorComponent {
  private readonly bridge = inject(FieldsBridgeService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Host-supplied assignment mode. Drives the per-plugin inspector's
   * "Assigned to" section: roles multi-select for templates, recipient
   * single-select for requests. Synced into the bridge so plugin inspectors
   * can read it via `bridge.assignmentMode()`.
   */
  readonly assignmentMode = input<AssignmentMode | null>(null);

  readonly selectedAnnotationId = this.bridge.selectedAnnotationId;

  /** Whether debug mode is enabled via URL parameter or window method. */
  readonly showDebug = signal(this.isDebugEnabled());

  /** Whether the debug panel is currently expanded. */
  readonly debugExpanded = signal(false);

  /** Cached field rect for positioning (updated when selection changes). */
  private readonly fieldRect = signal<FieldRect | null>(null);


  /** Panel positioning style (top, left). */
  readonly panelStyle = signal<{ top: string; left: string }>({ top: '0px', left: '0px' });

  private pluginComponentRef: ComponentRef<unknown> | null = null;
  /** Track which annotation the plugin was created for, to prevent unnecessary destruction. */
  private pluginAnnotationId: string | null = null;
  readonly inspectorPanel = viewChild<ElementRef>('inspectorPanel');
  private readonly pluginContainer = viewChild('pluginContainer', { read: ViewContainerRef });

  /** Close inspector on click outside. Arrow function so `this` is always bound. */
  private readonly closeOnClickOutside = (event: MouseEvent): void => {
    const panel = this.inspectorPanel();
    if (!panel) return;

    // Use composedPath() — captures the DOM path at event-dispatch time, BEFORE
    // any Angular re-renders triggered by the click handler. Otherwise a click
    // on a button that toggles its own visibility (e.g. "+ Add new signee"
    // swapping the dropdown for an inline form) would fail the contains check
    // — the original button is no longer in the DOM by the time this fires —
    // and the inspector would incorrectly close.
    const path = event.composedPath();
    if (path.includes(panel.nativeElement)) {
      return;
    }

    this.bridge.selectedAnnotationId.set(null);
  };

  /** The selected annotation for reactive updates. */
  private readonly selectedAnnotation = computed(() => {
    const annotationId = this.selectedAnnotationId();
    if (!annotationId) return null;
    return this.bridge.getAnnotationById(annotationId);
  });

  /** Typed customData of the selected annotation. */
  readonly data = computed(() => {
    const ann = this.selectedAnnotation();
    return isV2Custom(ann?.customData) ? ann.customData : null;
  });

  /** Form Field Name (read-only, internal PSPDFKit identifier). */
  readonly formFieldName = computed(() => {
    const ann = this.selectedAnnotation();
    return (ann && 'formFieldName' in ann) ? ann.formFieldName : '';
  });

  readonly debugInfo = computed(() => {
    // Force re-evaluation on annotation changes
    this.bridge.annotationsVersion();

    const annotation = this.selectedAnnotation();
    if (!annotation) return null;

    let instance: unknown = null;
    try {
      instance = this.bridge.requireInstance();
    } catch {
      // Instance not available
    }

    // Get the annotation's form field name
    const formFieldName = ('formFieldName' in annotation) ? annotation.formFieldName : null;

    // Get form field value from PSPDFKit's public API
    let formFieldValue: { name: string; value: unknown } | null = null;
    if (instance && formFieldName) {
      try {
        const allValues = (instance as unknown as { getFormFieldValues?: () => Record<string, unknown> }).getFormFieldValues?.();
        if (allValues && typeof allValues === 'object' && formFieldName in allValues) {
          formFieldValue = {
            name: formFieldName,
            value: allValues[formFieldName],
          };
        }
      } catch {
        // Silently ignore errors
      }
    }

    // Find linked label annotation via groupId using bridge's public method
    const customData = annotation.customData as Record<string, unknown> | undefined;
    let linkedLabel: { id: string; contents?: string; customData?: Record<string, unknown> | null } | null = null;
    if (customData?.groupId && typeof customData.groupId === 'string') {
      const labelAnn = this.bridge.getLabelAnnotationByGroupId(customData.groupId);
      if (labelAnn) {
        linkedLabel = {
          id: labelAnn.id,
          contents: (labelAnn as unknown as { contents?: string }).contents,
          customData: labelAnn.customData as Record<string, unknown> | null,
        };
      }
    }

    return {
      annotation: annotation ? {
        id: annotation.id,
        type: (annotation as unknown as { type?: string }).type,
        pageIndex: (annotation as unknown as { pageIndex?: number }).pageIndex,
        formFieldName,
        customData: annotation.customData,
        readOnly: (annotation as unknown as { readOnly?: boolean }).readOnly,
        boundingBox: (annotation as unknown as { boundingBox?: Record<string, number> }).boundingBox,
      } : null,
      formFieldValue,
      linkedLabel: linkedLabel ?? undefined,
    };
  });

  readonly debugJson = computed(() => {
    const info = this.debugInfo();
    if (!info) return '';
    return JSON.stringify(info, null, 2);
  });

  constructor() {
    // Initialize window debug API for Storybook and testing environments
    this.initializeDebugApi();

    // Close inspector when user clicks outside of it.
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('click', this.closeOnClickOutside);
    });

    // Sync the host-supplied assignment mode into the bridge so per-plugin
    // inspectors (e.g. SignatureInspectorComponent) can read it.
    effect((): void => {
      const mode = this.assignmentMode();
      if (mode) {
        this.bridge.setAssignmentMode(mode);
      }
    });

    effect((): void => {
      const annotationId = this.selectedAnnotationId();
      if (annotationId) {
        // Inspector is open, add click-outside listener
        document.addEventListener('click', this.closeOnClickOutside);
      } else {
        // Inspector is closed, remove listener
        document.removeEventListener('click', this.closeOnClickOutside);
      }
    });

    // Hide inspector when field is pressed.
    // User must click field again to show inspector.
    effect((): void => {
      const annotationId = this.selectedAnnotationId();
      if (!annotationId) return;

      try {
        const instance = this.bridge.requireInstance() as PSPDFKitInstance;

        // When field is pressed, deselect it (hide inspector) to avoid obstruction during move.
        // Ignore label annotations entirely — they should never be selectable.
        const onAnnotationPress = (event: PSPDFKitAnnotationPressEvent): void => {
          const pressedAnnotation = event?.annotation;

          // Ignore label annotations (TextAnnotations with kind='label')
          if (
            pressedAnnotation &&
            'customData' in pressedAnnotation &&
            (pressedAnnotation.customData as Record<string, unknown> | undefined)?.kind === 'label'
          ) {
            return;
          }

          // Only deselect if the pressed annotation is the currently selected one
          if (pressedAnnotation?.id === annotationId) {
            this.bridge.selectedAnnotationId.set(null);
          }
        };

        instance.addEventListener('annotations.press', onAnnotationPress);

        // Register cleanup.
        this.destroyRef.onDestroy(() => {
          try {
            instance.removeEventListener('annotations.press', onAnnotationPress);
          } catch (e) {
            console.error('Failed to remove PSPDFKit event listeners:', e);
          }
        });
      } catch (e) {
        console.error('Failed to attach PSPDFKit event listeners:', e);
      }
    });

    // Extract field rect from the DOM element and update fieldRect signal.
    // This runs whenever the selected annotation changes.
    effect((): void => {
      const annotationId = this.selectedAnnotationId();

      if (!annotationId) {
        this.fieldRect.set(null);
        return;
      }

      // Get the field element from the bridge cache.
      // The bridge maintains a map of overlay host nodes for each annotation.
      const fieldElement = this.bridge.getFieldElement(annotationId);
      if (!fieldElement) {
        this.fieldRect.set(null);
        return;
      }

      // Extract the bounding rect from the DOM element.
      const rect = fieldElement.getBoundingClientRect();
      this.fieldRect.set({
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      });
    });

    // Mount the appropriate plugin inspector when annotation ID changes.
    // Only depends on annotationId — prevents destruction/recreation when data updates.
    // Tracks pluginAnnotationId to prevent destroying/recreating for the same annotation.
    effect((): void => {
      const annotationId = this.selectedAnnotationId();

      // If no annotation selected, destroy the component
      if (!annotationId) {
        if (this.pluginComponentRef) {
          this.pluginComponentRef.destroy();
          this.pluginComponentRef = null;
          this.pluginAnnotationId = null;
        }
        const pluginVcRef = this.pluginContainer();
        if (pluginVcRef) {
          pluginVcRef.clear();
        }
        return;
      }

      // If component already exists for the SAME annotation, don't touch it
      if (this.pluginComponentRef && this.pluginAnnotationId === annotationId) {
        return;
      }

      // If component exists but for a DIFFERENT annotation, destroy it first
      if (this.pluginComponentRef && this.pluginAnnotationId !== annotationId) {
        this.pluginComponentRef.destroy();
        this.pluginComponentRef = null;
        this.pluginAnnotationId = null;
      }

      // Get current data to check type and container reference
      const data = this.data();
      const pluginVcRef = this.pluginContainer();

      // Only create inspector for v2 field widgets, not for other annotations (like labels)
      if (!data || !pluginVcRef) return;

      // Ignore label annotations — they should never have an inspector
      const annotation = this.selectedAnnotation();
      if (
        annotation &&
        'customData' in annotation &&
        (annotation.customData as Record<string, unknown> | undefined)?.kind === 'label'
      ) {
        return;
      }

      // Create component for this annotation.
      // Uses vcr.createComponent() so the element injector chain is inherited
      // automatically — no need to pass elementInjector/environmentInjector
      // explicitly. Switch to standalone createComponent() if a plugin ever
      // needs content projection or a custom injector override.
      pluginVcRef.clear();
      this.pluginComponentRef = pluginVcRef.createComponent(INSPECTOR_REGISTRY[data.type]);
      this.pluginAnnotationId = annotationId;
      this.pluginComponentRef.setInput('annotationId', annotationId);
    }, { allowSignalWrites: true });

    // Position the inspector panel using Floating UI and a virtual element.
    // The virtual element is created from the field's bounding rect (screen coordinates).
    // Strategy 'fixed' keeps positioning relative to the viewport, not scrolled content.
    effect((): void => {
      const rect = this.fieldRect();
      const panel = this.inspectorPanel();

      if (!rect || !panel) {
        this.panelStyle.set({ top: '0px', left: '0px' });
        return;
      }

      // Create a virtual element using the field's bounding rect.
      // This allows Floating UI to position the inspector relative to the field
      // without needing a direct DOM reference to the field element (important
      // since the field lives inside the PSPDFKit iframe).
      const virtualElement = {
        getBoundingClientRect: () =>
          new DOMRect(rect.left, rect.top, rect.width, rect.height),
      };

      const updatePosition = async (): Promise<void> => {
        const result = await computePosition(virtualElement, panel.nativeElement, {
          strategy: 'fixed',
          placement: 'top',
          middleware: [
            offset(12),
            flip({
              fallbackPlacements: ['bottom', 'top'],
              padding: 12,
            }),
            shift({
              padding: 12,
            }),
          ],
        });

        // `position: fixed` is normally viewport-relative, but any ancestor with
        // a CSS transform creates a new containing block for fixed elements.
        // Dialogs and overlays often apply transforms (e.g. for animations), so
        // we subtract the containing block's offset to keep the panel aligned.
        const containingBlock = this.getFixedContainingBlock(panel.nativeElement);
        this.panelStyle.set({
          top: `${result.y - (containingBlock?.top ?? 0)}px`,
          left: `${result.x - (containingBlock?.left ?? 0)}px`,
        });
      };

      void updatePosition();
    });
  }

  /**
   * Walk up the DOM from `element` and return the bounding rect of the nearest
   * ancestor that creates a new containing block for `position: fixed` elements
   * (i.e. has a CSS transform, perspective, or will-change: transform/perspective).
   * Returns null when the viewport is the containing block (no transformed ancestor).
   */
  private getFixedContainingBlock(element: HTMLElement): DOMRect | null {
    let parent = element.parentElement;
    while (parent && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const willChange = style.willChange ?? '';
      if (
        style.transform !== 'none' ||
        style.perspective !== 'none' ||
        willChange === 'transform' ||
        willChange === 'perspective'
      ) {
        return parent.getBoundingClientRect();
      }
      parent = parent.parentElement;
    }
    return null;
  }

  close(): void {
    this.bridge.selectedAnnotationId.set(null);
  }

  toggleDebug(): void {
    this.debugExpanded.update(v => !v);
  }

  copyDebugJson(): void {
    const json = this.debugJson();
    if (json && typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(json);
    }
  }

  private isDebugEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    // Check window debug API first (runtime toggle)
    const debugApi = (window as unknown as { __fieldFrameworkDebug?: FieldFrameworkDebugApi }).__fieldFrameworkDebug;
    if (debugApi?.enabled === true) return true;
    // Fall back to URL parameter
    const params = new URLSearchParams(window.location.search);
    return params.get('fieldFrameworkDebug') === '1';
  }

  private initializeDebugApi(): void {
    if (typeof window === 'undefined') return;
    const showDebugSignal = this.showDebug;
    // Create global debug API for Storybook and testing
    // Always recreate to ensure current component instance is used
    const debugApi: FieldFrameworkDebugApi = {
      enabled: this.isDebugEnabled(),
      toggle: (): void => {
        debugApi.enabled = !debugApi.enabled;
        showDebugSignal.set(debugApi.enabled);
        // eslint-disable-next-line no-console
        console.log(`[FieldFramework Debug] ${debugApi.enabled ? 'enabled' : 'disabled'}`);
      },
      enable: (): void => {
        debugApi.enabled = true;
        showDebugSignal.set(true);
        // eslint-disable-next-line no-console
        console.log('[FieldFramework Debug] enabled');
      },
      disable: (): void => {
        debugApi.enabled = false;
        showDebugSignal.set(false);
        // eslint-disable-next-line no-console
        console.log('[FieldFramework Debug] disabled');
      },
    };
    (window as unknown as { __fieldFrameworkDebug: FieldFrameworkDebugApi }).__fieldFrameworkDebug = debugApi;
  }
}
