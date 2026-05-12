import type { Meta, StoryObj } from '@storybook/angular';
import type { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { LoanServicerDetailsComponent } from './loan-servicer-details.component';

const loan = (
  partial: Partial<DetailedLoanCompoundSchema>,
): DetailedLoanCompoundSchema =>
  ({
    id: 'loan-1',
    name: 'Operating Loan #1042',
    accountNumber: '4321-5678',
    inHouse: false,
    ...partial,
  }) as unknown as DetailedLoanCompoundSchema;

const meta: Meta<LoanServicerDetailsComponent> = {
  title: 'Web Components / Loans / Loan Servicer Details',
  component: LoanServicerDetailsComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<LoanServicerDetailsComponent>;

export const ExternalServicer: Story = {
  args: {
    loan: loan({
      servicerName: 'Heartland Servicing Co.',
      servicerPhoneNumber: '(515) 555-0142',
      servicerPaymentPortalUrl: 'https://pay.heartlandservicing.example/portal',
    }),
  },
};

export const InHouse: Story = {
  args: {
    loan: loan({
      inHouse: true,
    }),
  },
};

export const ServicerWithoutPortal: Story = {
  args: {
    loan: loan({
      servicerName: 'Midwest Loan Services',
      servicerPhoneNumber: '(800) 555-0199',
    }),
  },
};
