import { MaskitoOptions, maskitoTransform } from '@maskito/core';
import type { SelectionRange } from '@maskito/core/src/lib/types/selection-range';
import {
  maskitoAddOnFocusPlugin,
  maskitoCaretGuard,
  maskitoNumberOptionsGenerator,
  maskitoPostfixPostprocessorGenerator,
  maskitoPrefixPostprocessorGenerator,
  maskitoRemoveOnBlurPlugin,
  maskitoWithPlaceholder,
} from '@maskito/kit';
import { isNotNil } from 'es-toolkit';
import { PartialDeep } from 'type-fest';

export type MaskitoExtendedOptions = MaskitoOptions & {
  id?: string;
};

export type MaskValue = Array<string | RegExp>;
export type Mask = {
  mask: MaskValue;
  prefix: string;
  suffix: string;
  placeholder: string;
};
export type MaskInput = { mask: MaskValue } & PartialDeep<Omit<Mask, 'mask'>>;

export function createValueMask(value: MaskValue | MaskInput): Mask {
  if (Array.isArray(value)) {
    return { mask: value, prefix: '', suffix: '', placeholder: '' };
  }
  return { prefix: '', suffix: '', placeholder: '', ...value };
}

export function toMaskitoMask(value: Mask): MaskitoExtendedOptions | null {
  const { mask, prefix, suffix, placeholder } = value;
  const addedText = [prefix, suffix].filter(isNotNil).join('');

  if (!mask) {
    return null;
  }

  const postprocessors = [
    prefix ? maskitoPrefixPostprocessorGenerator(prefix) : null,
    suffix ? maskitoPostfixPostprocessorGenerator(suffix) : null,
  ].filter(isNotNil);

  const plugins = [
    maskitoAddOnFocusPlugin(addedText),
    maskitoRemoveOnBlurPlugin(addedText),
    // Disallow to put caret before the prefix or after the postfix
    maskitoCaretGuard(value => [prefix.length, value.length - suffix.length]),
  ];

  return {
    ...(placeholder ? maskitoWithPlaceholder(placeholder) : {}),
    mask,
    postprocessors,
    plugins,
    overwriteMode: 'shift',
  };
}

type MaskConfiguration = {
  precision: number; // Number of decimal places
  decimalSeparator: string; // Character used for decimal separator
  thousandSeparator: string; // Character used for thousands separator
  prefix: string; // Prefix to be added to the value
  decimalZeroPadding: boolean; // Whether to pad decimal part with zeros
  min?: number; // Minimum value allowed
  max?: number; // Maximum value allowed
  minusSign?: string;
};

// ================ NUMERIC CONFIGURATION ================

/**
 * Number mask configuration settings
 */
export const numberConfiguration: (precision: number) => MaskConfiguration = (
  precision = 2
) => ({
  precision,
  decimalSeparator: '.',
  thousandSeparator: ',',
  prefix: '',
  decimalZeroPadding: true,
  minusSign: '-',
  min: Number.MIN_SAFE_INTEGER,
  max: Number.MAX_SAFE_INTEGER,
});

// ================ CURRENCY CONFIGURATION ================

/**
 * Currency mask configuration settings
 */
export const currencyConfiguration: MaskConfiguration = {
  precision: 2,
  decimalSeparator: '.',
  thousandSeparator: ',',
  prefix: '$',
  decimalZeroPadding: true,
  min: Number.MIN_SAFE_INTEGER,
  max: Number.MAX_SAFE_INTEGER,
};

// ================ HELPER FUNCTIONS ================

/**
 * Removes all formatting characters from a currency string
 * Returns only the numeric value as a string
 * **NOTE**: We do not remove decimal separator or minus sign here as it is part of the numeric representation
 */
const cleanCurrency = (
  value: string,
  configuration: MaskConfiguration
): string => {
  const cleaned = value
    .replaceAll(configuration.thousandSeparator, '')
    .replaceAll(configuration.prefix, '');

  return cleaned;
};

