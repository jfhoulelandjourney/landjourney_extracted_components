import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ClientLoansService } from '../../../services/client/loans/client-loans.service';
import type { CreditLineOverviewSchema } from '../../../services/lending/models/credit-lines.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { CreditLineTileComponent } from './credit-line-tile.component';

const organizationStub = {
  isFeatureFlagActivated: () => false,
  isDemoModeActivated: () => false,
  getOrganizationUserId: () => 'user-1',
} as unknown as OrganizationService;

const clientLoansStub = {
  loadLoans: () => undefined,
  removeDelegateFromCreditLines: () => Promise.resolve(),
} as unknown as ClientLoansService;

const baseLine = (
  partial: Partial<CreditLineOverviewSchema> & { id: string; name: string },
): CreditLineOverviewSchema =>
  ({
    accountNumber: 'ML-2026-001234',
    accountType: 'RLOC',
    lenderOrganizationId: 'org-1',
    creditLimitCents: 100_000_000,
    usedCreditCents: 35_000_000,
    userCanShare: true,
    userIsCollaborator: false,
    inHouse: true,
    ...partial,
  }) as unknown as CreditLineOverviewSchema;

const meta: Meta<CreditLineTileComponent> = {
  title: 'Web Components / Loans / Credit Line Tile',
  component: CreditLineTileComponent,
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
    isMobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<CreditLineTileComponent>;

export const RevolvingLineModerateUsage: Story = {
  args: {
    creditLine: baseLine({
      id: 'cl-1',
      name: 'Operating revolving line of credit',
    }),
  },
};

export const NearLimit: Story = {
  args: {
    creditLine: baseLine({
      id: 'cl-2',
      name: 'Equipment financing line',
      creditLimitCents: 50_000_000,
      usedCreditCents: 47_500_000,
    }),
  },
};

export const Untapped: Story = {
  args: {
    creditLine: baseLine({
      id: 'cl-3',
      name: 'Land development line',
      creditLimitCents: 250_000_000,
      usedCreditCents: 0,
    }),
  },
};

export const Collaborator: Story = {
  args: {
    creditLine: baseLine({
      id: 'cl-4',
      name: "Spouse's operating line",
      userIsCollaborator: true,
    }),
  },
};

export const Mobile: Story = {
  args: {
    creditLine: baseLine({
      id: 'cl-5',
      name: 'Operating revolving line of credit',
      usedCreditCents: 35_000_000,
    }),
    isMobile: true,
  },
};
