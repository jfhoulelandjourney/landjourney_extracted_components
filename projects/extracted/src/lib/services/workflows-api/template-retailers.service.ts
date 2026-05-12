import { inject, Injectable } from '@angular/core';
import type { TemplateRetailerAssignment, TemplateRetailerAssignmentQueryResult } from '../../models/retailersModel';
import { ApiService, ServiceConfiguration } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class TemplateRetailersService {
  private apiService = inject(ApiService);
  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Workflows;
  }

  getTemplateRetailers(templateId: string) {
    return this.apiService.get<
      TemplateRetailerAssignment[] | TemplateRetailerAssignmentQueryResult
    >(
      this.serviceConfiguration,
      `/templates/${templateId}/retailers/REQUEST_TEMPLATES`
    );
  }

  getRetailerAssignments(retailerId: string) {
    return this.apiService.get<
      TemplateRetailerAssignment[] | TemplateRetailerAssignmentQueryResult
    >(
      this.serviceConfiguration,
      `/templates/retailers/${retailerId}/REQUEST_TEMPLATES`
    );
  }

  assignRetailerToTemplate(templateId: string, retailerId: string) {
    return this.apiService.put(
      this.serviceConfiguration,
      `/templates/${templateId}/retailers/${retailerId}/types/REQUEST_TEMPLATES`,
      {}
    );
  }

  unassignRetailerFromTemplate(templateId: string, retailerId: string) {
    return this.apiService.delete(
      this.serviceConfiguration,
      `/templates/${templateId}/retailers/${retailerId}/types/REQUEST_TEMPLATES`
    );
  }
}
