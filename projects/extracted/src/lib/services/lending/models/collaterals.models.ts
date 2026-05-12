import {
  LendingCollateralTypes as CollateralTypes,
  InsurancePoliciesCoverages,
  PropertyTaxStatuses,
} from './lending.enums';

export interface CollateralOnLoanBaseSchema {
  collateralId: string;
  loanId: string;
  sharePerc: number;
}

export interface CollateralFullOnLoanSchema extends CollateralOnLoanBaseSchema {
  name: string;
  type: CollateralTypes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export interface CollateralBaseSchema {
  id: string;
  name: string;
  type: CollateralTypes;
}

export interface LandCollateralSchema extends CollateralBaseSchema {
  collateralValueCents?: number;
  lastAppraisalDate?: number;
  acres?: number;
  taxStatus?: PropertyTaxStatuses;
  insurancePolicyCoverage?: InsurancePoliciesCoverages;
}
