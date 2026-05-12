export interface InterestRate {
  id?: string;
  lendId: string;
  tenantRetailerId?: string | null;
  ceilRateBps?: string | null;
  comments?: string | null;
  endingOn?: number | null;
  fixedRateBps?: string | null;
  floorRateBps?: string | null;
  isCompound: boolean;
  isEndingOnAbsolute: boolean;
  isPromotional: boolean;
  rateType: string;
  sequenceNumber: number;
  startingOn?: number | null;
  variableIndexRateCode?: string | null;
  variableMarginBps?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}
