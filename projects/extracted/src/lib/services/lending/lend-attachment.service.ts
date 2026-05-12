import { Injectable, inject } from '@angular/core';

import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import type {
  LendAttachment,
  LendAttachmentHistory,
  PatchLendAttachmentSchema,
  SignLendAttachmentSchema,
} from './models/lend.models';
import { LendTypes } from './models/lending.enums';

@Injectable({
  providedIn: 'root',
})
export class LendAttachmentService {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Lending;
  }

  /** Attachments */

  public getAllAttachments(lendType: LendTypes, lendId: string) {
    return this.apiService.get<LendAttachment[]>(
      this.serviceConfiguration,
      `/${this.getPathFromLendType(lendType)}/${lendId}/attachments`
    );
  }

  private getPathFromLendType(lendType: LendTypes): string {
    return lendType === LendTypes.LOAN ? 'loans' : 'credit-lines';
  }

  public getAttachment(
    lendType: LendTypes,
    lendId: string,
    attachmentId: string
  ) {
    return this.apiService.get<LendAttachment>(
      this.serviceConfiguration,
      `/${this.getPathFromLendType(lendType)}/${lendId}/attachments/${attachmentId}`
    );
  }

  public createAttachment(
    lendType: LendTypes,
    lendId: string,
    attachment: LendAttachment
  ) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/${this.getPathFromLendType(lendType)}/${lendId}/attachments`,
      attachment
    );
  }

  public updateAttachment(
    lendType: LendTypes,
    lendId: string,
    attachmentId: string,
    attachment: PatchLendAttachmentSchema
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/${this.getPathFromLendType(lendType)}/${lendId}/attachments/${attachmentId}`,
      attachment
    );
  }

  public deleteAttachment(
    lendType: LendTypes,
    lendId: string,
    attachmentId: string
  ) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/${this.getPathFromLendType(lendType)}/${lendId}/attachments/${attachmentId}`
    );
  }

  /* Signatures */

  public addSignature(
    lendType: LendTypes,
    lendId: string,
    attachmentId: string,
    signature: SignLendAttachmentSchema
  ) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/${this.getPathFromLendType(lendType)}/${lendId}/attachments/${attachmentId}/signatures`,
      signature
    );
  }

  public deleteSignature(
    lendType: LendTypes,
    lendId: string,
    attachmentId: string,
    signatureId: string
  ) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/${this.getPathFromLendType(lendType)}/${lendId}/attachments/${attachmentId}/signatures/${signatureId}`
    );
  }

  /* History */
  public addAttachmentHistory(
    event: LendAttachmentHistory,
    lendType: LendTypes,
    lendId: string,
    attachmentId: string
  ) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/${this.getPathFromLendType(lendType)}/${lendId}/attachments/${attachmentId}/history`,
      event
    );
  }
}
