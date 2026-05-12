import { Injectable, inject } from '@angular/core';
import type { AsyncTask } from '../../models/asyncTask';
import type {
  CreateDataExtractionTemplateInput,
  DataExtractedList,
  DataExtractionTemplate,
  UpdateDataExtractionTemplateInput,
} from '../../models/documents/DataExtractionModel';
import {
  ApiService,
  type ApiMessage,
  type ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class DataExtractionTemplateService {
  private apiService = inject(ApiService);

  private readonly serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  public getDataExtractionTemplates() {
    return this.apiService.get<DataExtractionTemplate[]>(
      this.serviceConfiguration,
      '/data-extraction-templates'
    );
  }

  public getDataExtractionTemplate(templateId: string) {
    return this.apiService.get<DataExtractionTemplate>(
      this.serviceConfiguration,
      `/data-extraction-templates/${templateId}`
    );
  }

  public createDataExtractionTemplate(
    templateInput: CreateDataExtractionTemplateInput
  ) {
    return this.apiService.post<DataExtractionTemplate>(
      this.serviceConfiguration,
      '/data-extraction-templates',
      templateInput
    );
  }

  public updateDataExtractionTemplate(
    templateId: string,
    templateInput: UpdateDataExtractionTemplateInput
  ) {
    return this.apiService.put<DataExtractionTemplate>(
      this.serviceConfiguration,
      `/data-extraction-templates/${templateId}`,
      templateInput
    );
  }

  public deleteDataExtractionTemplate(templateId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/data-extraction-templates/${templateId}`
    );
  }

  public createDataExtractionTemplateVerificationTask(
    templateId: string,
    documentsIds: string[]
  ) {
    return this.apiService.post<AsyncTask>(
      this.serviceConfiguration,
      `/data-extraction-templates/${templateId}/data-extraction-tasks`,
      documentsIds
    );
  }

  public getDataExtractionTemplateVerificationTask(
    templateId: string,
    taskId: string
  ) {
    return this.apiService.get<DataExtractedList>(
      this.serviceConfiguration,
      `/data-extraction-templates/${templateId}/data-extraction-tasks/${taskId}`
    );
  }
}
