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
 * Flat `customData` shape for a v2 textarea widget.
 *
 * Stored directly on `WidgetAnnotation.customData`; no nested sub-objects.
 *
 * Like text-input, textarea is an **optional-assignment** field:
 * `signee: null` is valid in template-builder mode and does NOT trigger the
 * orphan indicator. Defaults `required: false` — textarea is a generic
 * multi-line text box and most uses do not gate submit on it.
 *
 * The only structural difference from text-input is the underlying
 * `TextFormField` wires `multiLine: true`, giving native multi-line input.
 */
export interface TextareaFieldData {
  /** Discriminates v2 from v1 customData. Always `2` for v2 fields. */
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  /** Field-type literal. Always `'textarea'` for this plugin. */
  readonly type: 'textarea';
  /** Human-readable label for the field (optional). */
  readonly label?: string;
  /** User-facing key for external-system integrations. */
  readonly fieldKey?: string;
  /** Hint text shown inside the widget when no value has been entered. */
  readonly placeholder?: string;
  /**
   * Optional template-time signee assignment. Null is valid for textarea
   * fields — no signee required.
   */
  readonly signee: {
    readonly id: string;
    readonly name: string;
    readonly roles: RequestUserRoles[];
  } | null;
  /** Resolved actual filler. Populated at fill time. */
  readonly signer: SignerInfo | null;
  /** True when the field has any value (prefill OR user-driven). */
  readonly filled: boolean;
  /** True when the user has actually interacted with the field. */
  readonly filledByUser: boolean;
  /** Whether the field is uneditable. */
  readonly readonly: boolean;
  /**
   * Whether filling this field is mandatory before submit.
   * Defaults `false` — textarea is a generic free-form text box.
   */
  readonly required?: boolean;
  /** UUID linking widget + label TextAnnotation (for move/delete glue). */
  readonly groupId?: string;
}

/** Default `customData` for a freshly-created textarea field. */
const DEFAULTS: TextareaFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'textarea',
  signee: null,
  signer: null,
  filled: false,
  filledByUser: false,
  readonly: false,
  required: false,
};

export interface TextareaCreateResult {
  readonly widget: WidgetAnnotation;
  readonly formField: TextFormField;
  readonly label?: Serializers.TextAnnotationJSON;
  readonly annotationId: string;
  readonly formFieldName: string;
}

/**
 * Build the live PSPDFKit objects for one textarea widget.
 *
 * Uses `TextFormField` with `multiLine: true` — the only wire-level
 * difference from text-input. PSPDFKit's native multi-line text input
 * handles wrapping, scrollbars, and Enter-to-newline; no custom rendering
 * needed.
 */
export async function createTextareaField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<TextareaFieldData>;
}): Promise<TextareaCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `textarea.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `textarea.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `textarea-${PSPDFKit.generateInstantId()}`;
  const groupId = PSPDFKit.generateInstantId();

  const data: TextareaFieldData = input.data
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
    multiLine: true,
  });

  let label: Serializers.TextAnnotationJSON | undefined;
  if (data.label) {
    label = makeLabelAnnotation({
      id: PSPDFKit.generateInstantId(),
      pageIndex,
      widgetBbox: bbox,
      text: data.label,
      groupId,
      fieldType: 'textarea',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

/**
 * Public plugin object for the textarea field type.
 *
 * Visibility (sidebar tile) is gated by the menu's `newFieldTypes` set under
 * the `PDF_NEW_FIELDS` umbrella flag — see `annotations-menu.component.ts`.
 * The plugin itself is FF-agnostic.
 */
export const textareaPlugin = {
  type: 'textarea' as const,
  label: 'Textarea',
  size: { width: 240, height: 160 },
  defaults: DEFAULTS,
  requiresAssignment: false,
  createField: createTextareaField,
} as const;

export type TextareaPlugin = typeof textareaPlugin;
