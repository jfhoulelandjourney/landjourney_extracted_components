import { inject, Injectable } from '@angular/core';
import { RequestUser, RequestUserRoles } from '../../models/requestModels';
import { Section } from '../../models/sectionModels';
import { PermissionUtil } from '../../utils/permissionUtil';
import { IAMService } from '../identity/iam.service';
import { OrganizationService } from '../organization/organization.service';
import { NotificationService } from './notification.service';
import { PostAdHocNotificationSchema } from './notifications.models';

export interface SendNotificationToParticipantsInput {
  message: string;
  section: Section;
  requestName: string;
  users: RequestUser[];
  taggedUserIds: string[];
  requestId?: string;
}

export interface SendNotificationToLoanOfficersInput {
  message: string;
  users: RequestUser[];
  requestName: string;
}

export interface SendNotificationPayloadInput {
  recipients: string[];
  requestName: string;
  message: string;
  currentUserFirstName: string;
  requestId?: string;
  sectionId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdHocNotificationService {
  notificationService = inject(NotificationService);
  iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);

  public sendNotificationToSectionParticipants(
    input: SendNotificationToParticipantsInput
  ) {
    const { section, message, requestName, users, requestId } = input;
    const currentUser = this.iamService.getActiveUser();
    const currentUserFirstName = currentUser?.firstName ?? '';
    const currentUserId = this.organizationService.getOrganizationUserId();
    const exclusionList = users
      .filter(
        u =>
          u.userRole === RequestUserRoles.LOAN_OFFICER ||
          u.userId === currentUserId
      )
      .map(u => u.userId ?? '');

    const recipients = PermissionUtil.getParticipantsInSection(
      section,
      users,
      exclusionList,
      input.taggedUserIds
    );

    if (recipients.length === 0) {
      return;
    }

    this.sendNotificationPayload({
      recipients,
      requestName,
      message,
      currentUserFirstName,
      requestId,
      sectionId: section.id,
    });
  }

  public sendNotificationPayload(input: SendNotificationPayloadInput) {
    const {
      recipients,
      requestName,
      message,
      currentUserFirstName,
      requestId,
      sectionId,
    } = input;
    if (recipients.length === 0) {
      return;
    }
    const payload: PostAdHocNotificationSchema = {
      workflowName: 'agent-new-comment-request',
      recipients: recipients,
      payload: {
        url: `{{CLIENT_URL}}`,
        methods: ['EMAIL'],
        sendNow: true,
        extra: {
          requestName: requestName ?? 'New message!',
          comment: message ?? 'You have a new message!',
          actor: {
            name: currentUserFirstName ?? 'A participant in the discussion',
          },
        },
      },
      overrides: {},
      requestId: requestId ?? undefined,
      sectionId: sectionId ?? undefined,
    };

    this.notificationService.sendAdHocNotification(payload).subscribe();
  }

  public sendNotificationToLoanOfficers(
    input: SendNotificationToLoanOfficersInput
  ) {
    const { message, users, requestName } = input;
    const currentUserId = this.organizationService.getOrganizationUserId();
    const recipients = users
      .filter(
        u =>
          u.userRole === RequestUserRoles.LOAN_OFFICER &&
          u.userId !== currentUserId
      )
      .map(u => u.userId ?? '');

    if (recipients.length === 0) {
      return;
    }

    const currentUserFirstName = this.iamService.getActiveUser()?.firstName;
    const payload: PostAdHocNotificationSchema = {
      workflowName: 'agent-new-comment-request',
      recipients: recipients,
      payload: {
        url: `{{BACKOFFICE_URL}}`,
        methods: ['EMAIL'],
        sendNow: true,
        extra: {
          requestName: requestName ?? 'New message!',
          comment: message ?? '',
          actor: {
            name: currentUserFirstName ?? 'A participant in the discussion',
          },
        },
      },
      overrides: {},
    };

    this.notificationService.sendAdHocNotification(payload).subscribe();
  }
}
