import { getUUID4 } from '../../utils/stringUtil';

export type FormModes = 'edit' | 'display' | 'locked';
export type DynamicFormData = Record<string, unknown>;

export enum FormTypes {
  INLINE = 'INLINE',
  TABS = 'TABS',
  STEPS = 'STEPS',
}

export enum SectionLayouts {
  ONE_COLUMN = 'ONE_COLUMN',
  TWO_COLUMNS = 'TWO_COLUMNS',
  THREE_COLUMNS = 'THREE_COLUMNS',
}

export enum ComparisonOperators {
  NONE = 'NONE',
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  BETWEEN = 'BETWEEN',
  IS_VALID = 'IS_VALID',
  IS_NOT_VALID = 'IS_NOT_VALID',
}

export enum DynamicFormFieldTypes {
  CUSTOM_FIELD = 'CUSTOM_FIELD',
  COMPUTED = 'COMPUTED',
  LOAN_INFORMATION = 'LOAN_INFORMATION',
  LOAN_PURPOSE = 'LOAN_PURPOSE',
  LOAN_SOURCES = 'LOAN_SOURCES',
  BORROWERS = 'BORROWERS',
  DISCLAIMER = 'DISCLAIMER',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  SUBMIT_BUTTON = 'SUBMIT_BUTTON',
  FILE_UPLOAD = 'FILE_UPLOAD',
  CROP_DETAILS = 'CROP_DETAILS',
  USE_OF_FUNDS = 'USE_OF_FUNDS',
  LIVESTOCK = 'LIVESTOCK',
  REPEATABLE_CARD = 'REPEATABLE_CARD',
  INFO = 'INFO',
  ON_SCREEN_APPROVAL = 'ON_SCREEN_APPROVAL',
  NOTE = 'NOTE',
  INPUT = 'INPUT',
  DATE = 'DATE',
  TEXT = 'TEXT',
  MONEY = 'MONEY',
  NUMBER = 'NUMBER',
  RADIO = 'RADIO',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
}

export type ComputedOutputType = 'text' | 'number' | 'money';
export interface DependsOn {
  field: string;
  operation: ComparisonOperators;
  value: string;
}

export type DynamicFormFieldOption = {
  label: string;
  value: string;
  description?: string;
};

export interface DynamicFormFieldParameters {
  options?: DynamicFormFieldOption[];
  decimalPrecision?: number;
  minimumLength?: number;
  maximumLength?: number;
  minimumValue?: number;
  maximumValue?: number;
  type?: 'text' | 'email' | 'tel' | 'ssn';
  placeholder?: string;
  validator?: string;
  dateRestriction?: 'PAST_ONLY' | 'FUTURE_ONLY' | 'AGE_18_PLUS' | 'AGE_21_PLUS';
  visible?: boolean;
  privacy?: boolean;
  computedFormula?: string;
  computedFormulaReadOnly?: boolean;
  computedOutputType?: ComputedOutputType;
}

export interface DynamicFormField<T = string> {
  id: string;
  name: string;
  sectionId?: string;
  column: number;
  label: string;
  fieldType: DynamicFormFieldTypes;
  parameters: DynamicFormFieldParameters;
  required?: boolean;
  value?: T;
  dependsOn?: DependsOn;
  prefillable?: boolean;
  prefillSourceKey?: string;
  valid?: boolean;
}

export enum Directions {
  ROW = 'ROW',
  COLUMN = 'COLUMN',
}

export interface DynamicFormSection {
  id: string;
  name?: string;
  description?: string;
  column?: number;
  layout: SectionLayouts;
  fields: Array<DynamicFormField<unknown> | DynamicFormSection>;
  direction?: Directions;
  dependsOn?: DependsOn;
  touched?: boolean;
  valid?: boolean;
}

export interface FormOptions {
  useHeaderNavigation?: boolean;
  useButtonNavigation?: boolean;
  displayReviewScreenOnSubmit?: boolean;
  submitMessage?: string;
}

export interface DynamicForm {
  id?: string;
  template?: boolean;
  name: string;
  formType: FormTypes;
  formDefinition: Array<DynamicFormField<unknown> | DynamicFormSection>;
  formOptions: FormOptions;
  data: DynamicFormData;
  digest?: string;
  createdAt?: number;
  updatedAt?: number;
  submitted?: boolean;
  submittedBy?: string | null;
}

export interface DynamicFormExportSignatureBlockSchema {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface DynamicFormDownloadSchema {
  id: string;
  digest: string;
  signatures?: DynamicFormExportSignatureBlockSchema[];
}

export interface MultipleDynamicFormsDownloadSchema {
  forms: DynamicFormDownloadSchema[];
  signatures?: DynamicFormExportSignatureBlockSchema[];
}

export function getDefaultDynamicForm(): DynamicForm {
  return {
    name: '',
    formDefinition: [
      {
        id: getUUID4(),
        name: 'New Form Section',
        description: '',
        layout: SectionLayouts.ONE_COLUMN,
        fields: [],
        direction: Directions.COLUMN,
      },
    ],
    formOptions: {},
    formType: FormTypes.INLINE,
    data: {},
  };
}
