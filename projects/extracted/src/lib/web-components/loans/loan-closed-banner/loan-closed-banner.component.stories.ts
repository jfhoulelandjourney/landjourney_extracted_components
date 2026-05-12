import type { Meta, StoryObj } from '@storybook/angular';
import type { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { LoanClosedBannerComponent } from './loan-closed-banner.component';

const closedLoan = {
  id: 'loan-closed-1',
  name: 'Operating Loan #1042',
  accountNumber: '4321-0987',
  closedDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
} as unknown as DetailedLoanCompoundSchema;

const meta: Meta<LoanClosedBannerComponent> = {
  title: 'Web Components/Feedback/Loan Closed Banner',
  component: LoanClosedBannerComponent,
  tags: ['autodocs'],
  argTypes: {
    mobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LoanClosedBannerComponent>;

export const Desktop: Story = {
  args: { loan: closedLoan, mobile: false },
};

export const Mobile: Story = {
  args: { loan: closedLoan, mobile: true },
};
