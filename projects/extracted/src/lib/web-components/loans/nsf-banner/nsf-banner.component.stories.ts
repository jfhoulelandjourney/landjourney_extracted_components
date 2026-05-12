import type { Meta, StoryObj } from '@storybook/angular';
import type { LoanOverviewSchema } from '../../../services/lending/models/loans.models';
import { NsfBannerComponent } from './nsf-banner.component';

const overdueLoan = (
  partial: Partial<LoanOverviewSchema> & { id: string; name: string }
): LoanOverviewSchema =>
  ({
    accountNumber: '0000-0000',
    accountType: 'INSTALLMENT',
    nextPaymentDueDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
    nextPaymentCents: 50000,
    outstandingBalanceCents: 5_000_000,
    principalBalanceCents: 4_500_000,
    userCanShare: false,
    userIsCollaborator: false,
    inHouse: true,
    isNSF: true,
    ...partial,
  } as unknown as LoanOverviewSchema);

const meta: Meta<NsfBannerComponent> = {
  title: 'Web Components/Feedback/NSF Banner',
  component: NsfBannerComponent,
  tags: ['autodocs'],
  argTypes: {
    isMobile: { control: 'boolean' },
    isDetailsPage: { control: 'boolean' },
    onPaymentClicked: { action: 'onPaymentClicked' },
  },
};

export default meta;
type Story = StoryObj<NsfBannerComponent>;

export const SingleLoan: Story = {
  args: {
    isMobile: false,
    isDetailsPage: false,
    nsfItems: [
      overdueLoan({
        id: 'loan-1',
        name: 'Operating Loan #1042',
        principalBalanceCents: 250_000,
      }),
    ],
  },
};

export const MultipleLoans: Story = {
  args: {
    isMobile: false,
    isDetailsPage: false,
    nsfItems: [
      overdueLoan({
        id: 'loan-1',
        name: 'Operating Loan #1042',
        principalBalanceCents: 1_250_000,
      }),
      overdueLoan({
        id: 'loan-2',
        name: 'Equipment Loan #882',
        principalBalanceCents: 87_500,
      }),
      overdueLoan({
        id: 'loan-3',
        name: 'Land Loan #2204',
        principalBalanceCents: 4_500_000,
      }),
    ],
  },
};

export const DetailsPage: Story = {
  args: {
    isDetailsPage: true,
    nsfItems: [
      overdueLoan({
        id: 'loan-1',
        name: 'Operating Loan #1042',
      }),
    ],
  },
};

export const Mobile: Story = {
  args: {
    isMobile: true,
    nsfItems: [
      overdueLoan({
        id: 'loan-1',
        name: 'Operating Loan #1042',
        principalBalanceCents: 1_250_000,
      }),
      overdueLoan({
        id: 'loan-2',
        name: 'Equipment Loan #882',
        principalBalanceCents: 87_500,
      }),
    ],
  },
};
