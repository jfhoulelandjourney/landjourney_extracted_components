import {
  Signal,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import type { AnnotationsUnion } from '@nutrient-sdk/viewer';
import { isV2Custom, type V2FieldData } from '../utils/custom-data-guards';
import type { RegisteredFieldType } from '../plugins/field-plugin';

interface AnnotationBridge {
  annotationsVersion: Signal<number>;
  getAnnotationById(annotationId: string): AnnotationsUnion | null;
}

/**
 * Abstract base class for per-plugin inspector components.
 *
 * Each plugin's inspector extends this and binds the type literal:
 * ```ts
 * @Component({ ... })
 * export class SignatureInspectorComponent extends BaseFieldInspector<'signature'> {
 *   readonly type = 'signature' as const;
 *   readonly annotationId = input.required<string>();
 *   // ... component template uses this.data()
 * }
 * ```
 *
 * The base wires up:
 * - `annotation` signal (live PSPDFKit annotation from bridge cache)
 * - `data` computed (typed customData, narrowed via isV2Custom)
 * - `patch(...)` helper (writes via FieldsService.update)
 *
 * Concrete components must:
 * - Define `abstract readonly type: K`
 * - Define `readonly annotationId = input.required<string>()`
 *
 * @typeParam K - The plugin's type literal (e.g. `'signature'` or `'initials'`). Narrows `data`
 *   to the corresponding field data type so the template gets full type safety.
 */
export abstract class BaseFieldInspector<K extends RegisteredFieldType> {
  /**
   * Plugin type literal. Concrete subclass binds it via
   * `readonly type = 'signature' as const;`.
   */
  abstract readonly type: K;

  /**
   * The selected annotation's PSPDFKit id. Must be defined by concrete component
   * via `readonly annotationId = input.required<string>();`.
   */
  abstract readonly annotationId: Signal<string>;

  /**
   * The live `WidgetAnnotation` from PSPDFKit, or null if not in bridge cache.
   * Updated via effect when annotationId changes.
   */
  protected readonly annotation: WritableSignal<AnnotationsUnion | null> =
    signal(null);

  /**
   * Typed customData for this plugin's type. Returns null if:
   * - The annotation isn't in cache (annotation() === null)
   * - The annotation is not a WidgetAnnotation
   * - The annotation's customData doesn't match this plugin's type
   *
   * Narrowing is via isV2Custom. Each concrete subclass can override with
   * its specific field data type (SignatureFieldData, InitialsFieldData, etc).
   */
  protected readonly data: Signal<V2FieldData | null> = computed(() => {
    const ann = this.annotation();
    if (!ann) return null;
    // Narrow to WidgetAnnotation to access formFieldName
    const isWidget = 'formFieldName' in ann;
    if (!isWidget) return null;
    const cd: unknown = ann.customData;
    return isV2Custom(cd) && cd.type === this.type ? (cd as V2FieldData) : null;
  });

  /**
   * Re-fetch the annotation from the bridge whenever the annotationId changes.
   * Implemented as a method so concrete subclasses can call it after injecting
   * the bridge themselves, avoiding circular dependency at the base class level.
   */
  protected setupAnnotationTracking(bridge: AnnotationBridge): void {
    effect((): void => {
      // Touch the version signal to register the dependency.
      bridge.annotationsVersion();
      const ann = bridge.getAnnotationById(this.annotationId());
      this.annotation.set(ann);
    });
  }

  /**
   * Patch the field's customData. Concrete subclasses must override this
   * to provide their own FieldsService injection, avoiding circular dependencies.
   *
   * @param patch - Partial customData to merge
   */
  protected abstract patch(patch: Record<string, unknown>): Promise<void>;
}
