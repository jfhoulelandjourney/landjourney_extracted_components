import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiService,
  ServiceConfiguration,
  ApiMessage,
} from '../api/api.service';
import { ApiKey, CreatedApiKey } from './api-keys.models';

@Injectable({
  providedIn: 'root',
})
export class APIKeyService {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.IAM;
  }

  getAllApiKeys(): Observable<ApiKey[]> {
    return this.apiService.get(this.serviceConfiguration, '/api-keys');
  }

  createApiKey(name: string): Observable<CreatedApiKey> {
    return this.apiService.post(this.serviceConfiguration, '/api-keys', {
      name: name,
    });
  }

  deleteApiKey(id: string): Observable<ApiMessage> {
    return this.apiService.delete(this.serviceConfiguration, `/api-keys/${id}`);
  }
}
