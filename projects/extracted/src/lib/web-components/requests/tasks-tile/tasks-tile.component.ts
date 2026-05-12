import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  OnChanges,
} from '@angular/core';
import { Request } from '../../../models/requestModels';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { getAliasesForEntity } from '../../../utils/requestUtils/entity-status';
import { isNotNil } from 'es-toolkit';
import { RequestUserRoles } from '../../../models/requestModels';
import {
  AudiencePermissionsLevel,
  SectionStatuses,
} from '../../../models/sectionModels';
import { OrganizationService } from '../../../services/organization/organization.service';

@Component({
  selector: 'lj-request-tasks-tile',
  templateUrl: './tasks-tile.component.html',
  styleUrls: ['./tasks-tile.component.scss'],
  imports: [MatIconModule, ActivateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksTileComponent implements OnChanges {
  private router = inject(Router);
  private organizationService = inject(OrganizationService);

  request = input<Request | undefined>();
  isMobile = input(false);

  allTasks = signal(0);
  completedTasks = signal(0);
  todoTasks = signal(0);

  ngOnChanges() {
    if (this.request()) {
      const currentUserId = this.organizationService.getOrganizationUserId();

      if (!currentUserId) {
        return;
      }

      const aliases = getAliasesForEntity(
        this.request()?.users ?? [],
        currentUserId ?? ''
      );

      const summaries = aliases
        .map(alias => {
          return this.request()?.userSummaries?.[alias];
        })
        .filter(isNotNil);

      this.allTasks.set(
        summaries?.reduce(
          (sum, summary) =>
            (sum +=
              summary.incomplete +
              summary.need_updates +
              summary.approved +
              summary.submitted),
          0
        )
      );

      this.todoTasks.set(
        summaries?.reduce(
          (sum, summary) => (sum += summary.incomplete + summary.need_updates),
          0
        )
      );

      this.completedTasks.set(
        summaries?.reduce(
          (sum, summary) => (sum += summary.approved + summary.submitted),
          0
        )
      );

      if (this.userIsCollaborator()) {
        this.allTasks.set(
          this.allTasks() + this.getCollaboratorTotalTasksCount(currentUserId)
        );
        this.todoTasks.set(
          this.todoTasks() + this.getCollaboratorTodoTasksCount(currentUserId)
        );
        this.completedTasks.set(
          this.completedTasks() +
            this.getCollaboratorCompletedCount(currentUserId)
        );
      }
    }
  }

  getCollaboratorTotalTasksCount(currentUserId: string): number {
    const sections = this.request()?.sections ?? [];

    return sections
      .filter(section => {
        return (
          (section.audiencesPermission[currentUserId] ??
            0 >= AudiencePermissionsLevel.EDIT) &&
          ![SectionStatuses.CANCELLED].includes(section.status)
        );
      })
      .reduce((count, section) => count + (section.tasks?.length || 0), 0);
  }

  getCollaboratorTodoTasksCount(currentUserId: string): number {
    const sections = this.request()?.sections ?? [];

    return sections
      .filter(section => {
        return (
          (section.audiencesPermission[currentUserId] ??
            0 >= AudiencePermissionsLevel.EDIT) &&
          [
            SectionStatuses.DRAFT,
            SectionStatuses.INCOMPLETE,
            SectionStatuses.IN_PROGRESS,
            SectionStatuses.REJECTED,
          ].includes(section.status)
        );
      })
      .reduce((count, section) => count + (section.tasks?.length || 0), 0);
  }

  getCollaboratorCompletedCount(currentUserId: string): number {
    const sections = this.request()?.sections ?? [];

    return sections
      .filter(section => {
        return (
          (section.audiencesPermission[currentUserId] ??
            0 >= AudiencePermissionsLevel.EDIT) &&
          [
            SectionStatuses.APPROVED,
            SectionStatuses.SUBMITTED,
            SectionStatuses.UNDER_REVIEW,
          ].includes(section.status)
        );
      })
      .reduce((count, section) => count + (section.tasks?.length || 0), 0);
  }

  userIsCollaborator(): boolean {
    const currentUserId = this.organizationService.getOrganizationUserId();

    return (
      this.request()?.users.some(user => {
        return (
          user.userId === currentUserId &&
          user.userRole === RequestUserRoles.COLLABORATOR
        );
      }) ?? false
    );
  }

  getActionText() {
    return this.todoTasks() === 0 ? 'View' : 'Take Action';
  }

  goToSections(filter?: string) {
    if (this.isMobile()) {
      this.router.navigateByUrl(
        `/tabs/requests/${this.request()?.id}/sections${filter ? `?filter=${filter}` : ''}`
      );
    } else {
      this.router.navigateByUrl(
        `/requests/${this.request()?.id}/sections${filter ? `?filter=${filter}` : ''}`
      );
    }
  }
}
