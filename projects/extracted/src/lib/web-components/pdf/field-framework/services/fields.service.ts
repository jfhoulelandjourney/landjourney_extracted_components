import { inject, Injectable } from '@angular/core';
import { loadPSPDFKit } from '../../../documents/pdf-viewer/pspdfkit-loader';
import {
  LABEL_GAP_PX,
  LABEL_HEIGHT_PX,
  makeLabelAnnotation,
} from '../api/label';
import type { Bbox } from '../api/types';
import {
  FIELD_PLUGINS,
  type RegisteredFieldType,
  type V2FieldData,
} from '../plugins/field-plugin';
import { isV2Custom } from '../utils/custom-data-guards';
import { FieldsBridgeService } from './fields-bridge.service';

/**
 * Result of `FieldsService.create`. Both ids identify the same field but
 * are passed to different SDK primitives:
 * - `annotationId` → `instance.update`, `instance.delete`
 * - `formFieldName` → `instance.setFormFieldValues({ [name]: value })`
 */
export interface CreateFieldOutput {
  readonly annotationId: string;
  readonly formFieldName: string;
}

/**
 * Public programmatic API for the v2 PDF field framework.
 *
 * Scoped to `provideFieldFramework()` (NOT `providedIn: 'root'`) so multiple
 * `<pdf-viewer>` instances on the same page each get their own service.
 */
@Injectable()
export class FieldsService {
  private readonly bridge = inject(FieldsBridgeService);

  /** Per-annotationId promise queue to serialize concurrent update calls. */
  private readonly updateQueues = new Map<string, Promise<void>>();

