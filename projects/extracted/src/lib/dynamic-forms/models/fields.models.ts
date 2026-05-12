import type { RequestUserTypes } from '../../models/requestModels';
import type { InterestTypes } from '../../services/lending/models/lending.enums';
import type { PaymentFrequencies } from '../../utils/loanUtil';
import { getUUID4 } from '../../utils/stringUtil';
import {
  type DynamicFormField,
  DynamicFormFieldTypes,
} from './dynamic-forms.models';

export function getDefaultBorrower(): BorrowerModel {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  };
}

export function getDefaultBorrowersFieldValue() {
  return {
    mainBorrower: getDefaultBorrower(),
    hasCoBorrowers: false,
    coBorrowers: [],
  };
}

export interface BorrowerModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isBusiness?: boolean;
  businessName?: string;
  businessType?: RequestUserTypes;
}

export interface BorrowersFieldModel {
  mainBorrower: BorrowerModel;
  hasCoBorrowers: boolean;
  coBorrowers: Array<BorrowerModel>;
}

export enum LivestockTypes {
  HOGS = 'HOGS',
  BEEF_CATTLE = 'BEEF_CATTLE',
  DAIRY = 'DAIRY',
  POULTRY = 'POULTRY',
  OTHER = 'OTHER',
}

export interface LivestockDetailsFieldModel {
  id?: string;
  typeOfLiveStock: LivestockTypes;
  typeOfOperation: string;
  otherDetails: string;
  herdSize: number;
  averageSaleQuantity: string;
  averageSalePricePerHead: number;
  averageHeadSoldPerYear: number;
  integratorOrMarketerName: string;
  comments: string;
}

export enum UseOfFundTypes {
  REFINANCE = 'REFINANCE',
  WORKING_CAPITAL_FOR_OPERATIONS = 'WORKING_CAPITAL_FOR_OPERATIONS',
  CAPITAL_IMPROVEMENTS = 'CAPITAL_IMPROVEMENTS',
  CASH_OUT_OR_OTHER = 'CASH_OUT_OR_OTHER',
}

export enum RefinanceLoanTypes {
  REAL_ESTATE_SECURED_LOANS = 'REAL_ESTATE_SECURED_LOANS',
  NON_REAL_ESTATE_SECURED_LOANS = 'NON_REAL_ESTATE_SECURED_LOANS',
}

export interface UseOfFundsFieldModel {
  id?: string;
  typeOfUse: UseOfFundTypes;
  refinanceLoanType?: RefinanceLoanTypes;
  lenderName: string;
  useDetails: string;
  amount: number;
}

export enum IrrigationTypes {
  IRRIGATED = 'IRRIGATED',
  NON_IRRIGATED = 'NON_IRRIGATED',
  BOTH = 'BOTH',
}

export interface CropDetailsFieldModel {
  id?: string;
  cropType: string;
  irrigation: IrrigationTypes;
  percentageIrrigated: number;
  numberOfAcres: number;
  expectedLandValue: number;
  expectedYieldValue: number;
  expectedYieldUnit: string;
  expectedYieldUnitOther?: string;
  revenueInsuranceDetails: string;
}

export interface LoanPurposeFieldModel {
  purpose: string;
  percentage: number;
}

export interface SourceDetail {
  source: string;
  amount: number | undefined;
}

export interface LoanSourceFieldModel {
  purchasePrice: number | undefined;
  armsLengthTransaction: boolean;
  sources: SourceDetail[];
}

export interface LoanInformationFieldModel {
  loanAmount: number | undefined;
  interestType: InterestTypes;
  term: number | undefined;
  amortization: number | undefined;
  paymentFrequency: PaymentFrequencies;
}

export interface DisclaimerFieldModel {
  disclaimerTitle: string;
  disclaimer: string;
  showAcceptButton: boolean;
  disclaimerAccepted?: boolean;
  acceptedByName?: string;
  acceptedByAvatarUri?: string;
  acceptedAt?: number;
}

