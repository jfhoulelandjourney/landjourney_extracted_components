import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPathWithOptionalQuery } from '../../api/api.models';
import {
  ApiMessage,
  ApiService,
  type ServiceConfiguration,
} from '../../api/api.service';
import type { InsurancePolicy } from '../credit.models';

type InsurancePolicyCreateBody = Omit<
  InsurancePolicy,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;

@Injectable({
  providedIn: 'root',
})
export class CreditInsurancePolicyService {
  private readonly apiService = inject(ApiService);
  private readonly creditApi: ServiceConfiguration;

  constructor() {
    this.creditApi = this.apiService.getEnvironmentConfiguration().APIs.Credit;
  }

  createInsurancePolicy(body: InsurancePolicyCreateBody): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, '/insurance-policies', body);
  }

  getInsurancePolicyById(insurancePolicyId: string): Observable<InsurancePolicy> {
    return this.apiService.get<InsurancePolicy>(
      this.creditApi,
      `/insurance-policies/${insurancePolicyId}`
    );
  }

  updateInsurancePolicyById(
    insurancePolicyId: string,
    body: InsurancePolicyCreateBody
  ): Observable<InsurancePolicy> {
    return this.apiService.put<InsurancePolicy>(
      this.creditApi,
      `/insurance-policies/${insurancePolicyId}`,
      body
    );
  }

  patchInsurancePolicyById(
    insurancePolicyId: string,
    body: Partial<InsurancePolicy>
  ): Observable<InsurancePolicy> {
    return this.apiService.patch<InsurancePolicy>(
      this.creditApi,
      `/insurance-policies/${insurancePolicyId}`,
      body
    );
  }

  deleteInsurancePolicyById(
    insurancePolicyId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/insurance-policies/${insurancePolicyId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableInsurancePolicyById(insurancePolicyId: string): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/insurance-policies/${insurancePolicyId}/disable`,
      {}
    );
  }
}
