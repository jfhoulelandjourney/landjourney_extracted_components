export function stripFormulaStringLiterals(formula: string): string {
  let out = '';
  let i = 0;
  while (i < formula.length) {
    const c = formula[i];
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      while (i < formula.length) {
        if (formula[i] === '\\' && i + 1 < formula.length) {
          i += 2;
          continue;
        }
        if (formula[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      out += ' ';
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

export function extractFormulaIdentifiers(formula: string): string[] {
  const withoutStrings = stripFormulaStringLiterals(formula);
  return withoutStrings.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
}

export function filterFormulaIdentifiersExcludingFunctions(
  identifiers: string[],
  functionNamesUppercase: Set<string>
): string[] {
  return Array.from(new Set(identifiers)).filter(
    name => !functionNamesUppercase.has(name.toUpperCase())
  );
}

export function resolveComputedFormulaReferences(
  formula: string,
  existingFieldNames: string[],
  formulaFunctionNamesUppercase: Set<string>
): { name: string; exists: boolean }[] {
  if (!formula.trim()) {
    return [];
  }
  const uniqueNames = filterFormulaIdentifiersExcludingFunctions(
    extractFormulaIdentifiers(formula),
    formulaFunctionNamesUppercase
  );
  return uniqueNames.map(name => ({
    name,
    exists: existingFieldNames.includes(name),
  }));
}
