import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { ScoreCardLibrary } from '../../models/products/products.model';
import type { ApiQueryParameters, PaginatedResponse } from '../api/api.models';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ScorecardLibraryService {
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
  }): Observable<PaginatedResponse<ScoreCardLibrary>> {
    const params: ApiQueryParameters = {
      page: options.page,
      page_size: options.pageSize,
      ...(options.search ? { search: options.search } : {}),
    };
    return this.apiService.get<PaginatedResponse<ScoreCardLibrary>>(
      this.serviceConfiguration,
      '/score-cards',
      params
    );
  }

  getById(scoreCardId: string): Observable<ScoreCardLibrary> {
    return this.apiService.get<ScoreCardLibrary>(
      this.serviceConfiguration,
      `/score-cards/${scoreCardId}`
    );
  }

  create(payload: ScoreCardLibrary): Observable<ScoreCardLibrary> {
    return this.apiService.post<ScoreCardLibrary>(
      this.serviceConfiguration,
      '/score-cards',
      payload
    );
  }

  update(
    scoreCardId: string,
    payload: ScoreCardLibrary
  ): Observable<ScoreCardLibrary> {
    return this.apiService.put<ScoreCardLibrary>(
      this.serviceConfiguration,
      `/score-cards/${scoreCardId}`,
      payload
    );
  }

  delete(scoreCardId: string): Observable<ApiMessage> {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/score-cards/${scoreCardId}`
    );
  }

  clone(scoreCardId: string): Observable<ScoreCardLibrary> {
    return this.apiService.post<ScoreCardLibrary>(
      this.serviceConfiguration,
      `/score-cards/${scoreCardId}/clone`,
      {}
    );
  }
}
