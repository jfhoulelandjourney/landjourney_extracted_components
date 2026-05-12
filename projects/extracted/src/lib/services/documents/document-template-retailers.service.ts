import { inject, Injectable } from '@angular/core';
import type {
  TemplateRetailerAssignment,
  TemplateRetailerAssignmentQueryResult,
  TemplateType,
} from '../../models/retailersModel';
import { ApiService, ServiceConfiguration } from '../api/api.service';

export type DocumentTemplateType = Exclude<TemplateType, 'REQUEST_TEMPLATES'>;

@Injectable({
  providedIn: 'root',
})
export class DocumentTemplateRetailersService {
  private apiService = inject(ApiService);
  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  getTemplateRetailers(templateId: string, type: TemplateType) {
    return this.apiService.get<
      TemplateRetailerAssignment[] | TemplateRetailerAssignmentQueryResult
    >(this.serviceConfiguration, `/templates/${templateId}/retailers/${type}`);
  }

  getRetailerAssignments(retailerId: string, type: DocumentTemplateType) {
    return this.apiService.get<
      TemplateRetailerAssignment[] | TemplateRetailerAssignmentQueryResult
    >(this.serviceConfiguration, `/templates/retailers/${retailerId}/${type}`);
  }

  assignRetailerToTemplate(
    templateId: string,
    retailerId: string,
    type: TemplateType
  ) {
    return this.apiService.put(
      this.serviceConfiguration,
      `/templates/${templateId}/retailers/${retailerId}/types/${type}`,
      {}
    );
  }

  unassignRetailerFromTemplate(
    templateId: string,
    retailerId: string,
    type: TemplateType
  ) {
    return this.apiService.delete(
      this.serviceConfiguration,
      `/templates/${templateId}/retailers/${retailerId}/types/${type}`
    );
  }
}
