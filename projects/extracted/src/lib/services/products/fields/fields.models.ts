export enum ComplianceLevel {
  PUBLIC = 'PUBLIC',
  SECRET = 'SECRET',
  PRIVATE = 'PRIVATE',
}

export interface Field {
  id?: string;
  name: string;
  label: string;
  isSystem: boolean;
  description?: string;
  notes?: string;
  fieldType: FieldTypes;
  parameters: FieldParameters;
  regulations: Record<string, boolean>;
  complianceLevel?: ComplianceLevel;
  disabled: boolean;
  isDeleted: boolean;
  createdAt?: number;
  updatedAt?: number;
  disabledDate?: number;
  disabledReason?: string;
  deletedDate?: number;
  deletedReason?: string;
  version: number;
}

export type FieldOption = {
  label: string;
  value: string;
  description?: string;
};

export interface FieldParameters {
  options?: FieldOption[];
  decimalPrecision?: number;
  minimumLength?: number;
  maximumLength?: number;
  minimumValue?: number;
  maximumValue?: number;
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  validator?: string; // ADD A FIELD VALIDATION SERVICE
  computedFormula?: string;
}

export enum FieldTypes {
  INPUT = 'INPUT',
  DATE = 'DATE',
  TEXT = 'TEXT',
  MONEY = 'MONEY',
  NUMBER = 'NUMBER',
  RADIO = 'RADIO',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  COMPUTED = 'COMPUTED',
}

export type FieldRegulation = {
  name: string;
  label: string;
};

export type RegulationsResult = Record<string, string>;
