import type { UUID, WithId } from '../../../models/utils';
import { type CollateralFullOnLoanSchema } from './collaterals.models';
import { type EscrowBaseSchema } from './escrow.models';
import { type AttachmentSchema } from './lend.models';
import type {
  LendingAccountStatuses as AccountStatuses,
  Frequencies,
  InterestAttributes,
  LendTypes,
  StatementStatuses,
  LendingTimeUnits as TimeUnits,
} from './lending.enums';
import { CreditLineTypes } from './lending.enums';
import { type LoanUserBaseSchema } from './loans.models';

/**
 * Overview structure for a Credit Line - simplified view for lists and summaries
 */
export type CreditLineOverviewSchema = {
  /** Unique identifier (UUID) */
  id: UUID;

  /** ID of the lending organization (UUID) */
  lenderOrganizationId: UUID;

  /** Type of credit line (RLOC, NLOC) */
  accountType: CreditLineTypes;

  /** Display name for the credit line */
  name: string;

  /** Total credit limit in cents */
  creditLimitCents: number;

  /** Amount of credit currently used in cents */
  usedCreditCents?: number;

  /** Account number for identification */
  accountNumber: string;

  /** Whether the borrower can share this information */
  userCanShare: boolean;

  /** Whether the borrower is a collaborator on this credit line */
  userIsCollaborator: boolean;

  /** Whether serviced in-house or externally */
  inHouse: boolean;

  /** URL to external servicer's portal if applicable */
  portalUrl?: string;

  /** Name of external servicer if applicable */
  servicerName?: string;

  /** Amount held in escrow in cents */
  escrowedAmountCents?: number;
  isNSF: boolean;
};

/**
 * Year-to-date credit line history overview
 */
export type YearCreditLineHistoryOverviewSchema = {
  /** ID of the credit line this history belongs to */
  creditLineId: string;

  /** Year for this history record */
  year: number;

  /** Unix timestamp when this record was created */
  recordDate: number;

  /** Interest accrued year-to-date in cents */
  accruedInterestCentsYtd?: number;

  /** Interest paid year-to-date in cents */
  interestPaidCentsYtd?: number;

  /** Late fees paid year-to-date in cents */
  lateFeesPaidCentsYtd: number;

  /** NSF (Non-Sufficient Funds) fees paid year-to-date in cents */
  nonSufficientFundsFeesPaidCentsYtd: number;

  /** Total amount paid year-to-date in cents */
  paidCentsYtd: number;

  /** Total amount withdrawn/drawn year-to-date in cents */
  withdrawnCentsYtd: number;
};

/**
 * Credit line statement - periodic billing statement
 */
export type CreditLineStatementBaseSchema = {
  /** Unique identifier for this statement */
  id: string;

  /** ID of the credit line this statement belongs to */
  creditLineId: string;

  /** Unix timestamp when payment is due */
  dateDue: number;

  /** Unix timestamp when statement was issued */
  dateEmitted: number;

  /** Unix timestamp of last update to this statement */
  lastUpdate: number;

  /** ID of the organization user who last updated this statement */
  lastUpdateByOrgUser: string;

  /** Minimum payment amount required in cents */
  minimumPaymentCents?: number;

  /** Amount past due from previous statements in cents */
  pastDueAmountCents?: number;

  /** Current status of the statement (PENDING, PAID, OVERDUE, etc.) */
  statementStatus?: StatementStatuses;

  /** Late fees charged on this statement in cents */
  lateFeesCents?: number;

  /** Legal fees charged on this statement in cents */
  legalFeesCents?: number;

  /** Other miscellaneous fees charged in cents */
  otherFeesCents?: number;

  /** Amount held in escrow at time of statement in cents */
  escrowedAmountCents?: number;

  /** Attached documents (PDF statement, supporting docs, etc.) */
  attachments?: AttachmentSchema[];

  /** ID of the generated statement document */
  statementDocumentId?: string;

  /** Cryptographic hash/digest of the statement for verification */
  digest?: string;
};

/**
 * Step interest rate schedule - defines rate changes over time
 */
export interface StepInterestRate {
  /** Unix timestamp when this rate period starts */
  startOn: number;

  /** Unix timestamp when this rate period ends (null if ongoing) */
  endOn: number | null;

  /** Alternative: end period by number of months from start */
  endOnSpanMonths: number | null;

  /** Whether this is a fixed or variable rate */
  rateType: 'FIXED' | 'VARIABLE';

  /** Spread added to rate basis (for variable rates, null for fixed) */
  rateSpread: number | null;

  /** Fixed interest rate percentage (for fixed rates, null for variable) */
  interestRatePerc: number | null;

  /** Rate basis/index name (e.g., "CHS Base", "PRIME") */
  rateBasis: string | null;

  /** Computed effective rate for variable rates */
  effectiveVariableRate: number | null;

  /** Human-readable comment about this rate period */
  comment: string;

  /** Description of this period (e.g., "Seed - Promotional Period") */
  period: string;
}

/**
 * Credit Line - recursive structure (can contain child credit lines as sublines)
 */
