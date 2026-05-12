import type { RequestUserRoles } from '../requestModels';

// ============================================================================
// Enums
// ============================================================================

export enum ConditionEnum {
  VALUE_COMPARISON = 'VALUE_COMPARISON',
  REGEX = 'REGEX',
  ELSE = 'ELSE',
}

export enum OperatorEnum {
  EQUAL = 'EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL_TO = 'GREATER_THAN_OR_EQUAL_TO',
  LESS_THAN_OR_EQUAL_TO = 'LESS_THAN_OR_EQUAL_TO',
  NOT_EQUAL = 'NOT_EQUAL',
}

export enum RuleRequiredForKeyEnum {
  INTAKE_FORM = 'INTAKE_FORM',
  APPROVAL = 'APPROVAL',
  DISBURSEMENT = 'DISBURSEMENT',
}

export enum RuleTypeKeyEnum {
  ELIGIBILITY_RULES = 'ELIGIBILITY_RULES',
  RENEWAL_ELIGIBILITY_RULES = 'RENEWAL_ELIGIBILITY_RULES',
  PRICING_RULES = 'PRICING_RULES',
  LIBRARY_RULES = 'LIBRARY_RULES',
}

export enum RepaymentStructureEnum {
  SINGLE_PAY_AT_MATURITY = 'Single-Pay at Maturity',
  INTEREST_ONLY_BALLOON_AT_MATURITY = 'Interest-Only, Balloon at Maturity',
  LEVEL_PRINCIPAL_AND_INTEREST = 'Level Principal & Interest (Amortizing)',
  PRINCIPAL_ONLY_WITH_BALLOON = 'Principal-Only with Balloon',
  SEASONAL_PRINCIPAL_WITH_BALLOON = 'Seasonal Principal with Balloon',
  SEASONAL_PRINCIPAL_AND_INTEREST = 'Seasonal Principal & Interest (Seasonal Amortization)',
  DUE_ON_DEMAND = 'Due on Demand',
}

// Frequencies
export enum PaymentFrequencyEnum {
  AT_MATURITY = 'At Maturity',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  SEMI_ANNUAL = 'Semi-Annual',
  ANNUAL = 'Annual',
  SEASONAL = 'Seasonal',
  BI_WEEKLY = 'Bi-Weekly',
  WEEKLY = 'Weekly',
}

// TimeUnits
export enum GracePeriodUnitEnum {
  DAYS = 'Days',
  WEEKS = 'Weeks',
  MONTHS = 'Months',
  YEARS = 'Years',
}

export enum CurrencyEnum {
  USD = 'USD',
  CAD = 'CAD',
}

export enum InterestRateTypeEnum {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
}

export type TemplateKind = 'program' | 'product';

export interface ProductMetadata {
  templateKind?: TemplateKind;
  [key: string]: unknown;
}

// ============================================================================
// Base schemas
// ============================================================================

export interface RuleType {
  key: RuleTypeKeyEnum;
  label: string;
}

export interface DecisionEngine {
  type: 'INTERNAL' | 'AGRI_ACCESS' | 'FARMER_MAC';
}

export interface ApprovalLimit {
  id: string; // UUID4
  groupIds?: string[]; // List of UUID4, default: []
  limit?: number; // default: 0
}

export interface Comparison {
  operator?: OperatorEnum; // default: OperatorEnum.EQUAL
  value: string;
}

export interface CriteriaRule {
  id: string; // UUID4
  condition?: ConditionEnum; // default: ConditionEnum.VALUE_COMPARISON
  points?: number; // default: 0
  comparisons?: Comparison[]; // default: []
}

export interface ScoreCardCriteria {
  id: string; // UUID4
  name: string;
  fieldId?: string; // UUID4
  weight: number;
  rules: CriteriaRule[];
}

export interface ScoreCardLibrary {
  id?: string;
  key: string;
  name: string;
  scoreCardList: ScoreCardCriteria[];
}

// ============================================================================
// Validation schemas
// ============================================================================

export interface RegexValidation {
  validationType: 'regex';
  value: string;
}

export interface ValueComparisonValidation {
  validationType: 'value_comparison';
  value: string;
  operator: OperatorEnum;
}

export interface ManualValidation {
  validationType: 'manual';
}

export interface FilledValidation {
  validationType: 'filled';
}

export type ValidationOptions =
  | RegexValidation
  | ValueComparisonValidation
  | ManualValidation
  | FilledValidation
  | null
  | undefined;

// ============================================================================
// Product Rules schemas
// ============================================================================

/**
 * ProductRule - Schema for API responses
 */
export interface ProductRule {
  id?: string; // UUID4
  name: string;
  requiredFor?: RuleRequiredForKeyEnum;
  description?: string | null;
  fieldId?: string; // UUID4
  validationOptions?: ValidationOptions;
  category: string;
  appliesTo?: RequestUserRoles[] | null;
  ruleType?: RuleTypeKeyEnum;
  adjustment?: number; // default: 0
}

export interface ProductRuleLibrary {
  id?: string;
  key: string;
  name: string;
  productRulesList: ProductRule[];
}

// ============================================================================
// Interest Rate Steps schemas
// ============================================================================

