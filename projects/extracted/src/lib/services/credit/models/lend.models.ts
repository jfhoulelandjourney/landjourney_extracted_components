export interface Lend {
  id?: string;
  escrowerId?: string | null;
  fundingEntityId?: string | null;
  lenderId?: string | null;
  parentLendId?: string | null;
  productId?: string | null;
  programId?: string | null;
  refinancedLendId?: string | null;
  retailerId?: string | null;
  servicerId?: string | null;
  accountNumber: string;
  accountOriginationDate: number;
  accountStatus: string;
  accountType: string;
  accrualMethod: string;
  attachments: unknown[];
  billingMethod: string;
  callDate?: number | null;
  capitalizationFrequencyStartDate?: number | null;
  capitalizationFrequencyEndDate?: number | null;
  capitalizationFrequencyValue?: number | null;
  capitalizationFrequencyUnit: string;
  closedDate?: number | null;
  creditLimitCents: number;
  currencyCode?: string | null;
  currentCommitmentCents: number;
  currentPrincipalCents: number;
  currentUnappliedBalanceCents: number;
  currentUpcomingLumpsumPaymentCents: number;
  description?: string | null;
  escrowedAmountCents: number;
  flags: string[];
  flagsData: unknown[];
  graceDays: number;
  includeInYearEndReporting?: string | null;
  instructions: Record<string, unknown>;
  interestType?: string | null;
  internalName?: string | null;
  lastServiceDate?: number | null;
  loanToValueBps?: string | null;
  maturityDate: number;
  maximumDrawableCents?: number | null;
  minimumDrawableCents?: number | null;
  name?: string | null;
  originalFundingCents: number;
  originalOutstandingCents: number;
  originalPrincipalCents: number;
  originationChannel: string;
  outstandingBalanceCents: number;
  paymentFrequencyStartDate?: number | null;
  paymentFrequencyEndDate?: number | null;
  paymentFrequencyValue?: number | null;
  paymentFrequencyUnit: string;
  pendingAmountCents: number;
  promissoryNote: string;
  purpose?: string | null;
  qualityRating?: string | null;
  rangeChangeControl: string;
  reportedCode?: string | null;
  reportingCodes: string[];
  roundingFactorBps?: string | null;
  roundingMethod?: string | null;
  termDueDate?: number | null;
  usedCreditCents?: number | null;
  hasBeenRestructured: boolean;
  isCallable: boolean;
  isCreditLine: boolean;
  isNsf: boolean;
  isTermLoan: boolean;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface LendSearchParams {
  id?: string[] | null;
  escrowerId?: string[] | null;
  fundingEntityId?: string[] | null;
  lenderId?: string[] | null;
  parentLendId?: string[] | null;
  productId?: string[] | null;
  programId?: string[] | null;
  refinancedLendId?: string[] | null;
  retailerId?: string[] | null;
  servicerId?: string[] | null;
  accountNumber?: string[] | null;
  accountOriginationDate?: number[] | null;
  accountStatus?: string[] | null;
  accountType?: string[] | null;
  accrualMethod?: string[] | null;
  billingMethod?: string[] | null;
  callDate?: number[] | null;
  capitalizationFrequencyStartDate?: number[] | null;
  capitalizationFrequencyEndDate?: number[] | null;
  capitalizationFrequencyValue?: number[] | null;
  capitalizationFrequencyUnit?: string[] | null;
  closedDate?: number[] | null;
  creditLimitCents?: number[] | null;
  currencyCode?: string[] | null;
  currentCommitmentCents?: number[] | null;
  currentPrincipalCents?: number[] | null;
  currentUnappliedBalanceCents?: number[] | null;
  currentUpcomingLumpsumPaymentCents?: number[] | null;
  description?: string[] | null;
  escrowedAmountCents?: number[] | null;
  graceDays?: number[] | null;
  includeInYearEndReporting?: string[] | null;
  interestType?: string[] | null;
  internalName?: string[] | null;
  lastServiceDate?: number[] | null;
  loanToValueBps?: string[] | null;
  maturityDate?: number[] | null;
  maximumDrawableCents?: number[] | null;
  minimumDrawableCents?: number[] | null;
  name?: string[] | null;
  originalFundingCents?: number[] | null;
  originalOutstandingCents?: number[] | null;
  originalPrincipalCents?: number[] | null;
  originationChannel?: string[] | null;
  outstandingBalanceCents?: number[] | null;
  paymentFrequencyStartDate?: number[] | null;
  paymentFrequencyEndDate?: number[] | null;
  paymentFrequencyValue?: number[] | null;
  paymentFrequencyUnit?: string[] | null;
  pendingAmountCents?: number[] | null;
  promissoryNote?: string[] | null;
  purpose?: string[] | null;
  qualityRating?: string[] | null;
  rangeChangeControl?: string[] | null;
  reportedCode?: string[] | null;
  roundingMethod?: string[] | null;
  termDueDate?: number[] | null;
  usedCreditCents?: number[] | null;
  hasBeenRestructured?: boolean[] | null;
  isCallable?: boolean[] | null;
  isCreditLine?: boolean[] | null;
  isNsf?: boolean[] | null;
  isTermLoan?: boolean[] | null;
  disabled?: boolean | null;
}

export interface LendAmountsHistory {
  id?: string;
  lendId: string;
  snapshotDatetime?: number | null;
  accruedInterestCentsYtd: number;
  feesPaidCentsYtd: number;
  feesPaidDetailedCentsYtd: Record<string, number>;
  interestPaidCentsYtd: number;
  lumpsumPaidCentsYtd: number;
  nsfPaidCentsYtd: number;
  outstandingCentsYtd: number;
  principalPaidCentsYtd: number;
  createdAt?: number;
  updatedAt?: number | null;
}

export interface LendCollateral {
  id?: string;
  collateralId: string;
  lendId: string;
  shareBps?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface LendDrawRequest {
  id?: string;
  lendId: string;
  requestedByUserId: string;
  amountCents: number;
  comments?: string | null;
  fundsDestination: Record<string, unknown>;
  reason?: string | null;
  requestDate: number;
  status: string;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface LendFee {
  id?: string;
  feeId: string;
  lendId: string;
  effectiveApplicationDate?: number | null;
  onLendActivationDate?: number | null;
  onLendDeactivationDate?: number | null;
  overrides: Record<string, unknown>;
  preventFee: boolean;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface LendFundingEntity {
  id?: string;
  fundingEntityId: string;
  lendId: string;
  shareBps: string;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface LendInsurance {
  id?: string;
  insurancePolicyId?: string | null;
  lendId: string;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface LendNote {
  id?: string;
  lendId: string;
  expirationDate?: number | null;
  noteCategory?: string | null;
  noteData: string;
  createdAt?: number;
  updatedAt?: number | null;
}

export interface LendReview {
  id?: string;
  lendId: string;
  lastReviewByUserId: string;
  lastReviewDate: number;
  outcome: string;
  reviewerUserId?: string | null;
  reviewerRole: string;
  frequencyStartDate?: number | null;
  frequencyEndDate?: number | null;
  frequencyValue?: number | null;
  frequencyUnit: string;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface LendRiskScoresMonitoringOverview {
  id?: string;
  lendId?: string | null;
  lendUserId?: string | null;
  asOfDate: number;
  confidenceLevelBps?: string | null;
  generatedAt: number;
  isFrozen: boolean;
  isOverriden: boolean;
  overrideReason?: string | null;
  overridenByUserId?: string | null;
  passingStatus: string;
  probabilityOfDefaultBps?: string | null;
  ratingGrade: string;
  reportStatus: string;
  reportType: string;
  riskCategory: string;
  score: string;
  scoreBand: string;
  createdAt?: number;
  updatedAt?: number | null;
}

export interface LendRiskScoresMonitoring {
  id?: string;
  riskOverviewId: string;
  lendId?: string | null;
  lendUserId?: string | null;
  asOfDate: number;
  confidenceLevelBps?: string | null;
  coverage?: string | null;
  exposureAtDefaultAmountCents?: number | null;
  generatedAt: number;
  isFrozen: boolean;
  isOverriden: boolean;
  isPrimaryScore: boolean;
  overrideReason?: string | null;
  overridenByUserId?: string | null;
  lossGivenDefaultBps?: string | null;
  lossRateBps?: string | null;
  modelName: string;
  modelVersion: string;
  passingStatus: string;
  peril?: string | null;
  probabilityOfDefaultBps?: string | null;
  ratingGrade: string;
  rawData?: Record<string, unknown> | null;
  rawScore: string;
  riskMeasureType: string;
  riskSubCategory?: string | null;
  scaleMax?: string | null;
  scaleMin?: string | null;
  score: string;
  scoreBand: string;
  sourceSystem: string;
  scoreType: string;
  timeHorizonYears?: number | null;
  timeHorizonLabels: string;
  createdAt?: number;
  updatedAt?: number | null;
}

export interface LendStatement {
  id?: string;
  lendId: string;
  dueDate?: number | null;
  emittedDate: number;
  lastUpdateByUserId?: string | null;
  feesAmoutDueCents: number;
  feesAmountDetails: Record<string, number>;
  interestAmountDueCents: number;
  isBill: boolean;
  otherAmountDueCents: number;
  otherAmountDetails: Record<string, unknown>;
  pastAmountDueCents: number;
  principalAmountDueCents: number;
  statementDocumentId?: string | null;
  statementStatus: string;
  upcomingLumpsumPaymentCents: number;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface LendUser {
  id?: string;
  lendId: string;
  userId: string;
  role: string;
  representativesIds: string[];
  shareBps: string;
  shouldReceiveAnnualStatement: boolean;
  userType: string;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}
