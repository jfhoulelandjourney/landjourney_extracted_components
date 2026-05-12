import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncTask } from '../../models/asyncTask';
import {
  AiChatConversationMessage,
  ChecklistOutput,
  ChecklistTemplate,
  CreateDocumentChecklistTemplateInput,
  DocumentChecklistTemplate,
} from '../../models/documents/AiChatModel';
import { FileMetadata } from '../../models/documents/fileModels';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentQueryAiService {
  private apiService = inject(ApiService);
  private httpClient = inject(HttpClient);

  private readonly serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  public getConversation(documentId: string, digest: string) {
    return this.apiService.get<AiChatConversationMessage[]>(
      this.serviceConfiguration,
      `/document-ai-query/conversation/${documentId}?digest=${digest}`
    );
  }

  public queryDocument(documentId: string, digest: string, query: string) {
    return this.apiService.post<AiChatConversationMessage[]>(
      this.serviceConfiguration,
      `/document-ai-query/${documentId}?digest=${digest}`,
      { query }
    );
  }

  public generateSummary(documentId: string, digest: string) {
    return this.apiService.post<AiChatConversationMessage[]>(
      this.serviceConfiguration,
      `/document-ai-query/summary/${documentId}?digest=${digest}`,
      {}
    );
  }

  public deleteConversation(documentId: string, digest: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/document-ai-query/conversation/${documentId}?digest=${digest}`
    );
  }

  public getMergedDocumentsForTask(taskId: string, digest: string) {
    return this.apiService.get<FileMetadata[]>(
      this.serviceConfiguration,
      `/files/entity-target-id/${taskId}/entity-target-type/TASK?digest=${digest}&digest_key=WORKFLOW`
    );
  }

  public generateChecklist(
    taskDescription: string,
    attachmentDescription: string
  ): Observable<ChecklistTemplate> {
    const documentIds: string[] = [];
    return this.apiService.post<ChecklistTemplate>(
      this.serviceConfiguration,
      `/checklist-ai-generation/generate`,
      { taskDescription, attachmentDescription, documentIds }
    );
  }

  public createChecklistTemplate(input: CreateDocumentChecklistTemplateInput) {
    return this.apiService.post<DocumentChecklistTemplate>(
      this.serviceConfiguration,
      `/checklist-ai-generation/`,
      input
    );
  }

  public getDocumentChecklistTemplatesList() {
    return this.apiService.get<DocumentChecklistTemplate[]>(
      this.serviceConfiguration,
      `/checklist-ai-generation/`
    );
  }

  public getDocumentChecklistTemplate(templateId: string) {
    return this.apiService.get<DocumentChecklistTemplate>(
      this.serviceConfiguration,
      `/checklist-ai-generation/${templateId}`
    );
  }

  public deleteDocumentChecklistTemplate(id: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/checklist-ai-generation/${id}`
    );
  }

  public updateDocumentChecklistTemplate(
    id: string,
    input: CreateDocumentChecklistTemplateInput
  ) {
    return this.apiService.put<DocumentChecklistTemplate>(
      this.serviceConfiguration,
      `/checklist-ai-generation/${id}`,
      input
    );
  }

  public getChecklistByTarget(
    entityTargetId: string,
    entityTargetType: 'TASK' | 'SECTION',
    entityTargetGroupId: string
  ) {
    return this.apiService.get<ChecklistOutput>(
      this.serviceConfiguration,
      `/checklist-ai-generation/entity-target-id/${entityTargetId}/entity-target-type/${entityTargetType}`,
      { group_id: entityTargetGroupId }
    );
  }

  public confirmChecklistByTarget(
    entityTargetId: string,
    entityTargetType: 'TASK' | 'SECTION',
    entityTargetGroupId: string
  ) {
    return this.apiService.head(
      this.serviceConfiguration,
      `/checklist-ai-generation/head/entity-target-id/${entityTargetId}/entity-target-type/${entityTargetType}`,
      { group_id: entityTargetGroupId }
    );
  }

  public updateHumanVerification(
    checklistId: string,
    humanVerification: Record<string, boolean>
  ) {
    return this.apiService.patch<Record<string, boolean>>(
      this.serviceConfiguration,
      `/checklist-ai-generation/${checklistId}/human-verification`,
      humanVerification
    );
  }

  public verifyChecklist(checklistId: string, testDocumentId: string) {
    return this.apiService.post<AsyncTask>(
      this.serviceConfiguration,
      `/checklist-ai-generation/verify-checklist/${checklistId}`,
      { checklistId, testDocumentId }
    );
  }
}
