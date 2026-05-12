import { ComparisonOperators } from '../../dynamic-forms/models/dynamic-forms.models';

export enum RequiredFor {
  INTAKE = 0, // Dynamic form that will be used to generate a request
  APPLICATION = 10, // Validation of the request, consider as complete
  PROCESSING = 20, // Required for us to process the application automatically
}

export enum ValidationTypes {
  LLM = 'LLM',
  REGEX = 'REGEX',
  VALUE_COMPARISON = 'VALUE_COMPARISON',
  MANUAL = 'MANUAL',
}

export interface UnsavedProductRequirement {
  productId?: string;
  name: string;
  description: string;
  category: string;
  fieldName: string;
  fieldNameAliases: string[];
  requiredFor: RequiredFor;
  validations: ValidationTypes[];
  validationComparisonOperator?: ComparisonOperators;
  validationComparisonValue?: string;
  validationRegex?: string;
  validationPrompt?: string;
  validationPromptExampleDocuments?: string[];
}

export interface ProductRequirement extends UnsavedProductRequirement {
  id?: string;
  createdAt?: number;
  updatedAt?: number | null;
}

export function getDefaultRequirement(): ProductRequirement {
  return {
    name: '',
    category: '',
    description: '',
    fieldName: '',
    fieldNameAliases: [],
    requiredFor: RequiredFor.INTAKE,
    validations: [],
  };
}
