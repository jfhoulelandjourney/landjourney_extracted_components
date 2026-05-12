import { Injectable, inject } from '@angular/core';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.IAM;
  }

  public refreshServiceKeyCache() {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/platform/service-keys/refresh`,
      {}
    );
  }

  public refreshGroupDefaults() {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/platform/defaults`,
      {}
    );
  }

  public refreshOrganizationSettingsCache(organizationKey: string) {
    return this.apiService.get<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${organizationKey}/configuration?cache=invalidate`,
      {}
    );
  }
}
