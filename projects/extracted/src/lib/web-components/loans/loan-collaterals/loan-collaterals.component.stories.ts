import type { Meta, StoryObj } from '@storybook/angular';
import type { CollateralFullOnLoanSchema } from '../../../services/lending/models/collaterals.models';
import { LendingCollateralTypes } from '../../../services/lending/models/lending.enums';
import { LoanCollateralsComponent } from './loan-collaterals.component';

const collateral = (
  partial: Partial<CollateralFullOnLoanSchema> & {
    collateralId: string;
    name: string;
    type: LendingCollateralTypes;
  },
): CollateralFullOnLoanSchema =>
  ({
    loanId: 'loan-1',
    sharePerc: 100,
    data: {},
    ...partial,
  }) as CollateralFullOnLoanSchema;

const meta: Meta<LoanCollateralsComponent> = {
  title: 'Web Components / Loans / Loan Collaterals',
  component: LoanCollateralsComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<LoanCollateralsComponent>;

export const SingleLand: Story = {
  args: {
    collaterals: [
      collateral({
        collateralId: 'c1',
        name: 'Section 14 — 240 acres, Hardin County',
        type: LendingCollateralTypes.LAND,
        data: { acres: 240, valueCents: 1_440_000_00 },
      }),
    ],
  },
};

export const MachineryAndLand: Story = {
  args: {
    collaterals: [
      collateral({
        collateralId: 'c1',
        name: 'Home farm, 320 acres',
        type: LendingCollateralTypes.LAND,
        sharePerc: 100,
        data: { acres: 320 },
      }),
      collateral({
        collateralId: 'c2',
        name: 'John Deere 8RX 410',
        type: LendingCollateralTypes.MACHINERY,
        sharePerc: 100,
      }),
      collateral({
        collateralId: 'c3',
        name: 'Case IH Magnum 340',
        type: LendingCollateralTypes.MACHINERY,
        sharePerc: 50,
      }),
    ],
  },
};

export const SharedCollateral: Story = {
  args: {
    collaterals: [
      collateral({
        collateralId: 'c1',
        name: 'River-bottom land, 480 acres (50% share)',
        type: LendingCollateralTypes.LAND,
        sharePerc: 50,
        data: { acres: 480 },
      }),
    ],
  },
};

export const Empty: Story = {
  args: { collaterals: [] },
};
