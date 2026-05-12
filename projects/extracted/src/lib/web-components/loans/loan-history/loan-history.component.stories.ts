import type { Meta, StoryObj } from '@storybook/angular';
import type { YearLoanHistoryOverviewSchema } from '../../../services/lending/models/loans.models';
import { LoanHistoryComponent } from './loan-history.component';

const yearHistory = (
  year: number,
  overrides: Partial<YearLoanHistoryOverviewSchema> = {},
): YearLoanHistoryOverviewSchema => ({
  loanId: 'loan-1',
  year,
  recordDate: new Date(year, 11, 31).getTime() / 1000,
  accruedInterestCents: 1_500_000,
  interestPaidCents: 1_400_000,
  principalPaidCents: 5_500_000,
  principalAndInterestPaidCents: 6_900_000,
  lateFeesPaidCents: 0,
  notSufficientFundsFeesPaidCents: 0,
  ...overrides,
});

const meta: Meta<LoanHistoryComponent> = {
  title: 'Web Components / Loans / Loan History',
  component: LoanHistoryComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<LoanHistoryComponent>;

export const ThreeYears: Story = {
  args: {
    histories: [
      yearHistory(2026, {
        principalPaidCents: 6_200_000,
        interestPaidCents: 1_300_000,
        principalAndInterestPaidCents: 7_500_000,
      }),
      yearHistory(2025),
      yearHistory(2024, {
        principalPaidCents: 4_800_000,
        interestPaidCents: 1_600_000,
        principalAndInterestPaidCents: 6_400_000,
        lateFeesPaidCents: 75_000,
      }),
    ],
  },
};

export const SingleYear: Story = {
  args: {
    histories: [yearHistory(2026)],
  },
};

export const WithLateAndNSFFees: Story = {
  args: {
    histories: [
      yearHistory(2026, {
        lateFeesPaidCents: 150_000,
        notSufficientFundsFeesPaidCents: 35_000,
      }),
      yearHistory(2025, {
        lateFeesPaidCents: 75_000,
      }),
    ],
  },
};

export const Empty: Story = {
  args: { histories: [] },
};
