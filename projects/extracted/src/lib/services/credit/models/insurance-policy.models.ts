export interface InsurancePolicy {
  id?: string;
  documentId?: string | null;
  policyNumber: string;
  insuranceData: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number | null;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}
