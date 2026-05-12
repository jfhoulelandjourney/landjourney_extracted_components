import { AbstractControl, ValidatorFn } from '@angular/forms';
import type { MaskitoExtendedOptions } from '../constants/masks';

/**
 * Regular expression for SSN validation
 * Format: XXX-XX-XXXX
 * Rules:
 * - First 3 digits: cannot be 000, 666, or 9XX
 * - Middle 2 digits: cannot be 00
 * - Last 4 digits: cannot be 0000
 */
const ssnRegex = /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/;

/**
 * Validates if the input is a valid SSN (formatted or unformatted)
 */
export const isValidSSN = (input?: unknown): boolean => {
  if (typeof input !== 'string') return false;
  // Check if it's already formatted
  if (ssnRegex.test(input)) return true;
  // Check if it's unformatted (just digits)
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length === 9) {
    // Format it and validate
    const formatted = formatSSN(digitsOnly);
    return ssnRegex.test(formatted);
  }
  return false;
};

/**
 * Formats an SSN for display (adds dashes)
 * Input can be formatted or unformatted
 * Returns: XXX-XX-XXXX
 */
export function formatSSN(input?: string | null): string {
  const digitsOnly = input?.replace(/\D/g, '') || '';
  if (digitsOnly.length === 9) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 5)}-${digitsOnly.slice(5, 9)}`;
  }
  // If already formatted or doesn't match expected length, return as-is
  return input || '';
}

/**
 * Strips formatting from an SSN (removes dashes)
 * Returns: XXXXXXXXX (9 digits)
 */
export function formatSSNForApi(input?: string | null): string {
  const digitsOnly = input?.replace(/\D/g, '') || '';
  return digitsOnly;
}

/**
 * SSN mask for Maskito
 * Format: XXX-XX-XXXX
 * Dashes appear automatically as user types
 */
export const ssnMaskitoMask: MaskitoExtendedOptions = {
  mask: [/\d/, /\d/, /\d/, '-', /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
  overwriteMode: 'shift',
};

/**
 * Angular form validator for SSN
 */
export function ssnValidator(): ValidatorFn {
  return (control: AbstractControl): { invalidSSN: boolean } | null => {
    const ssn = control.value?.trim();
    if (!ssn || ssn === '') {
      return null;
    }

    // Validate the formatted version
    const formatted = formatSSN(ssn);
    return isValidSSN(formatted) ? null : { invalidSSN: true };
  };
}