export type CreditLine = {
  /** Unique identifier for the credit line */
  id: string;

  /** Display name for the credit line */
  name?: string;

  /** Account number used for identification and reference */
  accountNumber: string;

  /** Unix timestamp when the account was opened */
  accountOpeningDate: number;

  /** Current status of the account (ACTIVE, CLOSED, DELINQUENT, etc.) */
  accountStatus: AccountStatuses;

  /** Type of credit line (NLOC_MASTERLINE, NLOC_FIXED_TO_VAR_MULTIPLE_PAYMENTS, etc.) */
  accountType: CreditLineTypes;

  /** Interest accrued but not yet paid in cents */
  accruedInterestCents: number;

  /** Available credit remaining in cents */
  availableCents: number;

  /** Unix timestamp when account was closed (null if active) */
  closedDate: number | null;

  /** Collateral assets securing this credit line */
  collaterals: CollateralFullOnLoanSchema[];

  /** Total credit limit in cents */
  creditLimitCents: number;

  /** Current commitment amount in cents */
  currentCommitmentCents: number;

  /** Optional escrow account */
  escrow: WithId<EscrowBaseSchema> | null;

  /** Amount held in escrow in cents */
  escrowedAmountCents: number;

  /** Entities providing funding for this credit line */
  fundingEntities: unknown[];

  /** Time unit for grace period */
  graceUnit: TimeUnits;

  /** Numeric value for grace period */
  graceValue: number;

  /** Reference index rate name (e.g., "PRIME", "SOFR") */
  indexRate: string | null;

  /** Interest calculation method */
  interestRateAttributes: InterestAttributes[];

  /** Annual interest rate as a percentage */
  interestRatePerc: number;

  /** Whether serviced in-house (can be null) */
  inHouse: boolean | null;

  /** Whether account has had NSF incident */
  isNSF: boolean;

  /** Late fee percentage */
  lateFeePerc: number;

  /** ID of the lending organization (can be null) */
  lenderOrganizationId: string | null;

  /** Unix timestamp when the credit line matures */
  maturityDate: number;

  /** Amount due for next payment in cents */
  nextPaymentCents: number;

  /** Unix timestamp when next payment is scheduled */
  nextPaymentDate: number;

  /** Unix timestamp when next payment is due */
  nextPaymentDueDate: number;

  /** Unix timestamp of next rate adjustment */
  nextRateResetDate: number | null;

  /** Original principal amount in cents */
  originalPrincipalCents: number;

  /** How often payments are required */
  paymentFrequency: Frequencies;

  /** How often the interest rate can be adjusted */
  rateAdjustmentFrequency: Frequencies;

  /** ID of the retailer associated with this credit line */
  retailerId?: string | null;

  /** ID of the loan servicer */
  servicerId: string | null;

  /** Name of the loan servicer */
  servicerName: string | null;

  /** Organization ID of the loan servicer */
  servicerOrganizationId: string | null;

  /** URL for borrower payment portal */
  servicerPaymentPortalUrl: string | null;

  /** Contact phone number for the servicer */
  servicerPhoneNumber: string | null;

  /** Step interest rate schedules defining rate changes over time */
  stepInterestRates: StepInterestRate[];

  /** Child credit lines (recursive) - empty array if no children */
  sublines: CreditLine[];

  /** Total amount currently due in cents */
  totalAmountDueCents: number;

  /** Total credit currently used/drawn in cents */
  usageCents: number;

  /** Whether the borrower can share this information */
  userCanShare: boolean;

  /** Whether the borrower is a collaborator on this credit line */
  userIsCollaborator: boolean;

  /** Users associated with this credit line */
  users: LoanUserBaseSchema[];

  /** Document attachments (optional) */
  attachments?: AttachmentSchema[];

  lendingType?: LendTypes;
};

/**
 * Detailed credit line - can be either mainline (with sublines) or standalone
 */
export type DetailedCreditLineCompoundSchema = CreditLine;

export function isStandaloneCreditLine(
  creditLine?: DetailedCreditLineCompoundSchema
): creditLine is Omit<DetailedCreditLineCompoundSchema, 'sublines'> & {
  sublines: never;
} {
  const sublines = creditLine?.sublines ?? [];
  return sublines.length === 0;
}

export function isMainlineCreditLine(
  creditLine?: DetailedCreditLineCompoundSchema
): creditLine is Omit<DetailedCreditLineCompoundSchema, 'sublines'> & {
  sublines: DetailedCreditLineCompoundSchema[];
} {
  return !isStandaloneCreditLine(creditLine);
}

/**
 * Checks if a credit line type is any variant of NLOC (Non-Revolving Line of Credit)
 * @param accountType - The credit line type to check
 * @returns true if the type is NLOC or any NLOC variant
 */
export function isNLOCType(accountType?: CreditLineTypes): boolean {
  if (!accountType) return false;

  return (
    accountType === CreditLineTypes.NLOC ||
    accountType === CreditLineTypes.NLOC_FIXED_TO_VAR_SINGLE_PAYMENT ||
    accountType === CreditLineTypes.NLOC_FIXED_TO_VAR_MULTIPLE_PAYMENTS ||
    accountType === CreditLineTypes.NLOC_MASTERLINE
  );
}

/**
 * Checks if a credit line type is RLOC (Revolving Line of Credit)
 * @param accountType - The credit line type to check
 * @returns true if the type is RLOC
 */
export function isRLOCType(accountType?: CreditLineTypes): boolean {
  return accountType === CreditLineTypes.RLOC;
}

// export type CreditLine = DetailedCreditLineCompoundSchema;
