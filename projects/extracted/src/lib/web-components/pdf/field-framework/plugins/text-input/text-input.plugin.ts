import type {
  Serializers,
  TextFormField,
  WidgetAnnotation,
} from '@nutrient-sdk/viewer';
import type { RequestUserRoles } from '../../../../../models/requestModels';
import { loadPSPDFKit } from '../../../../documents/pdf-viewer/pspdfkit-loader';
import { makeLabelAnnotation } from '../../api/label';
import type { Bbox } from '../../api/types';
import { FIELD_DATA_SCHEMA_VERSION } from '../../constants';
import type { SignerInfo } from '../../types/field-data';
export type { Bbox };

/**
 * Flat `customData` shape for a v2 text-input widget.
 *
 * Stored directly on `WidgetAnnotation.customData`; no nested sub-objects.
 *
 * Like date and name, text-input is an **optional-assignment** field:
 * `signee: null` is valid in template-builder mode and does NOT trigger the
 * orphan indicator. The field accepts plain text input and may be left
 * unassigned so any signer can fill it.
 *
 * Unlike name, text-input defaults `required: false` — it's a generic text
 * box and most uses do not gate submit on it. The inspector lets the user
 * mark it required when needed.
 */
export interface TextInputFieldData {
  /** Discriminates v2 from v1 customData. Always `2` for v2 fields. */
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  /** Field-type literal. Always `'text-input'` for this plugin. */
  readonly type: 'text-input';
  /** Human-readable label for the field (optional). */
  readonly label?: string;
  /** User-facing key for external-system integrations. Distinct from PSPDFKit's `formFieldName`. */
  readonly fieldKey?: string;
  /** Hint text shown inside the widget when no value has been entered. */
  readonly placeholder?: string;
  /**
   * Optional template-time signee assignment.
   * Null is valid for text-input fields — no signee required.
   *
   * `roles` is mutable to align with v1's `SigneeInfo.roles: RequestUserRoles[]`
   * — avoids variance casts at the v1-interop boundary.
   * Defensive copy at every patch site keeps stored values effectively immutable.
   */
  readonly signee: {
    readonly id: string;
    readonly name: string;
    readonly roles: RequestUserRoles[];
  } | null;
  /**
   * Resolved actual filler. Populated at fill time from the user system.
   * `null` when no filler is yet known (template / unfilled).
   */
  readonly signer: SignerInfo | null;
  /** True when the field has any value (prefill OR user-driven). */
  readonly filled: boolean;
  /** True when the user has actually interacted with the field. */
  readonly filledByUser: boolean;
  /** Whether the field is uneditable. */
  readonly readonly: boolean;
  /**
   * Whether filling this field is mandatory before submit.
   * Defaults `false` — text-input is a generic text box; most uses do not
   * gate submit on it. Inspector lets the user opt in.
   */
  readonly required?: boolean;
  /** UUID linking widget + label TextAnnotation (for move/delete glue). */
  readonly groupId?: string;
}

/**
 * Default `customData` for a freshly-created text-input field.
 * `required` defaults `false` — the inspector lets the user opt in.
 */
const DEFAULTS: TextInputFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'text-input',
  signee: null,
  signer: null,
  filled: false,
  filledByUser: false,
  readonly: false,
  required: false,
};

/**
 * Output of the plugin's `createField` — the live PSPDFKit objects ready to
 * pass to `instance.create([...])`, plus the SDK-internal names callers need
 * to drive `setFormFieldValues`.
 */
export interface TextInputCreateResult {
  /** Live `WidgetAnnotation` to be passed to `instance.create`. */
  readonly widget: WidgetAnnotation;
  /** Live `TextFormField` to be passed to `instance.create`. */
  readonly formField: TextFormField;
  /** Optional label TextAnnotation (when label is non-empty). */
  readonly label?: Serializers.TextAnnotationJSON;
  /** PSPDFKit annotation id of the widget. */
  readonly annotationId: string;
  /** PSPDFKit form-field name (e.g. `text-input-<uuid>`). */
  readonly formFieldName: string;
}

/**
 * Build the live PSPDFKit objects for one text-input widget.
 *
 * Uses `TextFormField` (not `SignatureFormField`). No `onFormat` action is
 * registered — text-input is plain free-form text and PSPDFKit's native
 * text-field click behaviour (open keyboard / input) works without
 * intervention.
 *
 * @param input.bbox      - Position + size in PDF page space
 * @param input.pageIndex - Zero-based page index
 * @param input.data      - Optional partial overrides (signee, label, etc.)
 */
export async function createTextInputField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<TextInputFieldData>;
}): Promise<TextInputCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `text-input.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `text-input.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `text-input-${PSPDFKit.generateInstantId()}`;
  const groupId = PSPDFKit.generateInstantId();

  const data: TextInputFieldData = input.data
    ? Object.assign({}, DEFAULTS, input.data, { groupId })
    : { ...DEFAULTS, groupId };

  const widget = new PSPDFKit.Annotations.WidgetAnnotation({
    id: annotationId,
    pageIndex,
    boundingBox: new PSPDFKit.Geometry.Rect({
      left: bbox.x,
      top: bbox.y,
      width: bbox.w,
      height: bbox.h,
    }),
    formFieldName,
    customData: { ...data },
    backgroundColor: PSPDFKit.Color.TRANSPARENT,
    borderColor: PSPDFKit.Color.TRANSPARENT,
  });

  const formField = new PSPDFKit.FormFields.TextFormField({
    id: PSPDFKit.generateInstantId(),
    name: formFieldName,
    annotationIds: PSPDFKit.Immutable.List([annotationId]),
  });

  let label: Serializers.TextAnnotationJSON | undefined;
  if (data.label) {
    label = makeLabelAnnotation({
      id: PSPDFKit.generateInstantId(),
      pageIndex,
      widgetBbox: bbox,
      text: data.label,
      groupId,
      fieldType: 'text-input',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

/**
 * Public plugin object for the text-input field type.
 *
 * No `onPress` is defined: PSPDFKit's native text-field click handler
 * (open the OS keyboard / in-page input) works correctly for TextFormField
 * even when `setCustomRenderers` is registered.
 *
 * Visibility (whether the sidebar shows this plugin's draggable tile) is a
 * UI-layer concern handled by the menu component's feature-flag map — see
 * `annotations-menu.component.ts`. The plugin itself is FF-agnostic.
 */
export const textInputPlugin = {
  type: 'text-input' as const,
  label: 'Text',
  size: { width: 200, height: 30 },
  defaults: DEFAULTS,
  requiresAssignment: false,
  createField: createTextInputField,
} as const;

export type TextInputPlugin = typeof textInputPlugin;
