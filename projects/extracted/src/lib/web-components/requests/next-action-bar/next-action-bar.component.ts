
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterModule } from '@angular/router';

import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import type { Request } from '../../../models/requestModels';
import { type Section } from '../../../models/sectionModels';
import { ClientRequestsService } from '../../../services/client/requests/client-requests.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { getAliasesForEntity } from '../../../utils/requestUtils/entity-status';
import { isSectionInTodo } from '../../../utils/requestUtils/section-status';
import {
  isIdentityVerificationTask,
  isReviewApplicationTask,
} from '../../../utils/requestUtils/sections';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-next-action-bar',
  templateUrl: './next-action-bar.component.html',
  styleUrls: ['./next-action-bar.component.scss'],
  imports: [
    NgxSkeletonLoaderModule,
    RouterModule,
    MatIconModule,
    RouterLink,
    ActivateDirective
],
})
export class NextActionBarComponent {
  private organizationService = inject(OrganizationService);
  private readonly clientRequestsService = inject(ClientRequestsService);
  private router = inject(Router);

  request = input.required<Request>();
  section = input.required<Section>();
  mobile = input(false);
  routePrefix = input('');

  aliases = computed(() =>
    getAliasesForEntity(
      this.request()?.users ?? [],
      this.organizationService.getOrganizationUserId()
    )
  );

  assignedSections = computed(() => {
    return this.getAllSections().filter(section =>
      this.isSectionAssignedToUser(section)
    );
  });

  showCompletedTasksButton = computed(() => {
    const assignedSections = this.assignedSections();

    if (assignedSections.length === 0) {
      return false;
    }

    return (
      assignedSections.length > 0 &&
      assignedSections.every(section => !isSectionInTodo(section))
    );
  });

  showNextSectionButton = computed(() => {
    const section = this.section();
    const assignedSections = this.assignedSections();

    if (assignedSections.length === 0) {
      return false;
    }

    const allCompleted = this.showCompletedTasksButton();
    if (allCompleted || !section) {
      return false;
    }

    return !isSectionInTodo(section) || !this.isSectionAssignedToUser(section);
  });

  goToNextSection(): void {
    const sections = this.getAllSections();

    const currentSectionIndex = sections.findIndex(
      section => section.id === this.section().id
    );

    if (currentSectionIndex === -1) {
      this.router.navigateByUrl(
        `${this.routePrefix()}/requests/${this.request().id}/sections`
      );
      return;
    }

    // Remove identity verification from the next sections
    const identityVerificationSection = sections.find(section =>
      isIdentityVerificationTask(section)
    );
    // and save it
    if (identityVerificationSection) {
      sections.splice(sections.indexOf(identityVerificationSection), 1);
    }

    // Remove tasks review from the next sections
    const taskReviewSection = sections.find(section =>
      isReviewApplicationTask(section)
    );
    // and save it
    if (taskReviewSection) {
      sections.splice(sections.indexOf(taskReviewSection), 1);
    }

    const nextSectionAfter = sections
      .slice(currentSectionIndex + 1)
      .find(
        section =>
          this.isSectionAssignedToUser(section) && isSectionInTodo(section)
      );

    const nextSectionBefore = sections
      .slice(0, currentSectionIndex)
      .find(
        section =>
          this.isSectionAssignedToUser(section) && isSectionInTodo(section)
      );

    const showIdentityVerificationSection =
      identityVerificationSection &&
      isSectionInTodo(identityVerificationSection);

    const nextSection =
      nextSectionAfter ??
      nextSectionBefore ??
      (showIdentityVerificationSection
        ? identityVerificationSection
        : undefined);

    if (!nextSection && taskReviewSection) {
      this.router.navigateByUrl(
        `${this.routePrefix()}/requests/${this.request().id}/sections/submission?sectionId=${taskReviewSection.id}`
      );
    } else if (nextSection) {
      const navigateToSection = () => {
        this.router.navigateByUrl(
          `${this.routePrefix()}/requests/${this.request().id}/sections/${nextSection.id}`
        );
      };

      // Add delay if navigating to identity verification section
      if (nextSection.id === identityVerificationSection?.id) {
        setTimeout(() => {
          navigateToSection();
        }, 500);
      } else {
        navigateToSection();
      }
    } else {
      this.router.navigateByUrl(
        `${this.routePrefix()}/requests/${this.request().id}/sections`
      );
    }
  }

  getRequestsListLink(): string {
    return `${this.routePrefix()}/requests/${this.request().id}`;
  }

  getAllSections(): Section[] {
    return this.clientRequestsService.getSections(this.request(), []);
  }

  isSectionAssignedToUser(section: Section): boolean {
    return this.aliases().includes(section.assigneeId ?? '');
  }
}
