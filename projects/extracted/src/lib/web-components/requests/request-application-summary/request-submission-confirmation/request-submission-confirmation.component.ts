import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { isBusiness } from '../../../../models/businessModels';
import {
  getRequestUserRolesDisplayName,
  RequestUserRoles,
  type RequestUser,
} from '../../../../models/requestModels';
import {
  SectionStatuses,
  type Section,
} from '../../../../models/sectionModels';
import type { ClientRequest } from '../../../../services/client/requests/client-requests.service';
import { getAliasesForEntity } from '../../../../utils/requestUtils/entity-status';
import { isSectionInTodo } from '../../../../utils/requestUtils/section-status';
import { LjButton2Component } from '../../../button2/button.component';

interface CollaboratorStatus {
  user: RequestUser;
  displayName: string;
  role: string;
  todoCount: number;
  doneCount: number;
  needsRevisionCount: number;
}

@Component({
  selector: 'lj-request-submission-confirmation',
  imports: [MatIcon, LjButton2Component],
  templateUrl: './request-submission-confirmation.component.html',
  styleUrl: './request-submission-confirmation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestSubmissionConfirmationComponent {
  readonly request = input.required<ClientRequest>();
  readonly currentUserId = input.required<string>();

  readonly returnToApplication = output<void>();
  readonly sendMessage = output<RequestUser>();

  hasMoreThanOneApplicant = computed(() => {
    const request = this.request();
    return (
      request?.users?.filter(
        user =>
          user.userRole === RequestUserRoles.CO_BORROWER ||
          user.userRole === RequestUserRoles.BORROWER ||
          user.userRole === RequestUserRoles.GUARANTOR
      ).length > 1
    );
  });

  readonly collaboratorStatuses = computed<CollaboratorStatus[]>(() => {
    const request = this.request();
    const currentUserId = this.currentUserId();

    if (!request?.sections || !request?.users) {
      return [];
    }

    // Get other users (excluding current user)
    const otherUsers = request.users.filter(
      (user: RequestUser) =>
        user.userId !== currentUserId &&
        user.userRole !== RequestUserRoles.LOAN_OFFICER
    );

    return otherUsers.map(user => {
      const aliases = getAliasesForEntity(
        request.users ?? [],
        user.userId ?? ''
      );

      // Get sections assigned to this user
      const userSections =
        request.sections?.filter((section: Section) =>
          aliases.includes(section.assigneeId ?? '')
        ) ?? [];

      let todoCount = 0;
      let doneCount = 0;
      let needsRevisionCount = 0;

      for (const section of userSections) {
        if (isSectionInTodo(section)) {
          todoCount++;
        } else if (section.status === SectionStatuses.APPROVED) {
          doneCount++;
        } else if (section.status === SectionStatuses.REJECTED) {
          needsRevisionCount++;
        } else if (
          section.status === SectionStatuses.SUBMITTED ||
          section.status === SectionStatuses.UNDER_REVIEW
        ) {
          doneCount++;
        }
      }

      return {
        user,
        displayName: isBusiness(user.profile)
          ? user.profile.name
          : `${user.profile?.firstName || 'Unknown'} ${user.profile?.lastName || 'User'}`,
        role: getRequestUserRolesDisplayName(
          user.userRole ?? RequestUserRoles.CO_BORROWER
        ),
        todoCount,
        doneCount,
        needsRevisionCount,
      };
    });
  });

  readonly hasUnfinishedCollaborators = computed(() => {
    const statuses = this.collaboratorStatuses();
    return statuses.some(
      collaborator =>
        collaborator.todoCount > 0 || collaborator.needsRevisionCount > 0
    );
  });

  onReturnToApplication(): void {
    this.returnToApplication.emit();
  }

  onSendMessage(user: RequestUser): void {
    this.sendMessage.emit(user);
  }
}
