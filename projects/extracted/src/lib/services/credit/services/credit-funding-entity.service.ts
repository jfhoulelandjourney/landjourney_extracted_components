import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  buildApiPathWithOptionalQuery,
  buildApiPathWithPagination,
  type PaginatedApiQueryOptions,
  type PaginatedResponse,
} from '../../api/api.models';
import {
  ApiMessage,
  ApiService,
  type ServiceConfiguration,
} from '../../api/api.service';
import type {
  FundingEntity,
  FundingEntitySearchParams,
} from '../credit.models';

type FundingEntityCreateBody = Omit<
  FundingEntity,
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
export class CreditFundingEntityService {
  private readonly apiService = inject(ApiService);
  private readonly creditApi: ServiceConfiguration;

  constructor() {
    this.creditApi = this.apiService.getEnvironmentConfiguration().APIs.Credit;
  }

  createFundingEntity(
    body: FundingEntityCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, '/funding-entities', body);
  }

  searchFundingEntities(
    search: FundingEntitySearchParams,
    options?: PaginatedApiQueryOptions | null
  ): Observable<PaginatedResponse<FundingEntity>> {
    return this.apiService.post<PaginatedResponse<FundingEntity>>(
      this.creditApi,
      buildApiPathWithPagination('/funding-entities/search', options),
      search
    );
  }

  getFundingEntityById(fundingEntityId: string): Observable<FundingEntity> {
    return this.apiService.get<FundingEntity>(
      this.creditApi,
      `/funding-entities/${fundingEntityId}`
    );
  }

  updateFundingEntityById(
    fundingEntityId: string,
    body: FundingEntityCreateBody
  ): Observable<FundingEntity> {
    return this.apiService.put<FundingEntity>(
      this.creditApi,
      `/funding-entities/${fundingEntityId}`,
      body
    );
  }

  patchFundingEntityById(
    fundingEntityId: string,
    body: Partial<FundingEntity>
  ): Observable<FundingEntity> {
    return this.apiService.patch<FundingEntity>(
      this.creditApi,
      `/funding-entities/${fundingEntityId}`,
      body
    );
  }

  deleteFundingEntityById(
    fundingEntityId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/funding-entities/${fundingEntityId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  setFundingEntityDisabledById(
    fundingEntityId: string,
    disabled: boolean
  ): Observable<ApiMessage> {
    return this.apiService.patch<ApiMessage>(
      this.creditApi,
      `/funding-entities/${fundingEntityId}/disable`,
      { disabled }
    );
  }
}
