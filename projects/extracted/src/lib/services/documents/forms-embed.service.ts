import { Injectable, inject } from '@angular/core';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import {
  EmbeddedForm,
  FormEmbedding,
  SubmitEmbeddedFormInput,
} from '../../models/documents/formEmbedModels';

@Injectable({
  providedIn: 'root',
})
export class FormsEmbedService {
  private apiService = inject(ApiService);

  private documentApiServiceConfiguration: ServiceConfiguration;
  private workflowApiServiceConfiguration: ServiceConfiguration;

  constructor() {
    this.documentApiServiceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
    this.workflowApiServiceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Workflows;
  }

  getApiUrl(): string {
    return this.documentApiServiceConfiguration.getBaseServiceUrl();
  }

  // AUTHENTICATED SPACE...

  public getAllFormEmbeddings() {
    return this.apiService.get<FormEmbedding[]>(
      this.documentApiServiceConfiguration,
      `/external/forms`
    );
  }

  public getFormEmbeddings(formTemplateId: string) {
    return this.apiService.get<FormEmbedding[]>(
      this.documentApiServiceConfiguration,
      `/external/forms?templateFormId=${formTemplateId}`
    );
  }

  public getFormEmbedding(embeddingId: string) {
    return this.apiService.get<FormEmbedding>(
      this.documentApiServiceConfiguration,
      `/external/forms/${embeddingId}`
    );
  }

  public createFormEmbedding(formEmbedding: FormEmbedding) {
    return this.apiService.post<ApiMessage>(
      this.documentApiServiceConfiguration,
      `/external/forms`,
      formEmbedding
    );
  }

  public updateFormEmbedding(formEmbedding: FormEmbedding) {
    return this.apiService.put<ApiMessage>(
      this.documentApiServiceConfiguration,
      `/external/forms/${formEmbedding.id}`,
      formEmbedding
    );
  }

  public deleteFormEmbedding(formEmbeddingId: string) {
    return this.apiService.delete<ApiMessage>(
      this.documentApiServiceConfiguration,
      `/external/forms/${formEmbeddingId}`
    );
  }

  // UNAUTHENTICATED ENDPOINTS...

  public getEmbeddedForm(
    embeddingFormId: string,
    signature: string,
    tenant: string
  ) {
    return this.apiService.get<EmbeddedForm>(
      this.documentApiServiceConfiguration,
      `/external/forms/definition/${embeddingFormId}`,
      {
        signature,
        organization: tenant,
      }
    );
  }

  public submitEmbeddedForm(input: SubmitEmbeddedFormInput, tenant: string) {
    const url = `/external/forms/${input.productId}?organization=${tenant}`;
    this.apiService.organizationKey = tenant;
    return this.apiService.post<ApiMessage>(
      this.workflowApiServiceConfiguration,
      url,
      input
    );
  }
}
