import type { UUID } from '../../../models/utils';
import { type CreditLineOverviewSchema } from './credit-lines.models';
import { type LoanOverviewSchema } from './loans.models';

type UserCreditHistorySchema = {
  userId: UUID; // Represents a UUID
  datetime: number; // Represents a timestamp in seconds

  // Note: availableXXXXXXCents fields are the available unused portion of the pre-approved credit limit
  availableLoanCents: number; // Amount in cents for available loans
  availableCreditLineCents: number; // Amount in cents for available credit lines
  usedLoansCents: number; // Amount in cents for used loans
  usedCreditLinesCents: number; // Amount in cents for used credit lines
};

export type UserOverviewSchema = {
  activeLoans: LoanOverviewSchema[];
  inactiveLoans: LoanOverviewSchema[];
  creditLines: CreditLineOverviewSchema[];
  userCreditHistory: UserCreditHistorySchema[];
};
