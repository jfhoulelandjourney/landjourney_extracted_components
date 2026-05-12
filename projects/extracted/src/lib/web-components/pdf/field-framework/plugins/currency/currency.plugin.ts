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
 * Currency codes the inspector lets the designer pick from. Add more here as
 * the product expands. The value is passed straight to `Intl.NumberFormat`
 * via the `currency` option, which understands any ISO 4217 code.
 */
export const SUPPORTED_CURRENCIES = ['USD', 'CAD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Flat `customData` shape for a v2 currency widget.
 *
 * Stored directly on `WidgetAnnotation.customData`; no nested sub-objects.
 *
 * Currency is an **optional-assignment** field: `signee: null` is valid in
 * template-builder mode. Mirrors the number field's shape but adds a
 * `currency` discriminator and defaults precision to 2.
 */
export interface CurrencyFieldData {
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  readonly type: 'currency';
  readonly label?: string;
  readonly fieldKey?: string;
  readonly placeholder?: string;
  readonly signee: {
    readonly id: string;
    readonly name: string;
    readonly roles: RequestUserRoles[];
  } | null;
  readonly signer: SignerInfo | null;
  readonly filled: boolean;
  readonly filledByUser: boolean;
  readonly readonly: boolean;
  readonly required?: boolean;
  readonly min?: number | null;
  readonly max?: number | null;
  /** Decimal precision (defaults to 2 for typical currency display). */
  readonly decimalPrecision?: number;
  /** Whether negative numbers are allowed. Defaults to true. */
  readonly allowNegative?: boolean;
  /** ISO 4217 currency code (e.g. 'USD', 'CAD'). Defaults to 'USD'. */
  readonly currency?: SupportedCurrency;
  readonly groupId?: string;
}

const DEFAULTS: CurrencyFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'currency',
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
  currency: 'USD',
  placeholder: '$0.00',
};

export interface CurrencyCreateResult {
  readonly widget: WidgetAnnotation;
  readonly formField: TextFormField;
  readonly label?: Serializers.TextAnnotationJSON;
  readonly annotationId: string;
  readonly formFieldName: string;
}

/**
 * Validate, clamp, and format a raw user-entered value into the canonical
 * currency display form via `Intl.NumberFormat` with `style: 'currency'`.
 *
 * Reads currency / min / max / decimalPrecision / allowNegative from
 * `customData` LIVE — inspector edits take effect without recreating the
 * field.
 *
 * Returns `''` for empty/invalid input — clears the field.
 */
export function formatCurrencyValueForDisplay(
  value: string,
  customData: CurrencyFieldData
): string {
  if (value === null || value === undefined) return '';
  const trimmed = value.toString().trim();
  if (trimmed === '') return '';

  // Strip everything except digits, decimal point, and minus. This drops
  // currency symbols, group separators, and stray characters.
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
  const currency = customData.currency ?? 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(num);
}

/**
 * Build the live PSPDFKit objects for one currency widget.
 *
 * Format/parse logic lives in the framework JavaScript layer (bridge service
 * blur handler), NOT in PDF JS scripts. See `number.plugin.ts` for the full
 * rationale.
 */
export async function createCurrencyField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<CurrencyFieldData>;
}): Promise<CurrencyCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `currency.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `currency.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `currency-${PSPDFKit.generateInstantId()}`;
  const groupId = PSPDFKit.generateInstantId();

  const data: CurrencyFieldData = input.data
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
      fieldType: 'currency',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

export const currencyPlugin = {
  type: 'currency' as const,
  label: 'Currency',
  size: { width: 150, height: 30 },
  defaults: DEFAULTS,
  requiresAssignment: false,
  createField: createCurrencyField,
  formatValueForDisplay: formatCurrencyValueForDisplay,
} as const;

export type CurrencyPlugin = typeof currencyPlugin;