/**
 * Counts occurrences of a specific character before a position in a string
 */
function countCharsBefore(str: string, char: string, position: number): number {
  let count = 0;
  for (let i = 0; i < position && i < str.length; i++) {
    if (str[i] === char) count++;
  }
  return count;
}

/**
 * Adjusts selection position when formatting characters are removed
 * Returns the equivalent position in the cleaned string
 */
const normalizeSelectionValueAfterCleanup = (
  value: string,
  selection: number,
  configuration: MaskConfiguration
): number => {
  // Count formatting characters before selection position
  const prefix = countCharsBefore(value, configuration.prefix, selection);
  const thousandSeparator = countCharsBefore(
    value,
    configuration.thousandSeparator,
    selection
  );

  // Subtract formatting characters to get clean position
  return selection - prefix - thousandSeparator;
};

/**
 * Maps a position from an unformatted string to the equivalent position
 * in a formatted string. Handles special cases for decimal separator.
 */
const normalizeSelectionValueAfterFormatting = (
  value: string,
  formattedValue: string,
  selection: number,
  configuration: MaskConfiguration
): number => {
  // Special case for position 0
  if (selection === 0) {
    let j = 0;
    while (value[0] !== formattedValue[j]) {
      j++;
    }
    return j + 1;
  }

  // Map position by matching characters
  let i = 0; // Unformatted string index
  let j = 0; // Formatted string index

  // Skip prefix in formatted value
  if (formattedValue.startsWith(configuration.prefix)) {
    j = configuration.prefix.length;
  }

  // Walk through both strings in parallel
  while (i <= selection && j < formattedValue.length) {
    if (i < value.length) {
      if (value[i] === formattedValue[j]) {
        i++; // Move to next unformatted char
        j++; // Move to next formatted char
      } else if (formattedValue[j] === configuration.thousandSeparator) {
        j++; // Skip thousand separator in formatted value
      } else {
        // Some other mismatch - both advance
        i++;
        j++;
      }
    } else {
      // If we've reached the end of the unformatted value
      break;
    }
  }

  // Ensure we don't position before prefix
  return Math.max(configuration.prefix.length, j);
};

/**
 * Handles leading zeros in currency values
 * Returns the normalized value and count of removed zeros
 */
const handleLeftZero = (
  value: string,
  configuration: MaskConfiguration
): {
  value: string;
  removedZeros: number;
} => {
  // Split by decimal separator to preserve decimal part
  const parts = value.split(configuration.decimalSeparator);

  // Handle integer part (remove leading zeros)
  let integerPart = parts[0] || '0';
  const originalIntegerLength = integerPart.length;
  integerPart = integerPart.replace(/^0+/, '') || '0'; // Remove leading zeros, but keep at least one digit

  // Calculate removed zeros
  const diff = originalIntegerLength - integerPart.length;

  // Handle decimal part
  const decimalPart = parts.length > 1 ? parts[1] : '';

  // Combine parts back together
  const result = decimalPart
    ? `${integerPart}${currencyConfiguration.decimalSeparator}${decimalPart}`
    : integerPart;

  return {
    value: result,
    removedZeros: Math.max(0, diff), // Ensure non-negative
  };
};

// ================ TYPES FOR TRACKING STATE ================

/**
 * Information about a delete operation
 */
type DeleteInfo = {
  digitsBeforeSelection: number; // Count of actual digits before cursor
  isAfterDecimalSeparator: boolean; // Is cursor right after decimal point
  isBeforeDecimalSeparator: boolean; // Is cursor right before decimal point
  action: 'deleteBackward' | 'deleteForward'; // Backspace or Delete key
  hasRangeSelection: boolean; // Is text selected (not just cursor)
};

/**
 * State maintained between processors
 */
type MoneyFieldState = {
  selection: SelectionRange; // Current cursor position/selection
  deleteInfo?: DeleteInfo | null; // Info about delete operation if applicable
};

