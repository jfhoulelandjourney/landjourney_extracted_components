import type { DynamicFormField } from '../models/dynamic-forms.models';
import {
  ComparisonOperators,
  DynamicFormFieldTypes,
  type DynamicFormSection,
} from '../models/dynamic-forms.models';
import { isDynamicFormSection } from './dynamicFormsUtil';

export enum ValidationErrorKey {
  REQUIRED = 'REQUIRED',

  // Input field
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_SSN = 'INVALID_SSN',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Input, text, computed
  MIN_LENGTH = 'MIN_LENGTH',
  MAX_LENGTH = 'MAX_LENGTH',

  // Date field
  DATE_PAST_ONLY = 'DATE_PAST_ONLY',
  DATE_FUTURE_ONLY = 'DATE_FUTURE_ONLY',
  AGE_18_PLUS = 'AGE_18_PLUS',
  AGE_21_PLUS = 'AGE_21_PLUS',

  // Number field
  MIN_VALUE = 'MIN_VALUE',
  MAX_VALUE = 'MAX_VALUE',

  // Money field
  MIN_AMOUNT = 'MIN_AMOUNT',
  MAX_AMOUNT = 'MAX_AMOUNT',

  // Select / Radio
  INVALID_OPTION = 'INVALID_OPTION',

  // Complex aggregate fields
  MISSING_FIELDS = 'MISSING_FIELDS',

  // Loan purpose
  MISSING_PURPOSE = 'MISSING_PURPOSE',
  MISSING_PERCENTAGE = 'MISSING_PERCENTAGE',
  TOTAL_PERCENTAGE_NOT_100 = 'TOTAL_PERCENTAGE_NOT_100',

  // Loan sources
  MISSING_PURCHASE_PRICE = 'MISSING_PURCHASE_PRICE',
  MISSING_SOURCE = 'MISSING_SOURCE',
  MISSING_SOURCE_AMOUNT = 'MISSING_SOURCE_AMOUNT',
  TOTAL_AMOUNT_MISMATCH = 'TOTAL_AMOUNT_MISMATCH',

  // Questionnaire
  MISSING_QUESTION = 'MISSING_QUESTION',
  MISSING_ANSWER = 'MISSING_ANSWER',
  MISSING_EXPLANATION = 'MISSING_EXPLANATION',
}

export const ALL_NON_REQUIRED_SENTINEL = '__ALL_NON_REQUIRED__';
export const ALL_ERRORS_SENTINEL = '__ALL_ERRORS__';

export function getValidationErrorLabel(
  key: ValidationErrorKey,
  field: DynamicFormField<unknown>
): string {
  switch (key) {
    case ValidationErrorKey.REQUIRED:
      return 'This field is required';
    case ValidationErrorKey.INVALID_PHONE:
      return 'Please enter a valid phone';
    case ValidationErrorKey.INVALID_SSN:
      return 'Please enter a valid SSN';
    case ValidationErrorKey.INVALID_EMAIL:
      return 'Please enter a valid email';
    case ValidationErrorKey.INVALID_FORMAT:
      return `Invalid format for ${field.label} (${field.name})`;
    case ValidationErrorKey.MIN_LENGTH:
      return `Minimum length is ${field.parameters.minimumLength} characters`;
    case ValidationErrorKey.MAX_LENGTH:
      return `Maximum length is ${field.parameters.maximumLength} characters`;
    case ValidationErrorKey.DATE_PAST_ONLY:
      return 'Date must be in the past';
    case ValidationErrorKey.DATE_FUTURE_ONLY:
      return 'Date must be in the future';
    case ValidationErrorKey.AGE_18_PLUS:
      return 'Must be at least 18 years old';
    case ValidationErrorKey.AGE_21_PLUS:
      return 'Must be at least 21 years old';
    case ValidationErrorKey.MIN_VALUE:
      return `Value must be at least ${field.parameters.minimumValue}`;
    case ValidationErrorKey.MAX_VALUE:
      return `Value must be at most ${field.parameters.maximumValue}`;
    case ValidationErrorKey.MIN_AMOUNT:
      return `Amount must be at least ${field.parameters.minimumValue}`;
    case ValidationErrorKey.MAX_AMOUNT:
      return `Amount must be at most ${field.parameters.maximumValue}`;
    case ValidationErrorKey.INVALID_OPTION:
      return 'The option selected is not valid';
    case ValidationErrorKey.MISSING_FIELDS:
      return 'Some fields are missing';
    case ValidationErrorKey.MISSING_PURPOSE:
      return 'Purpose description is mandatory';
    case ValidationErrorKey.MISSING_PERCENTAGE:
      return 'Purpose percentage is mandatory';
    case ValidationErrorKey.TOTAL_PERCENTAGE_NOT_100:
      return 'The total percentage must equal 100';
    case ValidationErrorKey.MISSING_PURCHASE_PRICE:
      return 'The purchase price is a required field';
    case ValidationErrorKey.MISSING_SOURCE:
      return 'Source description is mandatory';
    case ValidationErrorKey.MISSING_SOURCE_AMOUNT:
      return 'Source amount is mandatory';
    case ValidationErrorKey.TOTAL_AMOUNT_MISMATCH:
      return 'The total amount must equal the purchase price';
    case ValidationErrorKey.MISSING_QUESTION:
      return 'A question is missing';
    case ValidationErrorKey.MISSING_ANSWER:
      return 'A question requires an answer';
    case ValidationErrorKey.MISSING_EXPLANATION:
      return 'A question requires an explanation';
    default:
      return 'Unknown error';
  }
}

