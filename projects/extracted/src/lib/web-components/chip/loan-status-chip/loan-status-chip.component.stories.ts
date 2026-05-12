import type { Meta, StoryObj } from '@storybook/angular';
import { LendingAccountStatuses } from '../../../services/lending/models/lending.enums';
import { LoanStatusChipComponent } from './loan-status-chip.component';

const meta: Meta<LoanStatusChipComponent> = {
  title: 'Web Components/Display/Loan Status Chip',
  component: LoanStatusChipComponent,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(LendingAccountStatuses),
    },
  },
};

export default meta;
type Story = StoryObj<LoanStatusChipComponent>;

export const Active: Story = {
  args: { status: LendingAccountStatuses.ACTIVE },
};

export const Approved: Story = {
  args: { status: LendingAccountStatuses.APPROVED },
};

export const Pending: Story = {
  args: { status: LendingAccountStatuses.PENDING },
};

export const Delinquent: Story = {
  args: { status: LendingAccountStatuses.DELINQUENT },
};

export const Rejected: Story = {
  args: { status: LendingAccountStatuses.REJECTED },
};

export const AllStatuses: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <lj-loan-status-chip status="ACTIVE"></lj-loan-status-chip>
        <lj-loan-status-chip status="APPROVED"></lj-loan-status-chip>
        <lj-loan-status-chip status="PENDING"></lj-loan-status-chip>
        <lj-loan-status-chip status="DELINQUENT"></lj-loan-status-chip>
        <lj-loan-status-chip status="FROZEN"></lj-loan-status-chip>
        <lj-loan-status-chip status="ARCHIVED"></lj-loan-status-chip>
        <lj-loan-status-chip status="CLOSED"></lj-loan-status-chip>
        <lj-loan-status-chip status="REJECTED"></lj-loan-status-chip>
      </div>
    `,
  }),
};