// ================ MAIN MASK IMPLEMENTATION ================

/**
 * Creates a Maskito configuration for number/money input
 * Handles cursor positioning, formatting, and input validation
 */
const createMaskitoMask = (
  configuration: MaskConfiguration
): ((key?: string) => MaskitoExtendedOptions) => {
  const maskitoOptions = maskitoNumberOptionsGenerator(configuration);

  return (key?: string): MaskitoExtendedOptions => {
    const options: MaskitoExtendedOptions = {
      id: key,
      ...maskitoOptions,
      overwriteMode: 'shift' as const,
      preprocessors: [
        ...maskitoOptions.preprocessors,

        // ===== DELETE OPERATION PREPROCESSOR =====
        (state, action) => {
          // Only process delete operations
          if (action !== 'deleteBackward' && action !== 'deleteForward') {
            return state;
          }

          const { elementState, data } = state;
          const value = elementState.value;
          const selStart = elementState.selection[0];
          const selEnd = elementState.selection[1];

          // Calculate position relative to meaningful content (digits)
          const valueBeforeSelection = value.substring(0, selStart);
          const digitsBeforeSelection = valueBeforeSelection.replace(
            /[^\d]/g,
            ''
          ).length;

          // Detect special positions around decimal separator
          const isAfterDecimalSeparator =
            value.charAt(selStart - 1) === configuration.decimalSeparator;
          const isBeforeDecimalSeparator =
            value.charAt(selStart) === configuration.decimalSeparator;

          const hasRangeSelection = selStart !== selEnd;

          // Save state for postprocessor to use
          const fieldState = {
            selection: [selStart, selEnd],
            deleteInfo: {
              digitsBeforeSelection,
              isAfterDecimalSeparator,
              isBeforeDecimalSeparator,
              action,
              hasRangeSelection,
            },
          };

          // Return unmodified state - actual processing happens in postprocessor
          return {
            elementState: {
              value,
              selection: [selStart, selEnd],
              fieldState,
            },
            data,
          };
        },

        // ===== INSERT OPERATION PREPROCESSOR =====
        (state, action) => {
          // Only handle insert actions
          if (action !== 'insert') {
            return state;
          }

          // Validate input - only accept numeric input
          if (Number.isNaN(Number(state.data))) {
            return state;
          }

          const { elementState, data } = state;
          const selStart = elementState.selection[0];
          const selEnd = elementState.selection[1];

          const updatedValue = cleanCurrency(elementState.value, configuration);

          // Calculate clean positions
          const updatedSelectionStart = normalizeSelectionValueAfterCleanup(
            elementState.value,
            selStart,
            configuration
          );
          const updatedSelectionEnd = normalizeSelectionValueAfterCleanup(
            elementState.value,
            selEnd,
            configuration
          );

          // Update state for postprocessor to use
          const fieldState: MoneyFieldState = {
            selection: [
              updatedSelectionStart,
              updatedSelectionEnd,
            ] as SelectionRange,
            deleteInfo: null, // No delete info when inserting
          };

          return {
            elementState: {
              value: updatedValue,
              selection: [updatedSelectionStart, updatedSelectionEnd],
              fieldState,
            },
            data,
          };
        },
      ],

      postprocessors: [
        // ===== MAIN FORMATTING POSTPROCESSOR =====
        state => {
          const unsafeState = state as unknown as {
            fieldState?: MoneyFieldState;
            initialElementState?: { fieldState?: MoneyFieldState };
          };

          const fieldState =
            unsafeState.initialElementState?.fieldState ??
            unsafeState.fieldState;

          // If No field state, it means no custom preprocessor was run
          if (!fieldState) {
            return state; // No field state available
          }

          // If preprocessed by our custom code, use the updated value and selection

          // Get current selection position
          const start = fieldState.selection?.at(0) ?? -1;
          let selStart = start >= 0 ? start : (state.selection.at(0) ?? 0);

          // ===== HANDLE DELETE OPERATIONS =====
          if (fieldState?.deleteInfo) {
            const {
              digitsBeforeSelection,
              isAfterDecimalSeparator,
              isBeforeDecimalSeparator,
              action,
            } = fieldState.deleteInfo;

            // Clean and format the value
            const cleanValue = cleanCurrency(state.value, configuration);
            const { value: preValue } = handleLeftZero(
              cleanValue,
              configuration
            );

            if (preValue === '') {
              // If empty, we want to force an empty value
              return {
                value: '',
                selection: [0, 0] as SelectionRange,
              };
            }

            // Apply formatting
            const formattedValue = maskitoTransform(preValue, maskitoOptions);

            // ===== CALCULATE CARET POSITION =====
            // This is the key to maintaining proper cursor position

            let newPosition = 0;
            let digitCount = 0;
            let specialPositionOffset = 0;

            // Special handling for decimal point
            if (isAfterDecimalSeparator && action === 'deleteBackward') {
              specialPositionOffset = -1;
            } else if (isBeforeDecimalSeparator && action === 'deleteForward') {
              specialPositionOffset = 1;
            }

            // Find position with same digit count in formatted value
            for (let i = 0; i < formattedValue.length; i++) {
              if (/\d/.test(String(formattedValue[i]))) {
                digitCount++;
              }

              // Stop when we reach the right digit count
              if (digitCount === digitsBeforeSelection) {
                newPosition = i + 1; // Position after this digit
                break;
              }
            }

            // Ensure we don't position before prefix
            if (formattedValue.startsWith(currencyConfiguration.prefix)) {
              newPosition = Math.max(
                newPosition,
                currencyConfiguration.prefix.length
              );
            }

            // Apply special case adjustments
            newPosition += specialPositionOffset;

            // Ensure position is within valid range
            newPosition = Math.max(
              0,
              Math.min(newPosition, formattedValue.length)
            );

            // Create response with formatted value and calculated position
            return {
              value: formattedValue,
              selection: [newPosition, newPosition] as SelectionRange,
            };
          }

          // ===== HANDLE INSERT OPERATIONS =====

          // Clean and normalize the input
          const cleanValue = cleanCurrency(state.value, configuration);
          // Use the updated normalization function
          selStart = normalizeSelectionValueAfterCleanup(
            state.value,
            selStart,
            configuration
          );

          // Handle leading zeros and format
          const { value: preValue, removedZeros } = handleLeftZero(
            cleanValue,
            configuration
          );

          if (preValue === '') {
            // If empty, we want to force an empty value
            return {
              value: '',
              selection: [0, 0] as SelectionRange,
            };
          }

          // Apply formatting
          const formattedValue = maskitoTransform(preValue, maskitoOptions);

          // Calculate cursor position after formatting
          const updatedSelectionStart =
            normalizeSelectionValueAfterFormatting(
              preValue,
              formattedValue,
              selStart,
              configuration
            ) - removedZeros;

          // Create response with formatted value and adjusted position
          return {
            value: formattedValue,
            selection: [
              updatedSelectionStart,
              updatedSelectionStart,
            ] as SelectionRange,
          };
        },
        // Include original processors from currency config
        ...maskitoOptions.postprocessors,
      ],
    };

    return options;
  };
};

// ================ EXPORTS ================
// Export the number maskito options
export const numberMaskitoMask = (precision = 2) =>
  createMaskitoMask(numberConfiguration(precision))('number-maskito');

// Export the currency maskito options
export const getMoneyMaskitoOptions = createMaskitoMask(currencyConfiguration);

// Export the field name maskito options
export const fieldNameMaskitoMask: MaskitoOptions = {
  mask: /[\s\S]*/,
  postprocessors: [
    ({ value, selection }) => ({
      value: value
        .replace(/[A-Z]/g, (c: string) => c.toLowerCase())
        .replace(/[^a-z0-9]/gi, '_'), // Replace anything not a letter or number with _
      selection,
    }),
  ],
};
