import { formatPercent as angularFormatPercent } from '@angular/common';

export function generateRandomIntFromRange(minimum: number, maximum: number) {
  return Math.floor(Math.random() * (maximum - minimum + 1) + minimum);
}

export function formatAmountFromCents(
  amount: number | undefined,
  options?: {
    zeroFormat?: string | ((formatter: Intl.NumberFormat['format']) => string);
    undefinedFormat?:
      | string
      | ((format: Intl.NumberFormat['format']) => string);
    format?: Intl.NumberFormatOptions;
  }
): string {
  const formatOptions = options?.format ?? {
    style: 'currency',
    currency: 'USD',
  };
  const formatterShape = new Intl.NumberFormat('en-US', formatOptions);
  const formatter = (
    value: Parameters<Intl.NumberFormat['format']>[0]
  ): string => {
    return formatterShape.format(value);
  };

  const zeroFormat =
    typeof options?.zeroFormat === 'string'
      ? () => String(options.zeroFormat)
      : (options?.zeroFormat ?? (() => 'None'));

  const undefinedFormat =
    typeof options?.undefinedFormat === 'string'
      ? () => String(options.undefinedFormat)
      : (options?.undefinedFormat ?? (() => 'None'));

  if (typeof amount === 'undefined') {
    return undefinedFormat(formatter);
  }

  if (amount === 0) {
    return zeroFormat(formatter);
  }

  const absoluteAmount: number = Math.abs(amount) / 100;

  return formatter(absoluteAmount);
}

export function formatPercent(percent: number | undefined) {
  if (!percent) {
    return '-';
  }

  return angularFormatPercent(percent, 'en-US', '1.2-2');
}

export function formatAcres(acres: number | undefined) {
  if (!acres) {
    return '-';
  }

  return (acres / 100).toFixed(2);
}
