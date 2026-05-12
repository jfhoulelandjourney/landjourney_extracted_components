import {
  DynamicFormFieldTypes,
  type DynamicFormField,
  type DynamicFormFieldParameters,
} from '../../../../models/dynamic-forms.models';
import type { RepeatableCardSummaryMode } from '../../../../models/fields.models';

export const REPEATABLE_CARD_EDITOR_SUMMARY_MODE_OPTIONS: {
  value: RepeatableCardSummaryMode;
  label: string;
  numericOnly: boolean;
}[] = [
  { value: 'list', label: 'List', numericOnly: false },
  { value: 'sum', label: 'Sum', numericOnly: true },
  { value: 'average', label: 'Average', numericOnly: false },
  { value: 'percentage', label: 'Percentage', numericOnly: false },
];

export function filterSummaryModeOptionsForInnerField<
  T extends { numericOnly: boolean; label: string },
>(options: T[], isNumericField: boolean): T[] {
  return options.filter(o => !o.numericOnly || isNumericField);
}

export function defaultInnerFieldParameters(
  ft: DynamicFormFieldTypes
): DynamicFormFieldParameters {
  switch (ft) {
    case DynamicFormFieldTypes.SELECT:
    case DynamicFormFieldTypes.RADIO:
      return { options: [], placeholder: '' };
    case DynamicFormFieldTypes.DATE:
      return { placeholder: '' };
    case DynamicFormFieldTypes.INPUT:
      return { placeholder: '', type: 'text' as const };
    case DynamicFormFieldTypes.NUMBER:
    case DynamicFormFieldTypes.MONEY:
      return { placeholder: '' };
    case DynamicFormFieldTypes.COMPUTED:
      return {
        computedFormula: '',
        computedOutputType: 'text' as const,
      };
    case DynamicFormFieldTypes.NOTE:
      return {};
    default:
      return { placeholder: '' };
  }
}

export function computeNextInnerFieldName(items: { name: string }[]): string {
  const used = new Set(items.map(i => i.name));
  let n = items.length + 1;
  let candidate = `field_${n}`;
  while (used.has(candidate)) {
    n++;
    candidate = `field_${n}`;
  }
  return candidate;
}

export function defaultRepeatableSummaryModeForItem(
  item: DynamicFormField<unknown> | undefined,
  isNumericSpec: (f: DynamicFormField<unknown>) => boolean
): RepeatableCardSummaryMode {
  if (!item) {
    return 'list';
  }
  return isNumericSpec(item) ? 'sum' : 'list';
}

export function resolveRepeatableCardSummaryMode(
  itemId: string,
  item: DynamicFormField<unknown> | undefined,
  summaryFieldModes: Record<string, RepeatableCardSummaryMode> | undefined,
  isNumericSpec: (f: DynamicFormField<unknown>) => boolean
): RepeatableCardSummaryMode {
  const explicit = summaryFieldModes?.[itemId];
  if (explicit) {
    if (item && !isNumericSpec(item) && explicit === 'sum') {
      return 'list';
    }
    return explicit;
  }
  return defaultRepeatableSummaryModeForItem(item, isNumericSpec);
}
