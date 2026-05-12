import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { ProductRuleLibrary } from '../../models/products/products.model';
import type { ApiQueryParameters, PaginatedResponse } from '../api/api.models';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ProductRuleLibraryService {
  private readonly apiService = inject(ApiService);
  private readonly serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Products;
  }

  list(options: {
    page: number;
    pageSize: number;
    search?: string;
  }): Observable<PaginatedResponse<ProductRuleLibrary>> {
    const params: ApiQueryParameters = {
      page: options.page,
      page_size: options.pageSize,
      ...(options.search ? { search: options.search } : {}),
    };
    return this.apiService.get<PaginatedResponse<ProductRuleLibrary>>(
      this.serviceConfiguration,
      '/product-rules',
      params
    );
  }

  getById(ruleId: string): Observable<ProductRuleLibrary> {
    return this.apiService.get<ProductRuleLibrary>(
      this.serviceConfiguration,
      `/product-rules/${ruleId}`
    );
  }

  create(payload: ProductRuleLibrary): Observable<ProductRuleLibrary> {
    return this.apiService.post<ProductRuleLibrary>(
      this.serviceConfiguration,
      '/product-rules',
      payload
    );
  }

  update(
    ruleId: string,
    payload: ProductRuleLibrary
  ): Observable<ProductRuleLibrary> {
    return this.apiService.put<ProductRuleLibrary>(
      this.serviceConfiguration,
      `/product-rules/${ruleId}`,
      payload
    );
  }

  delete(ruleId: string): Observable<ApiMessage> {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/product-rules/${ruleId}`
    );
  }

  clone(ruleId: string): Observable<ProductRuleLibrary> {
    return this.apiService.post<ProductRuleLibrary>(
      this.serviceConfiguration,
      `/product-rules/${ruleId}/clone`,
      {}
    );
  }
}