export interface InterestRateStep {
  startingOn: number; // The date at which the interest rate comes into effect. When null, the interest rate is effective upon
  endingOnValue?: number | null;
  endingOnUnit?: 'MONTHS' | 'DAYS' | 'WEEKS' | 'YEARS' | 'SPECIFIC_DATE';
  interestRateType: InterestRateTypeEnum; // The type of interest rate
  rateValue: number; // The interest rate value - 0.25 means 25%
  baseIndiceId?: string | null;
  retailerAdjustment?: number | null;
  comments?: string | null; // Additional information about the interest rate
}

// ============================================================================
// Fees schemas
// ============================================================================

// /**
//  * Fee amount application rules - how the fee amount is applied
//  */
// export enum FeeAmountApplicationRules {
//   ADD = 'ADD',
//   SUBTRACT = 'SUBTRACT',
//   MULTIPLY = 'MULTIPLY',
//   DIVIDE = 'DIVIDE',
//   REPLACE = 'REPLACE',
// }

// /**
//  * Fee amount types - the type of amount (percentage or fixed)
//  */
// export enum FeeAmountTypes {
//   PERCENTAGE = 'PERCENTAGE',
//   CENTS = 'CENTS',
// }

/**
 * Preset fee schema - reference to a preset fee by ID
 */
export interface PresetFeeSchema {
  type: 'preset';
  id: string; // UUID4
}

/**
 * Custom fee schema - user-defined fee with custom properties
 */
// export interface CustomFeeSchema {
//   type: 'custom';
//   id: string; // UUID4
//   name: string;
//   amount: number; // Decimal as number
//   amountApplicationRule?: FeeAmountApplicationRules; // default: FeeAmountApplicationRules.ADD
//   amountType?: FeeAmountTypes; // default: FeeAmountTypes.PERCENTAGE
//   triggerEvent: string;
//   triggerData?: Record<string, unknown>; // dict as Record<string, unknown>, default: {}
// }

/**
 * Product fee schema - can be either preset or custom (discriminated union)
 */
export type ProductFee = {
  fee: PresetFeeSchema; // | CustomFeeSchema;
};

// ============================================================================
// Product schemas
// ============================================================================

/**
 * Product - Schema for API responses
 */
export interface Product {
  id?: string; // UUID4
  name: string;
  repaymentStructure?: RepaymentStructureEnum; // default: SINGLE_PAY_AT_MATURITY
  paymentFrequency?: PaymentFrequencyEnum; // default: AT_MATURITY
  gracePeriodUnit?: GracePeriodUnitEnum; // default: DAYS
  gracePeriodValue?: number | null;
  fees: ProductFee[]; // List of UUID4, default: []
  productCode?: string | null;
  revolving?: boolean; // default: false
  currency?: CurrencyEnum; // default: USD
  servicingEntityIds?: string[]; // List of UUID4, default: []
  fundingEntityIds?: string[]; // List of UUID4, default: []
  retailers?: string[]; // List of UUID4, default: []
  description?: string | null;
  approvalLimits?: ApprovalLimit[]; // default: []
  scoreCard?: ScoreCardCriteria[]; // default: []
  rules?: ProductRule[]; // default: [] - uses ProductRule (full objects)
  interestRateSteps: InterestRateStep[]; // default: []
  decisionEngine?: DecisionEngine; // default: { type: "INTERNAL" }
  regulations?: string[];
  productMetadata?: ProductMetadata;
  parentId?: string | null; // UUID4
  parentVersion?: number | null;
  version?: number; // default: 1
  isTemplate?: boolean; // default: false
  createdAt?: number;
  createdBy?: string | null;
  createdByIdentifier?: string | null;
  updatedAt?: number | null;
  updatedBy?: string | null;
  updatedByIdentifier?: string | null;
  deletedDate?: number | null;
  deletedBy?: string | null;
  deletedByIdentifier?: string | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}
export interface Program extends Product {
  products: Product[];
}

export interface ProductsPaginatedResponse {
  items: Product[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export enum QualifyingEnum {
  QUALIFYING = 'QUALIFYING',
  MISSING = 'MISSING',
  NOT_QUALIFYING = 'NOT_QUALIFYING',
}

export enum EligibilityEnum {
  ELIGIBLE = 'ELIGIBLE',
  POTENTIALLY_ELIGIBLE = 'POTENTIALLY_ELIGIBLE',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
}

/**
 * ProductForDisplay - Shape for displaying a product in the UI
 */

export type ProductPart = 'APPROVAL_LIMITS' | 'SCORECARD' | RuleTypeKeyEnum;

export interface ProductRuleDisplay {
  id: string;
  name: string;
  qualifying: QualifyingEnum;
  valueDisplay: unknown;
}

export interface ProductRuleCategoryDisplay {
  id: string;
  name: string;
  qualifying: QualifyingEnum;
  rules: ProductRuleDisplay[];
}
export interface ProductSectionDisplay {
  type: ProductPart;
  qualifying: QualifyingEnum;
  categories?: ProductRuleCategoryDisplay[];
  value?: string; // For approval limits, scorecard, etc.
}

export interface ProductDisplay {
  programName: string;
  productName?: string;
  rateDisplay?: string;
  qualifying: QualifyingEnum;
  wordDisplay?: string;
  sections: ProductSectionDisplay[];
}
