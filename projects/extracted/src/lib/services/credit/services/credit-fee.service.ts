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
import type { Fee, FeeSearchParams } from '../credit.models';

type FeeCreateBody = Omit<
  Fee,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;

@Injectable({
  providedIn: 'root',
})
export class CreditFeeService {
  private readonly apiService = inject(ApiService);
  private readonly creditApi: ServiceConfiguration;

  constructor() {
    this.creditApi = this.apiService.getEnvironmentConfiguration().APIs.Credit;
  }

  createFee(body: FeeCreateBody): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, '/fees', body);
  }

  searchFees(
    search: FeeSearchParams,
    options?: PaginatedApiQueryOptions | null
  ): Observable<PaginatedResponse<Fee>> {
    return this.apiService.post<PaginatedResponse<Fee>>(
      this.creditApi,
      buildApiPathWithPagination('/fees/search', options),
      search
    );
  }

  getFeeById(feeId: string): Observable<Fee> {
    return this.apiService.get<Fee>(this.creditApi, `/fees/${feeId}`);
  }

  updateFeeById(feeId: string, body: FeeCreateBody): Observable<Fee> {
    return this.apiService.put<Fee>(this.creditApi, `/fees/${feeId}`, body);
  }

  patchFeeById(feeId: string, body: Partial<Fee>): Observable<Fee> {
    return this.apiService.patch<Fee>(this.creditApi, `/fees/${feeId}`, body);
  }

  deleteFeeById(feeId: string, deleteReason?: string): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(`/fees/${feeId}`, {
      delete_reason: deleteReason,
    });
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  setFeeDisabledById(feeId: string, disabled: boolean): Observable<ApiMessage> {
    return this.apiService.patch<ApiMessage>(
      this.creditApi,
      `/fees/${feeId}/disable`,
      { disabled }
    );
  }
}
