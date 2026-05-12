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
import type { Servicer, ServicerSearchParams } from '../credit.models';

type ServicerCreateBody = Omit<
  Servicer,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;

@Injectable({
  providedIn: 'root',
})
export class CreditServicerService {
  private readonly apiService = inject(ApiService);
  private readonly creditApi: ServiceConfiguration;

  constructor() {
    this.creditApi = this.apiService.getEnvironmentConfiguration().APIs.Credit;
  }

  createServicer(body: ServicerCreateBody): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, '/servicers', body);
  }

  searchServicers(
    search: ServicerSearchParams,
    options?: PaginatedApiQueryOptions | null
  ): Observable<PaginatedResponse<Servicer>> {
    return this.apiService.post<PaginatedResponse<Servicer>>(
      this.creditApi,
      buildApiPathWithPagination('/servicers/search', options),
      search
    );
  }

  getServicerById(servicerId: string): Observable<Servicer> {
    return this.apiService.get<Servicer>(
      this.creditApi,
      `/servicers/${servicerId}`
    );
  }

  updateServicerById(
    servicerId: string,
    body: ServicerCreateBody
  ): Observable<Servicer> {
    return this.apiService.put<Servicer>(
      this.creditApi,
      `/servicers/${servicerId}`,
      body
    );
  }

  patchServicerById(servicerId: string, body: Partial<Servicer>): Observable<Servicer> {
    return this.apiService.patch<Servicer>(
      this.creditApi,
      `/servicers/${servicerId}`,
      body
    );
  }

  deleteServicerById(
    servicerId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(`/servicers/${servicerId}`, {
      delete_reason: deleteReason,
    });
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  setServicerDisabledById(
    servicerId: string,
    disabled: boolean
  ): Observable<ApiMessage> {
    return this.apiService.patch<ApiMessage>(
      this.creditApi,
      `/servicers/${servicerId}/disable`,
      { disabled }
    );
  }
}
