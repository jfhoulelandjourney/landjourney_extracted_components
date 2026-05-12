import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPathWithOptionalQuery } from '../../api/api.models';
import {
  ApiMessage,
  ApiService,
  type ServiceConfiguration,
} from '../../api/api.service';
import type { InterestRate } from '../credit.models';

type InterestRateCreateBody = Omit<
  InterestRate,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'disabled'
  | 'disabledDate'
  | 'disabledReason'
>;

@Injectable({
  providedIn: 'root',
})
export class CreditInterestRateService {
  private readonly apiService = inject(ApiService);
  private readonly creditApi: ServiceConfiguration;

  constructor() {
    this.creditApi = this.apiService.getEnvironmentConfiguration().APIs.Credit;
  }

  createInterestRate(body: InterestRateCreateBody): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, '/interest-rates', body);
  }

  getInterestRateById(interestRateId: string): Observable<InterestRate> {
    return this.apiService.get<InterestRate>(
      this.creditApi,
      `/interest-rates/${interestRateId}`
    );
  }

  updateInterestRateById(
    interestRateId: string,
    body: InterestRateCreateBody
  ): Observable<InterestRate> {
    return this.apiService.put<InterestRate>(
      this.creditApi,
      `/interest-rates/${interestRateId}`,
      body
    );
  }

  patchInterestRateById(
    interestRateId: string,
    body: Partial<InterestRate>
  ): Observable<InterestRate> {
    return this.apiService.patch<InterestRate>(
      this.creditApi,
      `/interest-rates/${interestRateId}`,
      body
    );
  }

  deleteInterestRateById(
    interestRateId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/interest-rates/${interestRateId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }
}
