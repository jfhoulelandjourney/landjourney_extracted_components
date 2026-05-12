import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, type ServiceConfiguration } from '../api/api.service';
import type { BaseInterestRate } from './models/base-interest-rate.models';

@Injectable({
  providedIn: 'root',
})
export class BaseInterestRateService {
  private readonly apiService = inject(ApiService);
  private readonly dataApi: ServiceConfiguration;

  constructor() {
    this.dataApi = this.apiService.getEnvironmentConfiguration().APIs.Data;
  }

  listBaseInterestRates(): Observable<BaseInterestRate[]> {
    return this.apiService.get<BaseInterestRate[]>(
      this.dataApi,
      '/base-indices'
    );
  }

  getBaseInterestRateById(id: string): Observable<BaseInterestRate> {
    return this.apiService.get<BaseInterestRate>(
      this.dataApi,
      `/base-indices/${id}`
    );
  }

  createBaseInterestRate(
    interestRate: BaseInterestRate
  ): Observable<BaseInterestRate> {
    return this.apiService.post<BaseInterestRate>(
      this.dataApi,
      '/base-indices',
      interestRate
    );
  }

  updateBaseInterestRate(
    interestRate: BaseInterestRate
  ): Observable<BaseInterestRate> {
    return this.apiService.put<BaseInterestRate>(
      this.dataApi,
      '/base-indices',
      interestRate
    );
  }

  deleteBaseInterestRateById(id: string): Observable<void> {
    return this.apiService.delete<void>(this.dataApi, `/base-indices/${id}`);
  }

  setBaseInterestRateDisabledById(
    id: string,
    disabled: boolean
  ): Observable<BaseInterestRate> {
    return this.apiService.patch<BaseInterestRate, { disabled: boolean }>(
      this.dataApi,
      `/base-indices/${id}/disable`,
      { disabled }
    );
  }
}
