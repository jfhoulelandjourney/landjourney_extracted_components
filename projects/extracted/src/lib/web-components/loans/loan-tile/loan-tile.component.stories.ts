import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ClientLoansService } from '../../../services/client/loans/client-loans.service';
import type { LoanOverviewSchema } from '../../../services/lending/models/loans.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { LoanTileComponent } from './loan-tile.component';

const organizationStub = {
  isFeatureFlagActivated: (flag: string) => flag === 'SHOW_NSF_STATE',
  isDemoModeActivated: () => false,
  getOrganizationUserId: () => 'user-1',
} as unknown as OrganizationService;

const clientLoansStub = {
  loadLoans: () => undefined,
  removeDelegateFromLoans: () => Promise.resolve(),
} as unknown as ClientLoansService;

const day = 24 * 60 * 60 * 1000;

const baseLoan = (
  partial: Partial<LoanOverviewSchema> & { id: string; name: string },
): LoanOverviewSchema =>
  ({
    accountNumber: '4321-5678',
    accountType: 'INSTALLMENT',
    outstandingBalanceCents: 25_000_000,
    principalBalanceCents: 23_500_000,
    nextPaymentDueDate: Date.now() + 14 * day,
    nextPaymentCents: 50_000,
    userCanShare: true,
    userIsCollaborator: false,
    inHouse: true,
    isNSF: false,
    ...partial,
  }) as unknown as LoanOverviewSchema;

const meta: Meta<LoanTileComponent> = {
  title: 'Web Components / Loans / Loan Tile',
  component: LoanTileComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: OrganizationService, useValue: organizationStub },
        { provide: ClientLoansService, useValue: clientLoansStub },
      ],
    }),
  ],
  argTypes: {
    active: { control: 'boolean' },
    isMobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LoanTileComponent>;

export const Active: Story = {
  args: {
    loan: baseLoan({ id: 'loan-1', name: 'Operating Loan #1042' }),
    active: true,
  },
};

export const PastDue: Story = {
  args: {
    loan: baseLoan({
      id: 'loan-2',
      name: 'Equipment Loan #882',
      nextPaymentDueDate: Date.now() - 12 * day,
      principalBalanceCents: 4_500_000,
    }),
    active: true,
  },
};

export const NSF: Story = {
  args: {
    loan: baseLoan({
      id: 'loan-3',
      name: 'Land Loan #2204',
      isNSF: true,
      principalBalanceCents: 125_000_000,
    }),
    active: true,
  },
};

export const Collaborator: Story = {
  args: {
    loan: baseLoan({
      id: 'loan-4',
      name: "Spouse's Operating Loan",
      userIsCollaborator: true,
      principalBalanceCents: 18_000_000,
    }),
    active: true,
  },
};

export const Inactive: Story = {
  args: {
    loan: baseLoan({
      id: 'loan-5',
      name: 'Refinance Loan (closed)',
      principalBalanceCents: 0,
    }),
    active: false,
  },
};

export const Mobile: Story = {
  args: {
    loan: baseLoan({
      id: 'loan-6',
      name: 'Operating Loan #1042',
      principalBalanceCents: 23_500_000,
    }),
    active: true,
    isMobile: true,
  },
};
