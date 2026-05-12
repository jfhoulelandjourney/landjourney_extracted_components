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
 * Flat `customData` shape for a v2 number widget.
 *
 * Stored directly on `WidgetAnnotation.customData`; no nested sub-objects.
 *
 * Number is an **optional-assignment** field: `signee: null` is valid in
 * template-builder mode. The field accepts any signer's numeric input.
 */
export interface NumberFieldData {
  /** Discriminates v2 from v1 customData. Always `2` for v2 fields. */
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  /** Field-type literal. Always `'number'` for this plugin. */
  readonly type: 'number';
  /** Human-readable label for the field (optional). */
  readonly label?: string;
  /** User-facing key for external-system integrations. */
  readonly fieldKey?: string;
  /** Hint text shown inside the widget when no value has been entered. */
  readonly placeholder?: string;
  /**
   * Optional template-time signee assignment.
   * Null is valid for number fields — no signee required.
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
   * Defaults `false` — number fields are optional by default.
   */
  readonly required?: boolean;
  /** Minimum allowed value (optional). */
  readonly min?: number | null;
  /** Maximum allowed value (optional). */
  readonly max?: number | null;
  /** Decimal precision (e.g., 2 for currency). Defaults to 2. */
  readonly decimalPrecision?: number;
  /** Whether negative numbers are allowed. Defaults to true. */
  readonly allowNegative?: boolean;
  /** UUID linking widget + label TextAnnotation (for move/delete glue). */
  readonly groupId?: string;
}

/**
 * Default `customData` for a freshly-created number field.
 * `required` defaults `false` — number fields are typically optional.
 */
const DEFAULTS: NumberFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'number',
  signee: null,
  signer: null,
  filled: false,
  filledByUser: false,
  readonly: false,
  required: false,
  min: null,
  max: null,
  decimalPrecision: 2,
  allowNegative: true,
  placeholder: '0.00',
};

/**
 * Output of the plugin's `createField` — the live PSPDFKit objects ready to
 * pass to `instance.create([...])`, plus the SDK-internal names callers need
 * to drive `setFormFieldValues`.
 */
export interface NumberCreateResult {
  /** Live `WidgetAnnotation` to be passed to `instance.create`. */
  readonly widget: WidgetAnnotation;
  /** Live `TextFormField` to be passed to `instance.create`. */
  readonly formField: TextFormField;
  /** Optional label TextAnnotation (when label is non-empty). */
  readonly label?: Serializers.TextAnnotationJSON;
  /** PSPDFKit annotation id of the widget. */
  readonly annotationId: string;
  /** PSPDFKit form-field name (e.g. `number-<uuid>`). */
  readonly formFieldName: string;
}

/**
 * Validate, clamp, and format a raw user-entered value into the canonical
 * display form (thousands separators + fixed decimal precision). Used when
 * the field loses focus.
 *
 * Reads min/max/decimalPrecision/allowNegative from `customData` LIVE — so
 * inspector edits to those properties take effect immediately without
 * recreating the field.
 *
 * Returns `''` for empty/invalid input — clears the field.
 */
export function formatNumberValueForDisplay(
  value: string,
  customData: NumberFieldData
): string {
  if (value === null || value === undefined) return '';
  const trimmed = value.toString().trim();
  if (trimmed === '') return '';

  const stripped = trimmed.replace(/[^\d.-]/g, '');
  if (stripped === '' || stripped === '-' || stripped === '.') return '';

  let num = parseFloat(stripped);
  if (isNaN(num) || !isFinite(num)) return '';

  if (customData.allowNegative === false && num < 0) num = Math.abs(num);
  if (
    customData.min !== null &&
    customData.min !== undefined &&
    num < customData.min
  ) {
    num = customData.min;
  }
  if (
    customData.max !== null &&
    customData.max !== undefined &&
    num > customData.max
  ) {
    num = customData.max;
  }

  const precision = customData.decimalPrecision ?? 2;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(num);
}

/**
 * Build the live PSPDFKit objects for one number widget.
 *
 * Format/parse logic lives in the framework JavaScript layer (bridge service
 * focus/blur handlers), NOT in PDF JS scripts. The PDF sandbox's Duktape
 * engine ships without Adobe's `AFNumber_*` helpers and has limited language
 * support, so doing this work outside the sandbox gives us:
 * - real `Intl.NumberFormat`
 * - live access to current customData (min/max can change in the inspector)
 * - reliable error handling
 *
 * Trade-off: keystroke-level blocking is not available — non-numeric chars
 * can be typed but get stripped on blur. This is a UX nit, not a data
 * integrity issue: stored values are always well-formed numbers.
 *
 * @param input.bbox      - Position + size in PDF page space
 * @param input.pageIndex - Zero-based page index
 * @param input.data      - Optional partial overrides (signee, label, etc.)
 */
export async function createNumberField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<NumberFieldData>;
}): Promise<NumberCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `number.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `number.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `number-${PSPDFKit.generateInstantId()}`;
  const groupId = PSPDFKit.generateInstantId();

  const data: NumberFieldData = input.data
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
      fieldType: 'number',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

/**
 * Public plugin object for the number field type.
 *
 * Number fields are optional by default and support min/max constraints
 * and configurable decimal precision.
 */
export const numberPlugin = {
  type: 'number' as const,
  label: 'Number',
  size: { width: 150, height: 30 },
  defaults: DEFAULTS,
  requiresAssignment: false,
  createField: createNumberField,
  formatValueForDisplay: formatNumberValueForDisplay,
} as const;

export type NumberPlugin = typeof numberPlugin;
