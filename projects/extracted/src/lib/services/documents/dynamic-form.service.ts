import { Injectable, inject } from '@angular/core';

import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  DynamicForm,
  MultipleDynamicFormsDownloadSchema,
} from '../../dynamic-forms/models/dynamic-forms.models';
import { removeAllValues } from '../../dynamic-forms/utilities/dynamicFormsUtil';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class DynamicFormService {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  /** Dynamic Form Templates */

  public getAllDynamicFormTemplates() {
    return this.apiService.get<DynamicForm[]>(
      this.serviceConfiguration,
      `/templates/forms`
    );
  }

  public getDynamicFormTemplate(templateId: string) {
    return this.apiService.get<DynamicForm>(
      this.serviceConfiguration,
      `/templates/forms/${templateId}`
    );
  }

  public createDynamicFormTemplate(template: DynamicForm) {
    const cleanedTemplated = removeAllValues(template);
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/templates/forms`,
      cleanedTemplated
    );
  }

  public cloneDynamicFormTemplate(
    originalFormId: string,
    template: DynamicForm,
    target: string,
    name: string
  ) {
    const cleanedTemplated = removeAllValues(template);
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/templates/forms/${originalFormId}/clone?target=${target}&name=${name}`,
      cleanedTemplated
    );
  }

  public updateDynamicFormTemplate(template: DynamicForm) {
    const cleanedTemplated = removeAllValues(template);
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/templates/forms/${template.id}`,
      cleanedTemplated
    );
  }

  public deleteDynamicFormTemplate(templateId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/templates/forms/${templateId}`
    );
  }

  /** Dynamic Form */

  public getDynamicForm(formId: string, digest: string) {
    return this.apiService.get<DynamicForm>(
      this.serviceConfiguration,
      `/forms/${formId}?digest=${digest}`
    );
  }

  public createDynamicForm(
    form: DynamicForm
  ): Observable<{ id: string; digest: string }> {
    return this.apiService.post<Pick<Required<ApiMessage>, 'id' | 'digest'>>(
      this.serviceConfiguration,
      `/forms`,
      form
    );
  }

  public updateDynamicForm(form: DynamicForm, digest: string) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/forms/${form.id}?digest=${digest}`,
      form
    );
  }

  /** Export to PDF */

  public downloadMultipleForms(
    filename: string,
    args: MultipleDynamicFormsDownloadSchema
  ): Observable<HttpResponse<Blob>> {
    return this.apiService.download(
      this.serviceConfiguration,
      `/forms/download/batch`,
      args,
      filename
    );
  }
}
