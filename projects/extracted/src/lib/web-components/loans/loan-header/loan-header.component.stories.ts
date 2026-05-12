import type { Meta, StoryObj } from '@storybook/angular';
import type { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { LoanHeaderComponent } from './loan-header.component';

const day = 24 * 60 * 60 * 1000;

const baseLoan = (
  partial: Partial<DetailedLoanCompoundSchema> & { id: string; name: string },
): DetailedLoanCompoundSchema =>
  ({
    accountNumber: '4321-5678',
    accountType: 'INSTALLMENT',
    accountStatus: 'ACTIVE',
    outstandingBalanceCents: 25_000_000,
    principalBalanceCents: 23_500_000,
    interestRatePerc: 6.25,
    currentCommitmentCents: 25_000_000,
    originalPrincipalCents: 25_000_000,
    nextPaymentDueDate: Date.now() + 14 * day,
    nextPaymentDate: Date.now() + 14 * day,
    nextPaymentCents: 250_000,
    originationDate: Date.now() - 365 * day,
    maturityDate: Date.now() + 365 * 4 * day,
    projectedEndDate: Date.now() + 365 * 4 * day,
    isNSF: false,
    inHouse: true,
    userCanShare: true,
    userIsCollaborator: false,
    paymentFrequency: 'MONTHLY',
    rateAdjustmentFrequency: 'NEVER',
    graceUnit: 'DAYS',
    graceValue: 5,
    interestRateAttributes: [],
    lateFeePerc: 5,
    lenderOrganizationId: 'org-1',
    principalBalanceHistory: {},
    users: [],
    collaterals: [],
    fundingEntities: [],
    ...partial,
  }) as unknown as DetailedLoanCompoundSchema;

const meta: Meta<LoanHeaderComponent> = {
  title: 'Web Components / Loans / Loan Header',
  component: LoanHeaderComponent,
  tags: ['autodocs'],
  argTypes: {
    mobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LoanHeaderComponent>;

export const Standard: Story = {
  args: {
    loan: baseLoan({ id: 'loan-1', name: 'Operating Loan #1042' }),
  },
};

export const Overdue: Story = {
  args: {
    loan: baseLoan({
      id: 'loan-2',
      name: 'Equipment Loan #882',
      nextPaymentDueDate: Date.now() - 9 * day,
    }),
  },
};

export const LargeLoan: Story = {
  args: {
    loan: baseLoan({
      id: 'loan-3',
      name: 'Land Loan #2204',
      principalBalanceCents: 1_250_000_000,
      currentCommitmentCents: 1_500_000_000,
      originalPrincipalCents: 1_500_000_000,
      interestRatePerc: 5.875,
    }),
  },
};

export const Mobile: Story = {
  args: {
    loan: baseLoan({ id: 'loan-1', name: 'Operating Loan #1042' }),
    mobile: true,
  },
};
