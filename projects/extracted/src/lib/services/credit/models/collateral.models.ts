export interface Collateral {
  id?: string;
  data: Record<string, unknown>;
  name: string;
  type: string;
  valueCents: number;
  valueSource?: string | null;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export interface CollateralSearchParams {
  id?: string[] | null;
  name?: string[] | null;
  type?: string[] | null;
  valueCents?: number[] | null;
  valueCentsRange?: readonly [number, number] | null;
  valueSource?: string[] | null;
  disabled?: boolean | null;
}

export interface CollateralUser {
  id?: string;
  collateralId: string;
  userId: string;
  shareBps: string;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}
