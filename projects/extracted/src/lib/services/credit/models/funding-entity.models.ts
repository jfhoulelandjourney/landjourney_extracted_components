export interface FundingEntity {
  id?: string;
  code: string;
  isInHouse?: boolean | null;
  name: string;
  fundingEntityOrganizationId?: string | null;
  paymentPortalUrl?: string | null;
  phoneNumber?: string | null;
  wireInstructions?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface FundingEntitySearchParams {
  id?: string[] | null;
  code?: string[] | null;
  name?: string[] | null;
  isInHouse?: boolean | null;
  fundingEntityOrganizationId?: string[] | null;
  paymentPortalUrl?: string[] | null;
  phoneNumber?: string[] | null;
  disabled?: boolean | null;
}
