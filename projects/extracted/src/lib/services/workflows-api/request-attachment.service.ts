import { Injectable, inject } from '@angular/core';

import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import {
  PatchRequestAttachmentSchema,
  RequestAttachment,
  SignRequestAttachmentSchema,
} from '../../models/requestAttachmentModels';

@Injectable({
  providedIn: 'root',
})
export class RequestAttachmentService {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Workflows;
  }

  /** Attachments */

  public getAllAttachments(requestId: string) {
    return this.apiService.get<RequestAttachment[]>(
      this.serviceConfiguration,
      `/requests/${requestId}/attachments`
    );
  }

  public getAttachment(requestId: string, attachmentId: string) {
    return this.apiService.get<RequestAttachment>(
      this.serviceConfiguration,
      `/requests/${requestId}/attachments/${attachmentId}`
    );
  }

  public createAttachment(requestId: string, attachment: RequestAttachment) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/attachments`,
      attachment
    );
  }

  public updateAttachment(
    requestId: string,
    attachmentId: string,
    attachment: PatchRequestAttachmentSchema
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/attachments/${attachmentId}`,
      attachment
    );
  }

  public deleteAttachment(requestId: string, attachmentId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/attachments/${attachmentId}`
    );
  }

  /* Signatures */

  public addSignature(
    requestId: string,
    attachmentId: string,
    signature: SignRequestAttachmentSchema
  ) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/attachments/${attachmentId}/signatures`,
      signature
    );
  }

  public deleteSignature(
    requestId: string,
    attachmentId: string,
    signatureId: string
  ) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/attachments/${attachmentId}/signatures/${signatureId}`
    );
  }
}