  /**
   * Create a new field on a specific page at a specific position.
   *
   * Internal flow:
   * 1. Resolve the bridge's currently-attached PSPDFKit Instance.
   * 2. Build live `WidgetAnnotation` + FormField via the plugin's
   *    `createField` (mirrors v1's `AnnotationFactoryService` shape).
   * 3. Push both into the instance via `instance.create([...])`.
   *
   * The bridge's `setCustomRenderers` callback then mounts the v2 overlay
   * on the new widget; pressing it fires the plugin's `onPress`, which
   * opens the native signing/initials modal.
   *
   * @param input.type      - Field-type literal (`'signature'` or `'initials'`)
   * @param input.pageIndex - Zero-based page index
   * @param input.bbox      - Position + size in PDF page space
   * @param input.data      - Optional partial overrides (signeeRoles, etc.)
   *
   * @throws Error if no PSPDFKit Instance is currently attached to the bridge
   */
  async create(input: {
    readonly type: RegisteredFieldType;
    readonly pageIndex: number;
    readonly bbox: Bbox;
    readonly data?: Partial<V2FieldData>;
  }): Promise<CreateFieldOutput> {
    const instance = this.bridge.requireInstance();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugin: any = FIELD_PLUGINS[input.type];
    const result = await plugin.createField({
      bbox: input.bbox,
      pageIndex: input.pageIndex,
      data: input.data,
    });

    const PSPDFKit = await loadPSPDFKit();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createList: any[] = [result.widget];
    if (result.extraWidgets) {
      for (const w of result.extraWidgets) createList.push(w);
    }
    createList.push(result.formField);
    if (result.label) {
      createList.push(PSPDFKit.Annotations.fromSerializableObject(result.label));
    }
    if (result.optionLabels) {
      for (const ol of result.optionLabels) {
        createList.push(PSPDFKit.Annotations.fromSerializableObject(ol));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (instance.create as any)(createList);

    return {
      annotationId: result.annotationId,
      formFieldName: result.formFieldName,
    };
  }

  /**
   * Patch a field's customData (readonly, required, label, etc.).
   *
   * Merges the patch into the current customData and writes back via `instance.update`.
   * `readonly` and `required` live ONLY in customData — the framework enforces them
   * itself (press guard in `onPress`, submit gate in
   * `allUserRequiredFieldsFilled`). PSPDFKit's native `readOnly` flags are
   * intentionally not touched: setting them hides the field placeholder.
   *
   * @param annotationId - The PSPDFKit annotation id (from `create`)
   * @param patch        - Partial customData to merge
   */
  async update(
    annotationId: string,
    patch: Partial<V2FieldData>
  ): Promise<void> {
    // Serialize concurrent updates to the same annotation to prevent race conditions
    // (e.g., user typing fast: patch1 and patch2 fire in parallel).
    const previous = this.updateQueues.get(annotationId) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.doUpdate(annotationId, patch));
    this.updateQueues.set(annotationId, next);
    return next;
  }

  /**
   * Apply a patch to a v2 widget. Always reads the FRESH annotation from
   * PSPDFKit (not the bridge's cache) to avoid stale boundingBox issues
   * when the user has dragged the field. This mirrors the over-engineered
   * version's `syncAnnotationCustomData` pattern.
   */
  private async doUpdate(
    annotationId: string,
    patch: Partial<V2FieldData>
  ): Promise<void> {
    const instance = this.bridge.requireInstance();
    const PSPDFKit = await loadPSPDFKit();

    // Use the cache only to find the pageIndex
    const cached = this.bridge.getAnnotationById(annotationId);
    if (!cached) {
      throw new Error(
        `FieldsService.update: annotation ${annotationId} not found`
      );
    }

    // Fetch FRESH annotations from PSPDFKit (cache may have stale boundingBox)
    const pageAnnotations = await instance.getAnnotations(cached.pageIndex);
    const annotation = pageAnnotations.find(a => a.id === annotationId);

    if (!annotation || !isV2Custom(annotation.customData)) {
      throw new Error(
        `FieldsService.update: annotation ${annotationId} not found or not v2`
      );
    }

    // Merge patch into current customData
    const nextCustomData: V2FieldData = {
      ...annotation.customData,
      ...patch,
    } as V2FieldData;

    // Prepare the widget update.
    //
    // `readonly` is intentionally NOT mirrored to `WidgetAnnotation.readOnly`
    // or `FormField.readOnly`: those native flags make PSPDFKit hide / re-skin
    // the signature widget (no placeholder, no native click target). The
    // framework enforces readonly itself — `onSignaturePress` skips when
    // `customData.readonly === true` — and the overlay shows a lock icon. The
    // widget keeps rendering identically to an editable field.
    const updatedWidget = annotation.set(
      'customData',
      nextCustomData as unknown as Record<string, unknown>
    );

    await instance.update(updatedWidget);
    // PSPDFKit may NOT fire annotations.update after programmatic update —
    // manually sync the bridge cache so inspector reads fresh customData
    // when reopened.
    this.bridge.syncCachedAnnotation(updatedWidget);

    // Generic patch hook: each plugin may opt in to sync PSPDFKit primitives
    // that the customData update doesn't reach on its own. The dropdown
    // plugin uses this to rebuild the live `ComboBoxFormField`'s options
    // list when the inspector edits `customData.options`.
    const plugin = FIELD_PLUGINS[nextCustomData.type];
    if ('onPatch' in plugin) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (plugin as any).onPatch({
        instance,
        annotation,
        patch,
        nextCustomData,
      });
    }

    // Handle label changes (separate from widget update to avoid coupling them)
    if ('label' in patch) {
      const newLabel = nextCustomData.label ?? '';
      const groupId = nextCustomData.groupId;

      if (groupId) {
        // Find existing label fresh from page (avoid stale cache)
        const existingLabel = pageAnnotations.find(a => {
          if (!(a instanceof PSPDFKit.Annotations.TextAnnotation)) return false;
          const cd = a.customData as Record<string, unknown> | undefined;
          return cd?.kind === 'label' && cd?.groupId === groupId;
        });

        if (newLabel.length > 0 && existingLabel) {
          // UPDATE label text + position
          const labelBbox = new PSPDFKit.Geometry.Rect({
            left: annotation.boundingBox.left,
            top: annotation.boundingBox.top - LABEL_GAP_PX - LABEL_HEIGHT_PX,
            width: annotation.boundingBox.width,
            height: LABEL_HEIGHT_PX,
          });
          await instance.update(
            existingLabel
              .set('text', { format: 'plain', value: newLabel })
              .set('boundingBox', labelBbox)
          );
        } else if (newLabel.length > 0 && !existingLabel) {
          // CREATE new label
          const labelId = PSPDFKit.generateInstantId();
          this.bridge.trackLabel(groupId, labelId);
          const labelAnn = PSPDFKit.Annotations.fromSerializableObject(
            makeLabelAnnotation({
              id: labelId,
              pageIndex: annotation.pageIndex,
              widgetBbox: {
                x: annotation.boundingBox.left,
                y: annotation.boundingBox.top,
                w: annotation.boundingBox.width,
                h: annotation.boundingBox.height,
              },
              text: newLabel,
              groupId,
              fieldType: nextCustomData.type,
            })
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (instance.create as any)([labelAnn]);
        } else if (newLabel.length === 0 && existingLabel) {
          // DELETE existing label
          await instance.delete(existingLabel.id);
        }
      }
    }
  }

}
