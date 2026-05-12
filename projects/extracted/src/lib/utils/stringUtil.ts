import { isString } from 'es-toolkit';
import { v4, v7 } from 'uuid';

export function stripNonNumberCharacters(value: string): string {
  // Replace Unicode minus (U+2212) with ASCII minus
  const normalized = value.replace(/\u2212/g, '-');
  // Only keep digits, dot, and minus; ensure only a leading minus is preserved
  return normalized.replace(/[^0-9.-]/g, '').replace(/(?!^)-/g, '');
}

export function isValidEmail(email: string): boolean {
  const regexp = new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  return regexp.test(email);
}

export function capitalize(input: string): string {
  let outputString: string = input;

  let outputArray: string[] = input.split('-');
  outputArray = outputArray.map(value => {
    return value.charAt(0).toUpperCase() + value.slice(1);
  });
  outputString = outputArray.join('-');

  outputArray = outputString.split(' ');
  outputArray = outputArray.map(value => {
    return value.charAt(0).toUpperCase() + value.slice(1);
  });
  outputString = outputArray.join(' ');

  return outputString;
}

export function getRandomString(length = 16): string {
  return Math.random().toString(20).slice(2, length);
}

export function formatEnumValue(
  value: string,
  ignoreShortStrings = true
): string {
  const formattedValue = capitalize(value.replaceAll('_', ' ').toLowerCase());

  if (formattedValue.trim().length <= 3 && !ignoreShortStrings) {
    return formattedValue.toUpperCase();
  }

  return formattedValue;
}

export function getUUID4(): string {
  return v4();
}

export function getUUID7(): string {
  return v7();
}

export function pluralize(
  quantity: number,
  singular: string,
  plural?: string
): string;
export function pluralize(
  quantity: number,
  singular: string,
  options?: {
    plural?: string;
    zero?: string;
  }
): string;
export function pluralize(
  quantity: number,
  singular: string,
  options?:
    | string
    | {
        plural?: string;
        zero?: string;
      }
): string {
  const plural = isString(options)
    ? options
    : (options?.plural ?? `${singular}s`);
  const zero = isString(options) ? plural : (options?.zero ?? `${singular}s`);

  let suffix = '';
  if (quantity === 0) {
    suffix = zero;
  } else if (quantity === 1) {
    suffix = singular;
  } else if (quantity === -1) {
    suffix = singular;
  } else {
    suffix = plural;
  }

  return `${quantity} ${suffix}`;
}

export function formatFileName(fileName: string): string {
  fileName = fileName.replaceAll('_', ' ').replaceAll('-', ' ');

  if (fileName.includes('.')) {
    const nameParts = fileName.split('.').reverse();
    fileName = nameParts.slice(1).reverse().join('.');
    fileName = fileName.replaceAll('.', ' ');
  }

  return capitalize(fileName);
}

export function getFormattedEnumValue(
  word?: string | null
): string | undefined {
  return word ? formatEnumValue(word ?? '') : '-';
}
