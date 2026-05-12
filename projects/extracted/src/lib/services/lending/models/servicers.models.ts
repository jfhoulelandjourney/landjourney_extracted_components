export interface ServicerBaseSchema {
  name?: string;
  organizationId?: string;
  paymentPortalUrl?: string;
  phoneNumber?: string;
}

export interface ServicerCreatedSchema {
  id: string;
}

export interface ExistingServicerSchema
  extends ServicerBaseSchema,
    ServicerCreatedSchema {
  isSynchronized?: boolean;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export function getDefaultServicer(): ServicerBaseSchema {
  return {
    name: '',
    paymentPortalUrl: '',
  };
}
