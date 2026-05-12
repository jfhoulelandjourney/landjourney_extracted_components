export interface Servicer {
  id?: string;
  isInHouse: boolean;
  name?: string | null;
  organizationId?: string | null;
  paymentPortalUrl?: string | null;
  phoneNumber?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface ServicerSearchParams {
  id?: string[] | null;
  name?: string[] | null;
  isInHouse?: boolean | null;
  organizationId?: string[] | null;
  paymentPortalUrl?: string[] | null;
  phoneNumber?: string[] | null;
  disabled?: boolean | null;
}
