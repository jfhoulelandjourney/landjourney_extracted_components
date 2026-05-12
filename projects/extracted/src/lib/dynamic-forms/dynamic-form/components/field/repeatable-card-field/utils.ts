import { stripNonNumberCharacters } from '../../../../../utils/stringUtil';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
} from '../../../../models/dynamic-forms.models';
import type {
  RepeatableCardRowData,
  RepeatableCardSummaryData,
  RepeatableCardSummaryMode,
} from '../../../../models/fields.models';

export function isRepeatableCardNumericSpec(
  spec: DynamicFormField<unknown>
): boolean {
  const ft = spec.fieldType as DynamicFormFieldTypes;
  return (
    ft === DynamicFormFieldTypes.MONEY ||
    ft === DynamicFormFieldTypes.NUMBER ||
    (ft === DynamicFormFieldTypes.COMPUTED &&
      (spec.parameters.computedOutputType === 'money' ||
        spec.parameters.computedOutputType === 'number'))
  );
}

export function collectRepeatableCardNumericValues(
  rows: RepeatableCardRowData[],
  spec: DynamicFormField<unknown>
): number[] {
  const nums: number[] = [];
  for (const row of rows) {
    const v = row[spec.name];
    if (v !== undefined && v !== null && v !== '') {
      const n =
        typeof v === 'number' ? v : Number(stripNonNumberCharacters(`${v}`));
      if (!Number.isNaN(n)) {
        nums.push(n);
      }
    }
  }
  return nums;
}

export function getRepeatableCardSummaryMode(
  spec: DynamicFormField<unknown>,
  summaryFieldModes: Record<string, RepeatableCardSummaryMode> | undefined
): RepeatableCardSummaryMode {
  const explicit = summaryFieldModes?.[spec.id];
  if (explicit) {
    return explicit;
  }
  return isRepeatableCardNumericSpec(spec) ? 'sum' : 'list';
}

export function formatRepeatableCardSummaryFieldLabel(
  baseLabel: string,
  mode: RepeatableCardSummaryMode
): string {
  switch (mode) {
    case 'list':
      return baseLabel;
    case 'sum':
      return `${baseLabel} (sum)`;
    case 'average':
      return `${baseLabel} (avg)`;
    case 'percentage':
      return `${baseLabel} (%)`;
    default:
      return baseLabel;
  }
}

export function formatRepeatableCardAverageForStringValues(
  rows: RepeatableCardRowData[],
  spec: DynamicFormField<unknown>,
  displayValue: (
    row: RepeatableCardRowData,
    s: DynamicFormField<unknown>
  ) => string
): string {
  if (rows.length === 0) {
    return '';
  }

  const labels = rows.map(row => {
    const v = displayValue(row, spec).trim();
    return v === '' ? '(empty)' : v;
  });

  const counts = new Map<string, number>();
  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = labels.length;
  const entries = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    return a[0].localeCompare(b[0], undefined, { sensitivity: 'base' });
  });

  const formatPct = (count: number) => {
    const pct = (count / total) * 100;
    if (Number.isInteger(pct) || Math.abs(pct - Math.round(pct)) < 1e-6) {
      return `${Math.round(pct)}`;
    }
    const rounded = pct.toFixed(1);
    return rounded.endsWith('.0')
      ? `${Math.round(pct)}`
      : rounded.replace(/\.0$/, '');
  };

  const parts = entries.map(
    ([label, count]) => `${formatPct(count)}% ${label}`
  );

  if (parts.length === 1) {
    return parts[0] ?? '';
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

export function formatRepeatableCardSummaryDisplay(
  spec: DynamicFormField<unknown>,
  rows: RepeatableCardRowData[],
  mode: RepeatableCardSummaryMode,
  displayValue: (
    row: RepeatableCardRowData,
    s: DynamicFormField<unknown>
  ) => string,
  formatMoneyDisplay: (n: number | undefined) => string
): string {
  const ft = spec.fieldType as DynamicFormFieldTypes;
  const isNum = isRepeatableCardNumericSpec(spec);

  if (mode === 'list') {
    const values = rows
      .map(row => displayValue(row, spec))
      .filter(v => v !== '');
    return values.join(', ');
  }

  if (!isNum && (mode === 'average' || mode === 'percentage')) {
    return formatRepeatableCardAverageForStringValues(rows, spec, displayValue);
  }

  if (!isNum) {
    const values = rows
      .map(row => displayValue(row, spec))
      .filter(v => v !== '');
    return values.join(', ');
  }

  const nums = collectRepeatableCardNumericValues(rows, spec);
  if (nums.length === 0) {
    return '';
  }

  const sum = nums.reduce((a, b) => a + b, 0);
  const count = nums.length;
  const isMoney =
    ft === DynamicFormFieldTypes.MONEY ||
    (ft === DynamicFormFieldTypes.COMPUTED &&
      spec.parameters.computedOutputType === 'money');

  switch (mode) {
    case 'sum':
      return isMoney ? formatMoneyDisplay(sum) : `${sum}`;
    case 'average': {
      const avg = sum / count;
      return isMoney ? formatMoneyDisplay(avg) : `${avg}`;
    }
    case 'percentage': {
      const max = spec.parameters.maximumValue;
      const avg = sum / count;
      if (max !== undefined && max !== null && max !== 0) {
        return `${((avg / max) * 100).toFixed(1)}%`;
      }
      return `${avg.toFixed(1)}%`;
    }
    default:
      return `${sum}`;
  }
}

export function getRepeatableCardSummaryRecordValue(
  spec: DynamicFormField<unknown>,
  rows: RepeatableCardRowData[],
  mode: RepeatableCardSummaryMode,
  displayValue: (
    row: RepeatableCardRowData,
    s: DynamicFormField<unknown>
  ) => string
): unknown {
  const isNum = isRepeatableCardNumericSpec(spec);

  if (mode === 'list') {
    const values = rows
      .map(row => displayValue(row, spec))
      .filter(v => v !== '');
    return values.join(', ');
  }

  if (!isNum && (mode === 'average' || mode === 'percentage')) {
    return formatRepeatableCardAverageForStringValues(rows, spec, displayValue);
  }

  if (!isNum) {
    const values = rows
      .map(row => displayValue(row, spec))
      .filter(v => v !== '');
    return values.join(', ');
  }

  const nums = collectRepeatableCardNumericValues(rows, spec);
  if (nums.length === 0) {
    return 0;
  }

  const sum = nums.reduce((a, b) => a + b, 0);
  const count = nums.length;

  switch (mode) {
    case 'sum':
      return sum;
    case 'average':
      return sum / count;
    case 'percentage': {
      const max = spec.parameters.maximumValue;
      const avg = sum / count;
      if (max !== undefined && max !== null && max !== 0) {
        return (avg / max) * 100;
      }
      return avg;
    }
    default:
      return sum;
  }
}

export function buildRepeatableCardSummaryData(
  summaryFieldSpecs: DynamicFormField<unknown>[],
  rows: RepeatableCardRowData[],
  summaryFieldModes: Record<string, RepeatableCardSummaryMode> | undefined,
  displayValue: (
    row: RepeatableCardRowData,
    spec: DynamicFormField<unknown>
  ) => string
): RepeatableCardSummaryData {
  const result: RepeatableCardSummaryData = {};
  for (const spec of summaryFieldSpecs) {
    const mode = getRepeatableCardSummaryMode(spec, summaryFieldModes);
    const key = `summary_${mode}_${spec.name}`;
    result[key] = getRepeatableCardSummaryRecordValue(
      spec,
      rows,
      mode,
      displayValue
    );
  }
  return result;
}