export function getDefaultDisclaimerFieldValue(): DisclaimerFieldModel {
  return {
    disclaimerTitle: '',
    disclaimer: '',
    disclaimerAccepted: false,
    showAcceptButton: true,
  };
}

export interface QuestionModel {
  id: string;
  text: string;
  answer: string;
  details: string;
  detailsRequestText: string;
}

export interface QuestionnaireFieldModel {
  title: string;
  questions: Array<QuestionModel>;
  askForExplanations: boolean;
}

export interface FileUploadAttachment {
  id: string;
  name: string;
  documentId?: string;
  digest?: string;
  exported?: boolean;
}

export interface FileUploadFieldModel {
  files: FileUploadAttachment[];
  allowMultipleUploads: boolean;
  description?: string;
}

export interface OnScreenApprovalFieldModel {
  currentStatus: 'CALCULATING' | 'APPROVED' | 'MANUAL_APPROVAL' | 'PENDING';
  endStatus: 'APPROVED' | 'MANUAL_APPROVAL' | 'PENDING';
  loanAmount?: number;
}

export type NoteVariant = 'neutral' | 'warning' | 'success' | 'error';

export interface NoteFieldModel {
  variant: NoteVariant;
  note: string;
}

export type RepeatableCardRowData = Record<string, unknown> & { id?: string };

export type RepeatableCardSummaryMode =
  | 'list'
  | 'sum'
  | 'average'
  | 'percentage';

export type RepeatableCardSummaryData = Record<string, unknown>;

export interface RepeatableCardDataModel {
  rows: RepeatableCardRowData[];
  summary: RepeatableCardSummaryData;
}

export interface RepeatableCardFieldModel {
  itemFields: DynamicFormField<unknown>[];
  label: string;
  showSummary: boolean;
  titleField: string;
  summaryFieldIds?: string[];
  summaryFieldModes?: Record<string, RepeatableCardSummaryMode>;
  data: RepeatableCardDataModel;
}

export const EMPTY_REPEATABLE_CARD_FIELD: RepeatableCardFieldModel = {
  itemFields: [],
  label: '',
  showSummary: false,
  titleField: '',
  data: { rows: [], summary: {} },
};

export function normalizeRepeatableCardFieldModel(
  raw: unknown
): RepeatableCardFieldModel {
  if (Array.isArray(raw)) {
    return {
      ...EMPTY_REPEATABLE_CARD_FIELD,
      data: { rows: raw as RepeatableCardRowData[], summary: {} },
    };
  }
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_REPEATABLE_CARD_FIELD };
  }
  const o = raw as Record<string, unknown>;

  const itemFields = (Array.isArray(o.itemFields)
    ? o.itemFields
    : EMPTY_REPEATABLE_CARD_FIELD.itemFields) as DynamicFormField<unknown>[];
  const label = typeof o.label === 'string' ? o.label : '';
  const showSummary = o.showSummary === true;
  const titleField = typeof o.titleField === 'string' ? o.titleField : '';
  const summaryFieldIds = o.summaryFieldIds as string[] | undefined;

  let summaryFieldModes:
    | Record<string, RepeatableCardSummaryMode>
    | undefined;
  if (
    o.summaryFieldModes &&
    typeof o.summaryFieldModes === 'object' &&
    !Array.isArray(o.summaryFieldModes)
  ) {
    summaryFieldModes = {
      ...(o.summaryFieldModes as Record<string, RepeatableCardSummaryMode>),
    };
  }

  let rows: RepeatableCardRowData[] = [];
  let summary: RepeatableCardSummaryData = {};

  if (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) {
    const d = o.data as Record<string, unknown>;
    rows = Array.isArray(d.rows)
      ? (d.rows as RepeatableCardRowData[])
      : [];
    if (
      d.summary &&
      typeof d.summary === 'object' &&
      !Array.isArray(d.summary)
    ) {
      summary = { ...(d.summary as Record<string, unknown>) };
    }
  } else if (Array.isArray(o.rows)) {
    rows = o.rows as RepeatableCardRowData[];
    summary = {};
  }

  return {
    itemFields,
    label,
    showSummary,
    titleField,
    summaryFieldIds,
    summaryFieldModes,
    data: { rows, summary },
  };
}

