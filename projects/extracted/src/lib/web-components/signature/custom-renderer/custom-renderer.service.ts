// custom-renderer.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import type { AnnotationsUnion, Instance } from '@nutrient-sdk/viewer';
import { loadPSPDFKit } from '../../documents/pdf-viewer/pspdfkit-loader';
import { createCustomRenderer } from './custom-renderer';

@Injectable({ providedIn: 'root' })
export class CustomRendererService implements OnDestroy {
  private readonly CUSTOM_FIELD_PREFIXES = [
    'custom-signature-',
    'custom-name-',
    'custom-initials-',
    'custom-date-',
    'custom-custom-',
  ] as const;

  // Track active instances to clean up properly
  private activeInstances = new Set<Instance>();

  // Cached PSPDFKit module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pspdfkitModule: any = null;

  /**
   * Sets up custom rendering for all annotation types.
   */
  async setupCustomRendering(instance: Instance): Promise<void> {
    // Load PSPDFKit module if not cached
    if (!this.pspdfkitModule) {
      this.pspdfkitModule = await loadPSPDFKit();
    }

    // Track this instance for cleanup
    this.activeInstances.add(instance);

    instance.setCustomRenderers({
      Annotation: ({ annotation }) => {
        // Check if the annotation should use a custom renderer.
        if (!this.shouldUseCustomRenderer(annotation)) {
          return null;
        }

        const customNode = createCustomRenderer(annotation, instance);

        if (!customNode) {
          return null;
        }

        return {
          node: customNode,
          append: true,
          noZoom: false,
        };
      },
    });
  }

  /**
   * Clean up custom renderers for a specific instance.
   */
  cleanupInstance(instance: Instance): void {
    // Remove custom renderers by setting empty renderers
    instance.setCustomRenderers({});
    this.activeInstances.delete(instance);
  }

  /**
   * Clean up all tracked instances.
   */
  ngOnDestroy(): void {
    // Clean up all active instances
    for (const instance of this.activeInstances) {
      this.cleanupInstance(instance);
    }
    this.activeInstances.clear();
  }

  /**
   * Determines if annotation should use custom renderer.
   */
  private shouldUseCustomRenderer(annotation: AnnotationsUnion): boolean {
    const PSPDFKit = this.pspdfkitModule;
    if (!PSPDFKit) return false;

    const isWidgetAnnotation =
      annotation instanceof PSPDFKit.Annotations.WidgetAnnotation;
    if (!isWidgetAnnotation) return false;

    const hasFormFieldName =
      'formFieldName' in annotation &&
      typeof annotation.formFieldName === 'string';
    if (!hasFormFieldName) return false;

    return this.CUSTOM_FIELD_PREFIXES.some(prefix =>
      String(annotation.formFieldName).startsWith(prefix)
    );
  }
}
