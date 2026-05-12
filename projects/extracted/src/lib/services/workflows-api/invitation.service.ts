import { Injectable, inject } from '@angular/core';

import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import {
  AcceptInvitationSchema,
  ExistingRequestUserInvitationSchema,
  InvitationEnvelope,
  InvitationInformationSchema,
  InvitationSchema,
} from './invitation.models';

@Injectable({
  providedIn: 'root',
})
export class InvitationService {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Workflows;
  }

  public getAllRequestInvitations(requestId: string) {
    return this.apiService.get<ExistingRequestUserInvitationSchema[]>(
      this.serviceConfiguration,
      `/requests/${requestId}/invitations`,
      null,
      true
    );
  }

  public createRequestInvitation(invitation: InvitationSchema) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${invitation.requestId}/invitations`,
      { invitation } satisfies InvitationEnvelope
    );
  }

  public getInvitationInformation(code: string) {
    return this.apiService.get<InvitationInformationSchema>(
      this.serviceConfiguration,
      `/requests/invitations/${code}`
    );
  }

  public acceptRequestInvitation(acceptation: AcceptInvitationSchema) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/invitations/${acceptation.code}/accept`,
      {args: acceptation}
    );
  }

  public deleteRequestInvitation(requestId: string, invitationId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/invitations/${invitationId}`
    );
  }
}
