import { AbstractControl, ValidatorFn } from '@angular/forms';
import { isString } from 'es-toolkit';
import { createValueMask, toMaskitoMask } from '../constants/masks';

/**
 * Regular expression for the formatted phone number
 * Only valid for US and Canada phone numbers
 */
const formattedPhoneRegex = /^\+1 \(\d{3}\) \d{3}-\d{4}$/;

/**
 * Regular expression for the unformatted phone number (just digits)
 * Only valid for US and Canada phone numbers
 */
const unformattedPhoneRegex = /^1\d{10}$/;

const isValidPhoneNumberParts = (
  parts: {
    areaCode?: string;
    exchangeCode?: string;
  } = {}
): boolean => {
  const INVALID_AREA_CODE = ['000'];
  const INVALID_EXCHANGE_CODE = ['000'];
  const { areaCode, exchangeCode } = parts;

  return (
    isString(areaCode) &&
    !INVALID_AREA_CODE.includes(areaCode) &&
    isString(exchangeCode) &&
    !INVALID_EXCHANGE_CODE.includes(exchangeCode)
  );
};

export const is10DigitsValidPhoneNumber = (input?: unknown): boolean => {
  const phoneRegex = /^[0-9]{10}$/;

  if (typeof input !== 'string') return false;

  let areaCode: string | undefined;
  let exchangeCode: string | undefined;

  if (phoneRegex.test(input)) {
    areaCode = `${1}${input}`.slice(-10, -7);
    exchangeCode = `${1}${input}`.slice(-7, -4);
    return isValidPhoneNumberParts({ areaCode, exchangeCode });
  }

  return false;
};

/**
 * Custom validation function to check for valid area code and exchange code
 * Only valid for US and Canada phone numbers
 */
const isValidPhoneNumber = (input?: unknown): boolean => {
  if (typeof input !== 'string') return false;

  let areaCode: string | undefined;
  let exchangeCode: string | undefined;

  if (formattedPhoneRegex.test(input)) {
    const parts = input.match(/^\+1 \((\d{3})\) (\d{3})-\d{4}$/);
    if (!parts) return false;
    const [, areaCode, exchangeCode] = parts;
    return isValidPhoneNumberParts({ areaCode, exchangeCode });
  }

  if (unformattedPhoneRegex.test(input)) {
    areaCode = input.slice(-10, -7);
    exchangeCode = input.slice(-7, -4);
    return isValidPhoneNumberParts({ areaCode, exchangeCode });
  }

  return false;
};

/**
 * Function to format a phone number
 * Only valid for US and Canada phone numbers
 */
export function formatPhoneNumber(input?: string | null): string {
  const digitsOnly = input?.replace(/\D/g, '') || '';
  const match = digitsOnly.match(/^1(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    const [, areaCode, exchange, subscriberNumber] = match;
    return `+1 (${areaCode}) ${exchange}-${subscriberNumber}`;
  }
  if (typeof input === 'string') {
    return input; // Return original input if it doesn't match expected format
  }
  return ''; // Return empty string for null or undefined input
}

/**
 * Function to strip formatting from a phone number, making it just digits and adding + or +1
 */
export function formatPhoneNumberForApi(input?: string | null): string {
  const digits = input?.replace(/\D/g, '') || '';

  if (digits.length === 10 && !input?.startsWith('+1')) {
    return `+1${digits}`;
  }

  if (digits.length === 11) {
    return `+${digits}`;
  }

  return digits;
}

export type PhoneNumber = string;

/**
 * Parses and validates a phone number, returning a formatted PhoneNumber or null if invalid
 */
export function parsePhoneNumber(input?: unknown): PhoneNumber | null {
  if (typeof input !== 'string' || !isValidPhoneNumber(input)) {
    return null;
  }
  return formatPhoneNumber(input) as PhoneNumber;
}

export const isPhoneNumber = (input?: unknown): input is PhoneNumber => {
  if (!input) return false;
  return typeof input === 'string' && isValidPhoneNumber(input);
};

export const phoneNumberMask = createValueMask({
  mask: [
    '+',
    /\d/,
    ' ',
    '(',
    /\d/,
    /\d/,
    /\d/,
    ')',
    ' ',
    /\d/,
    /\d/,
    /\d/,
    '-',
    /\d/,
    /\d/,
    /\d/,
    /\d/,
  ],
  prefix: '+1',
});

export const phoneNumberMaskitoMask = toMaskitoMask(phoneNumberMask);

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): { invalidPhoneNumber: boolean } | null => {
    const phone = control.value?.trim();
    if (!phone || phone === '+1') {
      return null;
    }

    return isPhoneNumber(phone) ? null : { invalidPhoneNumber: true };
  };
}
