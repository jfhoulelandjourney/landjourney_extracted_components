/**
 * The types of amounts that can be charged on a lend or any type of lend.
 */
export enum AmountTypes {
  CENTS = 'CENTS',
  PERCENTAGE = 'PERCENTAGE',
}

/**
 * The roles that a user can have in a lend application.
 */
export enum UserRoles {
  BORROWER = 'BORROWER',
  CO_BORROWER = 'CO_BORROWER',
  GUARANTOR = 'GUARANTOR',
  COLLABORATOR = 'COLLABORATOR',
  OTHER = 'OTHER',
}

/**
 * Lending-domain collateral categories (UI / lending API schemas).
 */
export enum LendingCollateralTypes {
  LAND = 'LAND',
  LIVESTOCK = 'LIVESTOCK',
  BUILDING = 'BUILDING',
  GRAIN_CROP = 'GRAIN_CROP',
  WATER_RIGHT = 'WATER_RIGHT',
  PERSONAL = 'PERSONAL',
  MACHINERY = 'MACHINERY',
}

/**
 * Represents the statuses of a credit line draw request.
 */
export enum CreditLineDrawRequestStatuses {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * This enum represents the CreditLineTypes.
 *
 * @remarks
 * - RLOC: Revolving line of credit.
 * - NLOC: Non-revolving line of credit.
 * - UNKNOWN: Unknown credit line type.
 * - NLOC_FIXED_TO_VAR_SINGLE_PAYMENT: Non-revolving line of credit with fixed to variable rate and single payment.
 * - NLOC_FIXED_TO_VAR_MULTIPLE_PAYMENTS: Non-revolving line of credit with fixed to variable rate and multiple payments.
 * - NLOC_MASTERLINE: Non-revolving line of credit masterline.
 */
export enum CreditLineTypes {
  RLOC = 'RLOC',
  NLOC = 'NLOC',
  UNKNOWN = 'UNKNOWN',
  NLOC_FIXED_TO_VAR_SINGLE_PAYMENT = 'NLOC_FIXED_TO_VAR_SINGLE_PAYMENT',
  NLOC_FIXED_TO_VAR_MULTIPLE_PAYMENTS = 'NLOC_FIXED_TO_VAR_MULTIPLE_PAYMENTS',
  NLOC_MASTERLINE = 'NLOC_MASTERLINE',
}

/**
 * The types of fee modifiers that can be applied to a fee on a lend.
 */
export enum FeeModifierTypes {
  ADD = 'ADD',
  DIVIDE = 'DIVIDE',
  MULTIPLY = 'MULTIPLY',
  SUBTRACT = 'SUBTRACT',
  LOWEST = 'LOWEST',
  HIGHEST = 'HIGHEST',
}

/**
 * This enum represents the FeeTypes.
 *
 * @remarks
 * - ORIGINATION: Fee charged for processing a new lend or credit line.
 * - LATE: Fee applied when a payment is not made by the due date.
 * - LEGAL: Fee for legal services or actions related to the lend or credit line.
 * - ANNUAL: Yearly fee for maintaining the lend or credit line account.
 * - MAINTENANCE: Recurring fee for maintaining the account, often monthly.
 * - PREPAYMENT: Fee for paying off a lend or credit line balance early.
 * - OVERDRAFT: Fee for exceeding the credit limit or overdrawing.
 * - BALANCE_TRANSFER: Fee for transferring a balance from one account to another.
 * - CASH_ADVANCE: Fee for borrowing cash from a credit line, typically from an ATM.
 * - CLOSURE: Fee for closing the lend or credit line before a specified period.
 * - DRAW: Fee charged each time a withdrawal or draw is made on a credit line.
 * - MINIMUM_INTEREST: Minimum fee for interest if it falls below a certain amount.
 * - PENALTY: General fee applied for violations, such as defaulting on payments.
 * - OTHER: Other unspecified fees.
 */
export enum FeeTypes {
  ORIGINATION = 'ORIGINATION',
  LATE = 'LATE',
  LEGAL = 'LEGAL',
  ANNUAL = 'ANNUAL',
  MAINTENANCE = 'MAINTENANCE',
  PREPAYMENT = 'PREPAYMENT',
  OVERDRAFT = 'OVERDRAFT',
  BALANCE_TRANSFER = 'BALANCE_TRANSFER',
  CASH_ADVANCE = 'CASH_ADVANCE',
  CLOSURE = 'CLOSURE',
  DRAW = 'DRAW',
  MINIMUM_INTEREST = 'MINIMUM_INTEREST',
  PENALTY = 'PENALTY',
  OTHER = 'OTHER',
}

/**
 * The frequencies at which a fee is charged on a lend.
 */
export enum Frequencies {
  BIANNUALLY = 'BIANNUALLY',
  BIWEEKLY = 'BIWEEKLY',
  DAILY = 'DAILY',
  EVERY_EIGHT_YEARS = 'EVERY_EIGHT_YEARS',
  EVERY_FIVE_YEARS = 'EVERY_FIVE_YEARS',
  EVERY_FOUR_YEARS = 'EVERY_FOUR_YEARS',
  EVERY_NINE_YEARS = 'EVERY_NINE_YEARS',
  EVERY_SEVEN_YEARS = 'EVERY_SEVEN_YEARS',
  EVERY_SIX_YEARS = 'EVERY_SIX_YEARS',
  EVERY_TEN_YEARS = 'EVERY_TEN_YEARS',
  EVERY_THREE_YEARS = 'EVERY_THREE_YEARS',
  MONTHLY = 'MONTHLY',
  ONCE = 'ONCE',
  ON_LOAN_END = 'ON_LOAN_END',
  ON_LOAN_START = 'ON_LOAN_START',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUALLY = 'SEMIANNUALLY',
  TRIANNUALLY = 'TRIANNUALLY',
  TWICE_A_MONTH = 'TWICE_A_MONTH',
  WEEKLY = 'WEEKLY',
  YEARLY = 'YEARLY',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Enum for type of interest that can be applied
 */
export enum InterestTypes {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
}

/**
 * Enum for insurance policies coverages.
 */
export enum InsurancePoliciesCoverages {
  FULL_COVERAGE = 'FULL_COVERAGE',
  PARTIAL_COVERAGE = 'PARTIAL_COVERAGE',
  NO_COVERAGE = 'NO_COVERAGE',
  OTHER = 'OTHER',
}

/**
 * The attributes of the interest that can be charged on a lend.
 */
export enum InterestAttributes {
  COMPLEX = 'COMPLEX',
  COMPOUND = 'COMPOUND',
  DAILY = 'DAILY',
  FIXED = 'FIXED',
  FLOATING = 'FLOATING',
  MIXED = 'MIXED',
  MONTHLY = 'MONTHLY',
  NEGATIVE = 'NEGATIVE',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUALLY = 'SEMIANNUALLY',
  SIMPLE = 'SIMPLE',
  VARIABLE = 'VARIABLE',
  ADJUSTABLE = 'ADJUSTABLE',
  WEEKLY = 'WEEKLY',
  YEARLY = 'YEARLY',
  ZERO = 'ZERO',
}

export enum LendTypes {
  LOAN = 'LOAN',
  CREDIT_LINE = 'CREDIT_LINE',
}

export enum LendingAccountStatuses {
  ACTIVE = 'ACTIVE',
  APPROVED = 'APPROVED',
  ARCHIVED = 'ARCHIVED',
  CLOSED = 'CLOSED',
  DELINQUENT = 'DELINQUENT',
  FROZEN = 'FROZEN',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

/**
 * The types of loans that can be issued.
 */
export enum LoanTypes {
  LAND_LOAN = 'LAND_LOAN',
  OPERATION_LOAN = 'OPERATION_LOAN',
}

/**
 * This enum represents the PaymentStatuses.
 *
 * @remarks
 * - PENDING: Payment is scheduled but not yet processed.
 * - PROCESSING: Payment is currently being processed.
 * - COMPLETED: Payment has been successfully processed.
 * - FAILED: Payment attempt failed (e.g., due to insufficient funds).
 * - DECLINED: Payment was declined by the bank or payment processor.
 * - CANCELLED: Payment was canceled before it could be processed.
 * - PARTIALLY_PAID: Partial payment was made, but the full amount is still outstanding.
 * - REFUNDED: Payment was processed but later refunded.
 * - OVERDUE: Payment is past its due date and hasn’t been made.
 * - CHARGEBACK: Payment was disputed and reversed.
 */
export enum PaymentStatuses {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED',
  OVERDUE = 'OVERDUE',
  CHARGEBACK = 'CHARGEBACK',
}

/**
 * Enum for the payment types.
 */
export enum PaymentTypes {
  REGULAR = 'REGULAR',
  LUMP_SUM = 'LUMP_SUM',
  DOUBLE = 'DOUBLE',
}

/**
 * The statuses of a property tax.
 */
export enum PropertyTaxStatuses {
  DUE = 'DUE',
  OVERDUE = 'OVERDUE',
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}

/**
 * The statuses of a lend invoice.
 */
export enum StatementStatuses {
  CANCELED = 'CANCELED',
  OVERDUE = 'OVERDUE',
  PAYED = 'PAYED',
  PENDING = 'PENDING',
  UPCOMING = 'UPCOMING',
}

/**
 * The units of time that can be used to represent a duration.
 */
export enum LendingTimeUnits {
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS',
  YEARS = 'YEARS',
}
