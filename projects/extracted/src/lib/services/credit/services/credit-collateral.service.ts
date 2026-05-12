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
import type { Collateral, CollateralSearchParams, CollateralUser } from '../credit.models';

type CollateralCreateBody = Omit<
  Collateral,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type CollateralUserCreateBody = Omit<
  CollateralUser,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;

@Injectable({
  providedIn: 'root',
})
export class CreditCollateralService {
  private readonly apiService = inject(ApiService);
  private readonly creditApi: ServiceConfiguration;

  constructor() {
    this.creditApi = this.apiService.getEnvironmentConfiguration().APIs.Credit;
  }

  createCollateral(body: CollateralCreateBody): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, '/collaterals', body);
  }

  searchCollaterals(
    search: CollateralSearchParams,
    options?: PaginatedApiQueryOptions | null
  ): Observable<PaginatedResponse<Collateral>> {
    return this.apiService.post<PaginatedResponse<Collateral>>(
      this.creditApi,
      buildApiPathWithPagination('/collaterals/search', options),
      search
    );
  }

  getCollateralById(collateralId: string): Observable<Collateral> {
    return this.apiService.get<Collateral>(
      this.creditApi,
      `/collaterals/${collateralId}`
    );
  }

  updateCollateralById(
    collateralId: string,
    body: CollateralCreateBody
  ): Observable<Collateral> {
    return this.apiService.put<Collateral>(
      this.creditApi,
      `/collaterals/${collateralId}`,
      body
    );
  }

  patchCollateralById(
    collateralId: string,
    body: Partial<Collateral>
  ): Observable<Collateral> {
    return this.apiService.patch<Collateral>(
      this.creditApi,
      `/collaterals/${collateralId}`,
      body
    );
  }

  deleteCollateralById(
    collateralId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(`/collaterals/${collateralId}`, {
      delete_reason: deleteReason,
    });
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableCollateralById(collateralId: string): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/collaterals/${collateralId}/disable`,
      {}
    );
  }

  createCollateralUser(
    collateralId: string,
    body: CollateralUserCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/collaterals/${collateralId}/users`,
      body
    );
  }

  getCollateralUserById(
    collateralId: string,
    userId: string
  ): Observable<CollateralUser> {
    return this.apiService.get<CollateralUser>(
      this.creditApi,
      `/collaterals/${collateralId}/users/${userId}`
    );
  }

  updateCollateralUserById(
    collateralId: string,
    userId: string,
    body: CollateralUserCreateBody
  ): Observable<CollateralUser> {
    return this.apiService.put<CollateralUser>(
      this.creditApi,
      `/collaterals/${collateralId}/users/${userId}`,
      body
    );
  }

  patchCollateralUserById(
    collateralId: string,
    userId: string,
    body: Partial<CollateralUser>
  ): Observable<CollateralUser> {
    return this.apiService.patch<CollateralUser>(
      this.creditApi,
      `/collaterals/${collateralId}/users/${userId}`,
      body
    );
  }

  deleteCollateralUserById(
    collateralId: string,
    collateralUserId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/collaterals/${collateralId}/users/${collateralUserId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }
}
