export interface FundingEntityBaseSchema {
  name?: string;
  organizationId?: string;
  paymentPortalUrl?: string;
  phoneNumber?: string;
  code: string;
  wireInstructions: string;
}

export interface FundingEntityCreatedSchema {
  id: string;
}

export interface ExistingFundingEntitySchema
  extends FundingEntityBaseSchema,
    FundingEntityCreatedSchema {
  isSynchronized?: boolean;
}

export function getDefaultFundingEntity(): FundingEntityBaseSchema {
  return {
    name: '',
    paymentPortalUrl: '',
    code: '',
    phoneNumber: '',
    wireInstructions: '',
  };
}
