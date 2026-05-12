import type { Meta, StoryObj } from '@storybook/angular';
import type { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';
import { CreditLineHeaderComponent } from './credit-line-header.component';

const day = 24 * 60 * 60 * 1000;

const baseLine = (
  partial: Partial<DetailedCreditLineCompoundSchema> & {
    id: string;
    name: string;
  },
): DetailedCreditLineCompoundSchema =>
  ({
    accountNumber: 'ML-2026-001234',
    accountType: 'RLOC',
    accountStatus: 'ACTIVE',
    creditLimitCents: 100_000_000,
    usageCents: 35_000_000,
    interestRatePerc: 7.25,
    nextPaymentDueDate: Date.now() + 14 * day,
    nextPaymentCents: 250_000,
    originationDate: Date.now() - 365 * day,
    maturityDate: Date.now() + 365 * 2 * day,
    inHouse: true,
    userCanShare: true,
    userIsCollaborator: false,
    lenderOrganizationId: 'org-1',
    interestRateAttributes: [],
    sublines: [],
    fundingEntities: [],
    ...partial,
  }) as unknown as DetailedCreditLineCompoundSchema;

const meta: Meta<CreditLineHeaderComponent> = {
  title: 'Web Components / Loans / Credit Line Header',
  component: CreditLineHeaderComponent,
  tags: ['autodocs'],
  argTypes: {
    mobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<CreditLineHeaderComponent>;

export const Revolving: Story = {
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
      usageCents: 47_500_000,
    }),
  },
};

export const WithSublines: Story = {
  args: {
    creditLine: baseLine({
      id: 'cl-3',
      name: 'Master lending line',
      creditLimitCents: 500_000_000,
      sublines: [
        { id: 'sub-1', name: 'Equipment subline', usageCents: 75_000_000 },
        { id: 'sub-2', name: 'Operating subline', usageCents: 32_000_000 },
        {
          id: 'sub-3',
          name: 'Real estate subline',
          usageCents: 110_000_000,
        },
      ] as unknown as DetailedCreditLineCompoundSchema['sublines'],
    }) as unknown as DetailedCreditLineCompoundSchema,
  },
};

export const Mobile: Story = {
  args: {
    creditLine: baseLine({
      id: 'cl-1',
      name: 'Operating revolving line of credit',
    }),
    mobile: true,
  },
};
