import { RequestUserTypes as UserTypes } from '../../../models/requestModels';
import { SharedViewUserProfile } from '../../../models/userModels';
import { CollateralFullOnLoanSchema } from './collaterals.models';
import { EscrowBaseSchema } from './escrow.models';
import { AttachmentSchema } from './lend.models';
import {
  LendingAccountStatuses as AccountStatuses,
  Frequencies,
  InterestAttributes,
  LoanTypes,
  StatementStatuses,
  LendingTimeUnits as TimeUnits,
  UserRoles,
} from './lending.enums';

/**
 * This schema represents the overview structure for a Loan.
 */
export interface LoanOverviewSchema {
  id: string; // Represents a UUID
  name: string; // Name of the loan
  accountNumber: string; // Account number associated with the loan
  outstandingBalanceCents: number; // Outstanding balance in cents
  accountType: LoanTypes; // TODO this is missing from api
  nextPaymentDueDate: number; // Timestamp for the next payment due date
  nextPaymentCents: number; // TODO missing from the api
  userCanShare: boolean;
  userIsCollaborator: boolean;
  inHouse: boolean;
  portalUrl?: string;
  servicerName?: string;
  escrowedAmountCents?: number;
  principalBalanceCents: number; // TODO add
  isNSF: boolean;
}

export interface YearLoanHistoryOverviewSchema {
  loanId: string;
  year: number;
  recordDate: number;
  accruedInterestCents: number;
  interestPaidCents: number;
  principalPaidCents: number;
  principalAndInterestPaidCents: number;
  lateFeesPaidCents: number;
  notSufficientFundsFeesPaidCents: number;
}

export interface LoanBaseSchema {
  id: string;
  escrowerId?: string;
  lenderOrganizationId: string;
  parentLoanId?: string;
  servicerId?: string;
  description?: string;
  lastServiceDate: number;
  originalOutstandingCents: number;
  originalPrincipalCents: number;
  outstandingBalanceCents: number;
  principalBalanceCents: number;
  projectedEndDate: number;
  termDueDate: number;
  unappliedBalanceCents?: number;
  upcomingLumpsumPaymentCents?: number;
  escrowedAmountCents?: number;
  attachments?: AttachmentSchema[];
}

export interface LoanStatementBaseSchema {
  id: string;
  loanId: string;
  dateDue: number;
  dateEmitted: number;
  lastUpdate: number;
  lastUpdateByOrgUser: string;
  otherOutstandingChargesCents?: number;
  pastDueAmountCents?: number;
  regularAmountDueCents: number;
  statementStatus: StatementStatuses;
  upcomingLumpsumPaymentCents?: number;
  lateFeesCents?: number;
  legalFeesCents?: number;
  otherFeesCents?: number;
  principalAndInterestDueCents?: number;
  statementDocumentId?: string;
  digest?: string;
}

export interface LoanUserBaseSchema {
  loanId: string;
  creditLineId?: string;
  userId: string;
  role: UserRoles;
  userType: UserTypes;
  shouldReceiveAnnualStatement: boolean;
  profile?: SharedViewUserProfile;
  representatives?: string[];
}

export interface DetailedLoanCompoundSchema {
  id: string;
  name: string;
  accountNumber: string;
  accountStatus: AccountStatuses;
  accountType: LoanTypes;
  currentCommitmentCents: number;
  graceUnit: TimeUnits;
  graceValue: number;
  interestRateAttributes: InterestAttributes[];
  interestRatePerc: number;
  isNSF: boolean;
  lateFeePerc: number;
  lenderOrganizationId: string;
  maturityDate: number;
  nextPaymentCents: number;
  nextPaymentDueDate: number;
  nextPaymentDate: number;
  originalPrincipalCents: number;
  originationDate: number;
  outstandingBalanceCents: number;
  parentLoanId?: string;
  paymentFrequency: Frequencies;
  principalBalanceCents: number;
  principalBalanceHistory: Record<string, number>;
  projectedEndDate: number;
  rateAdjustmentFrequency: Frequencies;
  nextRateResetDate?: number;
  userCanShare: boolean;
  userIsCollaborator: boolean;
  servicerId?: string;
  servicerName?: string;
  servicerOrganizationId?: string;
  servicerPaymentPortalUrl?: string;
  servicerPhoneNumber?: string;
  inHouse: boolean;
  users: LoanUserBaseSchema[];
  collaterals: CollateralFullOnLoanSchema[];
  escrow?: EscrowBaseSchema;
  escrowedAmountCents?: number;
  attachments?: AttachmentSchema[];
  closedDate?: number;
  fundingEntities: unknown[];
}

export type Loan = DetailedLoanCompoundSchema;
