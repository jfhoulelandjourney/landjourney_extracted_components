/**
 * Checks if a value is `null`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is `null`, otherwise `false`.
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Checks if a value is `undefined`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is `undefined`, otherwise `false`.
 */
export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

/**
 * Checks if a value is either `null` or `undefined`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is `null` or `undefined`, otherwise `false`.
 */
export function isNil(value: unknown): value is null | undefined {
  return isNull(value) || isUndefined(value);
}

/**
 * Checks if a value is neither `null` nor `undefined`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is neither `null` nor `undefined`, otherwise `false`.
 */
export function isNonNullable<T>(
  value: T | null | undefined
): value is NonNullable<T> {
  return !isNil(value);
}
