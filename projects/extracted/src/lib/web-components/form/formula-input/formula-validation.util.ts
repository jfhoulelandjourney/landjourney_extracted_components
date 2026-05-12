import * as formulajs from '@formulajs/formulajs';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function evaluateFormulaWithFormulajs(formula: string): unknown {
  try {
    const context: Record<string, unknown> = { ...formulajs };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const evalFunc = new Function(
      ...Object.keys(context),
      `return ${formula}`
    ) as (...args: unknown[]) => unknown;

    return evalFunc(...Object.values(context));
  } catch (error) {
    return error instanceof Error
      ? error
      : new Error('Formula evaluation failed');
  }
}

export function validateFormulaExpression(
  formula: string,
  fieldNames: string[]
): { valid: boolean; error?: string } {
  if (!formula || formula.trim() === '') {
    return { valid: true };
  }

  try {
    let openCount = 0;
    for (const char of formula) {
      if (char === '(') openCount++;
      if (char === ')') openCount--;
      if (openCount < 0) {
        return { valid: false, error: 'Unbalanced parentheses' };
      }
    }

    if (openCount !== 0) {
      return { valid: false, error: 'Unbalanced parentheses' };
    }

    let testFormula = formula;
    const sortedNames = [...fieldNames].sort((a, b) => b.length - a.length);

    sortedNames.forEach(fieldName => {
      const fieldPattern = new RegExp(
        `\\b${escapeRegExp(fieldName)}\\b`,
        'gi'
      );
      testFormula = testFormula.replace(fieldPattern, '1');
    });

    const result = evaluateFormulaWithFormulajs(testFormula);

    if (result instanceof Error) {
      return {
        valid: false,
        error: result.message || 'Invalid formula',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : 'Invalid formula syntax',
    };
  }
}
