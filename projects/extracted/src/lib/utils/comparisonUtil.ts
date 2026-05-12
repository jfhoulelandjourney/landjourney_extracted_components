export function isEqual<T>(a: T, b: T): boolean {
  // Handle null and undefined
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }

  if (typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }

  if (a.constructor !== b.constructor) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => isEqual(item, b[index]));
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every(
      // eslint-disable-next-line
      key => keysB.includes(key) && isEqual((a as any)[key], (b as any)[key])
    );
  }

  return false;
}

export function isUndefinedOrNull<T>(a: T): boolean {
  if (a === null || a === undefined) {
    return true;
  }

  return false;
}

export function isDate<T>(a: T): boolean {
  if (a instanceof Date) {
    return true;
  }

  return false;
}

export function isNumber<T>(a: T): boolean {
  if (typeof a === 'number') {
    return true;
  }

  return false;
}

export function isPrimitiveType<T>(a: T): boolean {
  if (isUndefinedOrNull(a)) {
    return false;
  }

  if (typeof a === 'object') {
    return false;
  }

  if (Array.isArray(a)) {
    return false;
  }

  if (isDate(a)) {
    return false;
  }

  return true;
}
