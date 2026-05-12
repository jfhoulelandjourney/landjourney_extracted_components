import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  ApiQueryParameters,
  PaginatedApiQueryOptions,
  PaginatedResponse,
} from '../../api/api.models';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../../api/api.service';
import type {
  Field,
  FieldRegulation,
  RegulationsResult,
} from './fields.models';

@Injectable({
  providedIn: 'root',
})
export class FieldsService {
  private apiService = inject(ApiService);

  private service: ServiceConfiguration;

  constructor() {
    this.service = this.apiService.getEnvironmentConfiguration().APIs.Products;
  }

  // Fields

  public createField(field: Field) {
    return this.apiService.post<ApiMessage>(this.service, `/fields`, field);
  }

  public getFields(options: PaginatedApiQueryOptions = {}) {
    const apiQueryParamers: ApiQueryParameters = {
      ...options,
    };
    return this.apiService.get<PaginatedResponse<Field>>(
      this.service,
      `/fields`,
      apiQueryParamers
    );
  }

  public getBulkFields(fieldIds: string[]): Observable<Field[]> {
    if (fieldIds.length === 0) {
      return of([]);
    }

    return this.apiService
      .post<PaginatedResponse<Field>>(this.service, `/fields/search`, {
        ids: fieldIds,
      })
      .pipe(map(res => res.items ?? []));
  }

  public getField(fieldId: string) {
    return this.apiService.get<Field>(this.service, `/fields/${fieldId}`);
  }

  public getFieldWithVersions(fieldId: string) {
    return this.apiService.get<Field[]>(
      this.service,
      `/fields/${fieldId}/versions`
    );
  }

  public saveField(field: Field) {
    return this.apiService.put<ApiMessage>(
      this.service,
      `/fields/${field.id}`,
      field
    );
  }

  public deleteField(fieldId: string) {
    return this.apiService.delete<ApiMessage>(
      this.service,
      `/fields/${fieldId}`
    );
  }

  // Regulations
  public getFieldRegulations(): Observable<FieldRegulation[]> {
    return this.apiService
      .get<RegulationsResult>(this.service, `/fields/catalogs/regulations`)
      .pipe(
        map((result: RegulationsResult) => {
          return Object.entries(result).map(([key, value]) => ({
            name: key,
            label: value,
          }));
        })
      );
  }

  public getFieldsForRegulation(regulationName: string) {
    const options: ApiQueryParameters = {
      pageSize: 250,
      search: regulationName,
    };

    return this.apiService.get<PaginatedResponse<Field>>(
      this.service,
      `/fields`,
      options
    );
  }
}
