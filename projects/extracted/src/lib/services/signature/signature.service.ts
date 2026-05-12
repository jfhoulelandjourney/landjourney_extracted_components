import { Injectable, inject } from '@angular/core';

import { ApiService, ServiceConfiguration } from '../api/api.service';
import {
  PostSignatureExternalDocusignResult,
  SignatureRecipient,
} from './signature.models';

@Injectable({
  providedIn: 'root',
})
export class SignatureService {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  public postDocusignSenderView(
    fileId: string,
    digest: string,
    recipients: SignatureRecipient[]
  ) {
    return this.apiService.post<PostSignatureExternalDocusignResult>(
      this.serviceConfiguration,
      '/signatures/external/docusign',
      {
        fileId,
        digest,
        recipients,
        returnUrl: `${window.location.href}?signatureSent=true`,
      }
    );
  }
}
