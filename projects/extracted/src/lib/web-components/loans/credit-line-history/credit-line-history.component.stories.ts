import type { Meta, StoryObj } from '@storybook/angular';
import type { YearCreditLineHistoryOverviewSchema } from '../../../services/lending/models/credit-lines.models';
import { CreditLineHistoryComponent } from './credit-line-history.component';

const yearHistory = (
  year: number,
  overrides: Partial<YearCreditLineHistoryOverviewSchema> = {},
): YearCreditLineHistoryOverviewSchema =>
  ({
    creditLineId: 'cl-1',
    year,
    recordDate: new Date(year, 11, 31).getTime() / 1000,
    accruedInterestCentsYtd: 750_000,
    interestPaidCentsYtd: 700_000,
    ...overrides,
  }) as unknown as YearCreditLineHistoryOverviewSchema;

const meta: Meta<CreditLineHistoryComponent> = {
  title: 'Web Components / Loans / Credit Line History',
  component: CreditLineHistoryComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<CreditLineHistoryComponent>;

export const ThreeYears: Story = {
  args: {
    histories: [
      yearHistory(2026, { accruedInterestCentsYtd: 1_250_000, interestPaidCentsYtd: 1_180_000 }),
      yearHistory(2025, { accruedInterestCentsYtd: 850_000, interestPaidCentsYtd: 825_000 }),
      yearHistory(2024, { accruedInterestCentsYtd: 540_000, interestPaidCentsYtd: 530_000 }),
    ],
  },
};

export const SingleYear: Story = {
  args: {
    histories: [yearHistory(2026)],
  },
};

export const Empty: Story = {
  args: { histories: [] },
};
