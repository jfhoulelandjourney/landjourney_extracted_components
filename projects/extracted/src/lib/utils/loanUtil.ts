import type {
  CreditLine,
  CreditLineOverviewSchema,
  DetailedCreditLineCompoundSchema,
} from '../services/lending/models/credit-lines.models';
import { UserRoles } from '../services/lending/models/lending.enums';
import {
  LoanUserBaseSchema,
  type DetailedLoanCompoundSchema,
  type Loan,
  type LoanOverviewSchema,
} from '../services/lending/models/loans.models';

export enum PaymentFrequencies {
  MONTHLY = 'MONTHLY',
  SEMI_MONTHLY = 'SEMI_MONTHLY',
  BI_WEEKLY = 'BI_WEEKLY',
  WEEKLY = 'WEEKLY',
}

export interface LoanDetails {
  effectiveRate: number;
  periodicPayment: number;
  periodicRate: number;
}

export interface AmortizationPeriod {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  startingBalance: number;
  endingBalance: number;
}

export interface VariationPeriod {
  period: number;
  variation: number;
  startingValue: number;
  endingValue: number;
}

export type AmortizationSchedule = AmortizationPeriod[];
export type VariationSchedule = VariationPeriod[];

export class LoanUtil {
  public static calculateMonthlyPayment(
    nominalRate: number,
    amount: number,
    amortizationMonths: number,
    paymentFrequency: PaymentFrequencies
  ): number {
    const effectiveRate = Math.pow(1 + nominalRate / 2, 2) - 1;
    const monthlyPeriodicRate = Math.pow(1 + effectiveRate, 1 / 12) - 1;
    const monthlyPayment =
      (monthlyPeriodicRate * amount) /
      (1 - Math.pow(1 + monthlyPeriodicRate, -amortizationMonths));

    switch (paymentFrequency) {
      case PaymentFrequencies.MONTHLY:
        return monthlyPayment;
      case PaymentFrequencies.SEMI_MONTHLY:
        return monthlyPayment / 2;
      case PaymentFrequencies.BI_WEEKLY:
        return (monthlyPayment * 12) / 26;
      case PaymentFrequencies.WEEKLY:
        return (monthlyPayment * 12) / 52;
    }

    throw new Error('Unsupported frequency');
  }

  public static calculateEffectiveRate(nominalRate: number): number {
    return Math.pow(1 + nominalRate / 2, 2) - 1;
  }

  public static calculatePeriodicRate(
    nominalRate: number,
    paymentFrequency: PaymentFrequencies
  ): number {
    const effectiveRate = LoanUtil.calculateEffectiveRate(nominalRate);
    const monthlyPeriodicRate = Math.pow(1 + effectiveRate, 1 / 12) - 1;

    switch (paymentFrequency) {
      case PaymentFrequencies.MONTHLY:
        return monthlyPeriodicRate;
      case PaymentFrequencies.SEMI_MONTHLY:
        return Math.pow(1 + effectiveRate, 1 / 24) - 1;
      case PaymentFrequencies.BI_WEEKLY:
        return Math.pow(1 + effectiveRate, 1 / 26) - 1;
      case PaymentFrequencies.WEEKLY:
        return Math.pow(1 + effectiveRate, 1 / 52) - 1;
    }
  }

  public static calculatePeriodicPayment(
    monthlyPayment: number,
    paymentFrequency: PaymentFrequencies
  ): number {
    switch (paymentFrequency) {
      case PaymentFrequencies.MONTHLY:
        return monthlyPayment;
      case PaymentFrequencies.SEMI_MONTHLY:
        return monthlyPayment / 2;
      case PaymentFrequencies.BI_WEEKLY:
        return (monthlyPayment * 12) / 26;
      case PaymentFrequencies.WEEKLY:
        return (monthlyPayment * 12) / 52;
    }
  }

  public static calculateLoanDetails(
    nominalRate: number,
    amount: number,
    amortizationMonths: number,
    paymentFrequency: PaymentFrequencies
  ): LoanDetails {
    const effectiveRate = LoanUtil.calculateEffectiveRate(nominalRate);
    const monthlyPayment = LoanUtil.calculateMonthlyPayment(
      nominalRate,
      amount,
      amortizationMonths,
      paymentFrequency
    );
    const periodicRate = LoanUtil.calculatePeriodicRate(
      nominalRate,
      paymentFrequency
    );
    const periodicPayment = LoanUtil.calculatePeriodicPayment(
      monthlyPayment,
      paymentFrequency
    );

    return {
      effectiveRate: effectiveRate,
      periodicPayment: periodicPayment,
      periodicRate: periodicRate,
    };
  }

  public static generateVariationSchedule(
    periodicRate: number,
    value: number,
    numberOfPeriods: number
  ): VariationSchedule {
    const schedule: VariationSchedule = [];

    let periodicValue = value;

    for (let period = 0; period < numberOfPeriods; period++) {
      const startingValue: number = periodicValue;
      periodicValue = periodicValue * (1 + periodicRate);

      schedule.push({
        period,
        variation: periodicValue - startingValue,
        startingValue: startingValue,
        endingValue: periodicValue,
      });
    }

    return schedule;
  }

  public static generateAmortizationSchedule(
    nominalRate: number,
    amount: number,
    amortizationMonths: number,
    paymentFrequency: PaymentFrequencies
  ): AmortizationSchedule {
    const schedule: AmortizationSchedule = [];
    const loanDetails: LoanDetails = LoanUtil.calculateLoanDetails(
      nominalRate,
      amount,
      amortizationMonths,
      paymentFrequency
    );

    let balance = amount;
    let period = 0;

    while (true) {
      const interest = balance * loanDetails.periodicRate;
      let payment = loanDetails.periodicPayment;
      let principal = payment - interest;
      const startingBalance = balance;

      balance = balance - principal;

      if (balance < 0) {
        // TODO: Validate if this is a proper way to handle the cases where the payment will exceed the balance.
        payment = payment + balance;
        principal = payment - interest;
        balance = 0;
      }

      schedule.push({
        period,
        payment,
        principal,
        interest,
        startingBalance,
        endingBalance: balance,
      });

      if (balance === 0) {
        break;
      }
      period++;
    }

    return schedule;
  }
}

export function getFormattedLoanTitle(
  loan: DetailedLoanCompoundSchema | Loan | LoanOverviewSchema | undefined
): string {
  if (!loan) {
    return '';
  }
  return ['Term Loan', loan.accountNumber, loan.name]
    .filter(s => s && s.trim() !== '')
    .join(' | ');
}

export function getFormattedCreditLineTitle(
  creditLine:
    | DetailedCreditLineCompoundSchema
    | CreditLine
    | CreditLineOverviewSchema
    | undefined,
  retailerName?: string | null
): string {
  if (!creditLine) {
    return '';
  }

  return [
    'Line of Credit',
    creditLine.accountNumber,
    retailerName || creditLine.name,
  ]
    .filter(s => s && s.trim() !== '')
    .join(' | ');
}

export function isUserBorrower(user: LoanUserBaseSchema): boolean {
  return [
    UserRoles.BORROWER,
    UserRoles.CO_BORROWER,
    UserRoles.GUARANTOR,
  ].includes(user.role);
}

export function isUserCollaborator(user: LoanUserBaseSchema): boolean {
  return [UserRoles.COLLABORATOR].includes(user.role);
}