export function getPossibleValidationErrors(
  field: DynamicFormField<unknown>
): { value: string; label: string }[] {
  const errors: { value: string; label: string }[] = [];
  const { parameters, fieldType } = field;

  switch (fieldType) {
    case DynamicFormFieldTypes.INPUT:
      if (parameters.type === 'tel')
        errors.push({
          value: ValidationErrorKey.INVALID_PHONE,
          label: getValidationErrorLabel(ValidationErrorKey.INVALID_PHONE, field),
        });
      if (parameters.type === 'ssn')
        errors.push({
          value: ValidationErrorKey.INVALID_SSN,
          label: getValidationErrorLabel(ValidationErrorKey.INVALID_SSN, field),
        });
      if (parameters.type === 'email')
        errors.push({
          value: ValidationErrorKey.INVALID_EMAIL,
          label: getValidationErrorLabel(ValidationErrorKey.INVALID_EMAIL, field),
        });
      if (parameters.type === 'text' && parameters.validator)
        errors.push({
          value: ValidationErrorKey.INVALID_FORMAT,
          label: getValidationErrorLabel(ValidationErrorKey.INVALID_FORMAT, field),
        });
      if (parameters.maximumLength)
        errors.push({
          value: ValidationErrorKey.MAX_LENGTH,
          label: getValidationErrorLabel(ValidationErrorKey.MAX_LENGTH, field),
        });
      if (parameters.minimumLength)
        errors.push({
          value: ValidationErrorKey.MIN_LENGTH,
          label: getValidationErrorLabel(ValidationErrorKey.MIN_LENGTH, field),
        });
      break;

    case DynamicFormFieldTypes.DATE:
      if (parameters.dateRestriction === 'PAST_ONLY')
        errors.push({
          value: ValidationErrorKey.DATE_PAST_ONLY,
          label: getValidationErrorLabel(ValidationErrorKey.DATE_PAST_ONLY, field),
        });
      if (parameters.dateRestriction === 'FUTURE_ONLY')
        errors.push({
          value: ValidationErrorKey.DATE_FUTURE_ONLY,
          label: getValidationErrorLabel(ValidationErrorKey.DATE_FUTURE_ONLY, field),
        });
      if (parameters.dateRestriction === 'AGE_18_PLUS')
        errors.push({
          value: ValidationErrorKey.AGE_18_PLUS,
          label: getValidationErrorLabel(ValidationErrorKey.AGE_18_PLUS, field),
        });
      if (parameters.dateRestriction === 'AGE_21_PLUS')
        errors.push({
          value: ValidationErrorKey.AGE_21_PLUS,
          label: getValidationErrorLabel(ValidationErrorKey.AGE_21_PLUS, field),
        });
      break;

    case DynamicFormFieldTypes.NUMBER:
      if (parameters.maximumValue !== undefined && parameters.maximumValue !== null)
        errors.push({
          value: ValidationErrorKey.MAX_VALUE,
          label: getValidationErrorLabel(ValidationErrorKey.MAX_VALUE, field),
        });
      if (parameters.minimumValue !== undefined && parameters.minimumValue !== null)
        errors.push({
          value: ValidationErrorKey.MIN_VALUE,
          label: getValidationErrorLabel(ValidationErrorKey.MIN_VALUE, field),
        });
      break;

    case DynamicFormFieldTypes.MONEY:
      if (parameters.maximumValue !== undefined && parameters.maximumValue !== null)
        errors.push({
          value: ValidationErrorKey.MAX_AMOUNT,
          label: getValidationErrorLabel(ValidationErrorKey.MAX_AMOUNT, field),
        });
      if (parameters.minimumValue !== undefined && parameters.minimumValue !== null)
        errors.push({
          value: ValidationErrorKey.MIN_AMOUNT,
          label: getValidationErrorLabel(ValidationErrorKey.MIN_AMOUNT, field),
        });
      break;

    case DynamicFormFieldTypes.TEXT:
      if (parameters.maximumLength)
        errors.push({
          value: ValidationErrorKey.MAX_LENGTH,
          label: getValidationErrorLabel(ValidationErrorKey.MAX_LENGTH, field),
        });
      if (parameters.minimumLength)
        errors.push({
          value: ValidationErrorKey.MIN_LENGTH,
          label: getValidationErrorLabel(ValidationErrorKey.MIN_LENGTH, field),
        });
      break;

    case DynamicFormFieldTypes.SELECT:
    case DynamicFormFieldTypes.RADIO:
      errors.push({
        value: ValidationErrorKey.INVALID_OPTION,
        label: getValidationErrorLabel(ValidationErrorKey.INVALID_OPTION, field),
      });
      break;

    case DynamicFormFieldTypes.COMPUTED:
      if (parameters.type === 'text' && parameters.validator)
        errors.push({
          value: ValidationErrorKey.INVALID_FORMAT,
          label: getValidationErrorLabel(ValidationErrorKey.INVALID_FORMAT, field),
        });
      if (parameters.maximumLength)
        errors.push({
          value: ValidationErrorKey.MAX_LENGTH,
          label: getValidationErrorLabel(ValidationErrorKey.MAX_LENGTH, field),
        });
      if (parameters.minimumLength)
        errors.push({
          value: ValidationErrorKey.MIN_LENGTH,
          label: getValidationErrorLabel(ValidationErrorKey.MIN_LENGTH, field),
        });
      break;

    case DynamicFormFieldTypes.LOAN_PURPOSE:
      errors.push(
        {
          value: ValidationErrorKey.MISSING_PURPOSE,
          label: getValidationErrorLabel(ValidationErrorKey.MISSING_PURPOSE, field),
        },
        {
          value: ValidationErrorKey.MISSING_PERCENTAGE,
          label: getValidationErrorLabel(ValidationErrorKey.MISSING_PERCENTAGE, field),
        },
        {
          value: ValidationErrorKey.TOTAL_PERCENTAGE_NOT_100,
          label: getValidationErrorLabel(ValidationErrorKey.TOTAL_PERCENTAGE_NOT_100, field),
        }
      );
      break;

    case DynamicFormFieldTypes.LOAN_SOURCES:
      errors.push(
        {
          value: ValidationErrorKey.MISSING_PURCHASE_PRICE,
          label: getValidationErrorLabel(ValidationErrorKey.MISSING_PURCHASE_PRICE, field),
        },
        {
          value: ValidationErrorKey.MISSING_SOURCE,
          label: getValidationErrorLabel(ValidationErrorKey.MISSING_SOURCE, field),
        },
        {
          value: ValidationErrorKey.MISSING_SOURCE_AMOUNT,
          label: getValidationErrorLabel(ValidationErrorKey.MISSING_SOURCE_AMOUNT, field),
        },
        {
          value: ValidationErrorKey.TOTAL_AMOUNT_MISMATCH,
          label: getValidationErrorLabel(ValidationErrorKey.TOTAL_AMOUNT_MISMATCH, field),
        }
      );
      break;

    case DynamicFormFieldTypes.QUESTIONNAIRE:
      errors.push(
        {
          value: ValidationErrorKey.MISSING_QUESTION,
          label: getValidationErrorLabel(ValidationErrorKey.MISSING_QUESTION, field),
        },
        {
          value: ValidationErrorKey.MISSING_ANSWER,
          label: getValidationErrorLabel(ValidationErrorKey.MISSING_ANSWER, field),
        },
        {
          value: ValidationErrorKey.MISSING_EXPLANATION,
          label: getValidationErrorLabel(ValidationErrorKey.MISSING_EXPLANATION, field),
        }
      );
      break;

    case DynamicFormFieldTypes.CROP_DETAILS:
    case DynamicFormFieldTypes.LIVESTOCK:
    case DynamicFormFieldTypes.USE_OF_FUNDS:
    case DynamicFormFieldTypes.LOAN_INFORMATION:
    case DynamicFormFieldTypes.BORROWERS:
      errors.push({
        value: ValidationErrorKey.MISSING_FIELDS,
        label: getValidationErrorLabel(ValidationErrorKey.MISSING_FIELDS, field),
      });
      break;

    default:
      break;
  }

  return errors;
}

export function computeSuppressedErrors(
  formDefinition: (DynamicFormField<unknown> | DynamicFormSection)[]
): Record<string, string[]> {
  const suppressed: Record<string, string[]> = {};

  function walk(
    elements: (DynamicFormField<unknown> | DynamicFormSection)[]
  ): void {
    for (const element of elements) {
      if (
        element.dependsOn?.operation === ComparisonOperators.IS_NOT_VALID &&
        element.dependsOn.field
      ) {
        const fieldName = element.dependsOn.field;
        suppressed[fieldName] ??= [];
        suppressed[fieldName].push(
          element.dependsOn.value || ALL_NON_REQUIRED_SENTINEL
        );
      }

      if (isDynamicFormSection(element)) {
        walk((element as DynamicFormSection).fields);
      }
    }
  }

  walk(formDefinition);
  return suppressed;
}
