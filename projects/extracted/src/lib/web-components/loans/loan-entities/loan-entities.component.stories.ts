import type { Meta, StoryObj } from '@storybook/angular';
import type { LoanUserBaseSchema } from '../../../services/lending/models/loans.models';
import { LoanEntitiesComponent } from './loan-entities.component';

const user = (
  partial: Partial<LoanUserBaseSchema> & {
    userId: string;
    profile: { firstName: string; lastName: string };
  },
): LoanUserBaseSchema =>
  ({
    loanId: 'loan-1',
    role: 'BORROWER',
    userType: 'INDIVIDUAL',
    shouldReceiveAnnualStatement: true,
    ...partial,
  }) as unknown as LoanUserBaseSchema;

const meta: Meta<LoanEntitiesComponent> = {
  title: 'Web Components / Loans / Loan Entities',
  component: LoanEntitiesComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<LoanEntitiesComponent>;

export const SingleBorrower: Story = {
  args: {
    entities: [
      user({
        userId: 'u1',
        role: 'BORROWER' as never,
        profile: { firstName: 'Pat', lastName: 'Smith' },
      }),
    ],
  },
};

export const MultipleEntities: Story = {
  args: {
    entities: [
      user({
        userId: 'u1',
        role: 'BORROWER' as never,
        profile: { firstName: 'Pat', lastName: 'Smith' },
      }),
      user({
        userId: 'u2',
        role: 'CO_BORROWER' as never,
        profile: { firstName: 'Casey', lastName: 'Smith' },
      }),
      user({
        userId: 'u3',
        role: 'GUARANTOR' as never,
        profile: { firstName: 'Morgan', lastName: 'Patel' },
      }),
      user({
        userId: 'u4',
        role: 'COLLABORATOR' as never,
        profile: { firstName: 'Jordan', lastName: 'Brooks' },
      }),
    ],
  },
};

export const FullChain: Story = {
  args: {
    entities: [
      user({
        userId: 'u1',
        role: 'BORROWER' as never,
        profile: { firstName: 'Pat', lastName: 'Smith' },
      }),
      user({
        userId: 'u2',
        role: 'CO_BORROWER' as never,
        profile: { firstName: 'Casey', lastName: 'Smith' },
      }),
      user({
        userId: 'u3',
        role: 'CO_BORROWER' as never,
        profile: { firstName: 'Sage', lastName: 'Romero' },
      }),
      user({
        userId: 'u4',
        role: 'GUARANTOR' as never,
        profile: { firstName: 'Morgan', lastName: 'Patel' },
      }),
      user({
        userId: 'u5',
        role: 'GUARANTOR' as never,
        profile: { firstName: 'Riley', lastName: 'Chen' },
      }),
      user({
        userId: 'u6',
        role: 'COLLABORATOR' as never,
        profile: { firstName: 'Jordan', lastName: 'Brooks' },
      }),
    ],
  },
};

export const Empty: Story = {
  args: { entities: [] },
};