// TODO @JF we may want to rename those fields to be more accurate
export function getDefaultFieldNames(
  field: DynamicFormField<unknown>
): string[] {
  if (field.fieldType === DynamicFormFieldTypes.BORROWERS) {
    return [
      field.name,
      'mainBorrower',
      'coBorrowers',
      'hasCoBorrowers',
      'firstName',
      'lastName',
      'email',
      'phone',
      'isBusiness',
      'businessName',
      'businessType',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.LIVESTOCK) {
    return [
      field.name,
      'typeOfLiveStock',
      'typeOfOperation',
      'herdSize',
      'averageSaleQuantity',
      'averageSalePricePerHead',
      'averageHeadSoldPerYear',
      'integratorOrMarketerName',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.USE_OF_FUNDS) {
    return [
      field.name,
      'typeOfUse',
      'refinanceLoanType',
      'lenderName',
      'useDetails',
      'amount',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.CROP_DETAILS) {
    return [
      field.name,
      'cropType',
      'irrigation',
      'percentageIrrigated',
      'numberOfAcres',
      'expectedLandValue',
      'expectedLandUnit',
      'expectedYieldValue',
      'expectedYieldUnit',
      'expectedYieldUnitOther',
      'revenueInsuranceDetails',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.LOAN_PURPOSE) {
    return [field.name, 'purpose', 'percentage'];
  }

  if (field.fieldType === DynamicFormFieldTypes.LOAN_SOURCES) {
    return [
      field.name,
      'purchasePrice',
      'armsLengthTransaction',
      'sources',
      'source',
      'amount',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.LOAN_INFORMATION) {
    return [
      field.name,
      'loanAmount',
      'interestType',
      'term',
      'amortization',
      'paymentFrequency',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.DISCLAIMER) {
    return [
      field.name,
      'disclaimerTitle',
      'disclaimer',
      'showAcceptButton',
      'disclaimerAccepted',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.QUESTIONNAIRE) {
    return [
      field.name,
      'title',
      'questions',
      'askForExplanations',
      'text',
      'answer',
      'details',
      'detailsRequestText',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.FILE_UPLOAD) {
    return [field.name, 'files', 'allowMultipleUploads', 'description', 'name'];
  }

  if (field.fieldType === DynamicFormFieldTypes.REPEATABLE_CARD) {
    return [
      field.name,
      'itemFields',
      'label',
      'showSummary',
      'titleField',
      'summaryFieldIds',
      'summaryFieldModes',
      'data',
      'data.rows',
      'data.summary',
    ];
  }

  if (field.fieldType === DynamicFormFieldTypes.NOTE) {
    return [field.name, 'note', 'variant'];
  }

  return [field.name];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resetValueForField(field: DynamicFormField<any>): unknown {
  const fieldType = field.fieldType;

  switch (fieldType) {
    case DynamicFormFieldTypes.TEXT:
    case DynamicFormFieldTypes.INPUT:
    case DynamicFormFieldTypes.DATE:
    case DynamicFormFieldTypes.MONEY:
    case DynamicFormFieldTypes.NUMBER:
    case DynamicFormFieldTypes.CHECKBOX:
    case DynamicFormFieldTypes.RADIO:
    case DynamicFormFieldTypes.SELECT:
    case DynamicFormFieldTypes.SUBMIT_BUTTON:
    case DynamicFormFieldTypes.LOAN_INFORMATION:
    case DynamicFormFieldTypes.LOAN_SOURCES:
    case DynamicFormFieldTypes.LOAN_PURPOSE:
    case DynamicFormFieldTypes.CROP_DETAILS:
    case DynamicFormFieldTypes.USE_OF_FUNDS:
    case DynamicFormFieldTypes.LIVESTOCK:
    case DynamicFormFieldTypes.BORROWERS:
    case DynamicFormFieldTypes.CUSTOM_FIELD:
    case DynamicFormFieldTypes.COMPUTED:
      return undefined;

    case DynamicFormFieldTypes.REPEATABLE_CARD: {
      const v = normalizeRepeatableCardFieldModel(field.value);
      return {
        ...v,
        itemFields: v.itemFields.map((inner: DynamicFormField<unknown>) => ({
          ...inner,
          value: resetValueForField(inner),
        })),
        data: { rows: [], summary: {} },
      };
    }

    case DynamicFormFieldTypes.NOTE:
      return {
        variant: field.value?.variant ?? 'neutral',
        note: field.value?.note ?? '',
      };

    case DynamicFormFieldTypes.FILE_UPLOAD:
      return {
        allowMultipleUploads: field.value?.allowMultipleUploads ?? false,
        description: field.value?.description,
        files: [],
      };

    case DynamicFormFieldTypes.DISCLAIMER:
      return {
        disclaimerTitle: field.value?.disclaimerTitle ?? '',
        disclaimer: field.value?.disclaimer ?? '',
        disclaimerAccepted: false,
        showAcceptButton: field.value?.showAcceptButton ?? true,
      };

    case DynamicFormFieldTypes.QUESTIONNAIRE:
      return {
        title: field.value?.title ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions: field.value?.questions?.map((q: any) => ({
          ...q,
          answer: '',
          details: '',
        })),
        askForExplanations: field.value?.askForExplanations ?? true,
      };

    case DynamicFormFieldTypes.ON_SCREEN_APPROVAL:
      return {
        currentStatus: field.value?.currentStatus ?? 'CALCULATING',
        endStatus: field.value?.endStatus ?? 'APPROVED',
      };

    default:
      return undefined;
  }
}

export function getDefaultValueForFieldType(
  fieldType: DynamicFormFieldTypes
): unknown {
  switch (fieldType) {
    case DynamicFormFieldTypes.TEXT:
    case DynamicFormFieldTypes.INPUT:
    case DynamicFormFieldTypes.DATE:
    case DynamicFormFieldTypes.MONEY:
    case DynamicFormFieldTypes.NUMBER:
    case DynamicFormFieldTypes.CHECKBOX:
    case DynamicFormFieldTypes.RADIO:
    case DynamicFormFieldTypes.SELECT:
    case DynamicFormFieldTypes.SUBMIT_BUTTON:
    case DynamicFormFieldTypes.LOAN_INFORMATION:
    case DynamicFormFieldTypes.LOAN_SOURCES:
    case DynamicFormFieldTypes.LOAN_PURPOSE:
    case DynamicFormFieldTypes.CROP_DETAILS:
    case DynamicFormFieldTypes.USE_OF_FUNDS:
    case DynamicFormFieldTypes.LIVESTOCK:
    case DynamicFormFieldTypes.BORROWERS:
    case DynamicFormFieldTypes.CUSTOM_FIELD:
    case DynamicFormFieldTypes.COMPUTED:
      return undefined;

    case DynamicFormFieldTypes.FILE_UPLOAD:
      return {
        allowMultipleUploads: false,
        files: [],
      };

    case DynamicFormFieldTypes.DISCLAIMER:
      return {
        disclaimerTitle: '',
        disclaimer: '',
        showAcceptButton: true,
      };

    case DynamicFormFieldTypes.QUESTIONNAIRE:
      return {
        title: '',
        questions: [
          {
            id: getUUID4(),
            text: '',
            answer: '',
            details: '',
            detailsRequestText: '',
          },
        ],
        askForExplanations: true,
      };

    case DynamicFormFieldTypes.ON_SCREEN_APPROVAL:
      return {
        currentStatus: 'CALCULATING',
        endStatus: 'APPROVED',
      };

    case DynamicFormFieldTypes.REPEATABLE_CARD:
      return { ...EMPTY_REPEATABLE_CARD_FIELD };

    case DynamicFormFieldTypes.NOTE:
      return {
        variant: 'neutral',
        note: '',
      };

    default:
      return undefined;
  }
}
