import { RequestUserRoles } from '../../models/requestModels';
import {
  AttachmentTypes,
  AudiencePermissionsLevel,
  Audiences,
  Section,
  TaskTypes,
} from '../../models/sectionModels';
import { TaskOverride } from '../../models/shareLinks';
import type { ProcessedSection } from '../../web-components/requests/request-application-summary/request-application-summary.service';
import { isSectionInTodo } from './section-status';

export function getIncompleteSectionsForUser(
  allSections: Section[],
  userIds: string[],
  userRole: RequestUserRoles
): Section[] {
  const sections: Section[] = (allSections ?? []).filter(section => {
    return (
      (userIds.includes(section.assigneeId ?? 'NONE') ||
        (section.audiencesPermission[Audiences.ALL_CLIENTS] &&
          section.audiencesPermission[Audiences.ALL_CLIENTS] >=
            AudiencePermissionsLevel.EDIT &&
          [RequestUserRoles.BORROWER, RequestUserRoles.CO_BORROWER].includes(
            userRole
          ))) &&
      isSectionInTodo(section)
    );
  });

  return sections;
}

export function convertSectionsToTasksOverride(
  requestId: string,
  sections: Section[],
  currentStage: string
): TaskOverride[] {
  /* NOTE: This is used to pass information to the notification / share 
       link in order to list tasks and provide clickable urls to tasks */
  const tasksOverride: TaskOverride[] = sections
    .filter(s => !s.step || s.step === currentStage)
    .map(section => {
      const firstTask = section.tasks.at(0);

      let taskType: string | undefined = firstTask?.taskType;

      if (firstTask?.taskType === TaskTypes.DEFAULT) {
        const firstAttachment = firstTask.attachments.at(0);
        taskType = firstAttachment?.type;
      }

      return {
        type: taskType ?? TaskTypes.FILE,
        name: section.name,
        path: `/requests/${requestId}/sections/${section.id}`,
      };
    });

  return tasksOverride;
}

// We won't be able to fix the type until we fix the interface mess
export function sortSections(sections: object[]) {
  return sections.sort((a, b) => {
    return sortSectionComparator(a, b);
  });
}

export function sortProcessedSections(sections: ProcessedSection[]) {
  return sections
    .sort(section => (section.tasks && section.tasks.length > 0 ? -1 : 1))
    .sort((a, b) => sortSectionComparator(a, b))
    .sort((a, b) => sortIdentityVerificationLast(a, b))
    .sort((a, b) => sortReviewApplicationLast(a, b));
}

export function sortSectionComparator(a: object, b: object) {
  if ('ordering' in a && 'ordering' in b) {
    a.ordering = a.ordering ?? 0;
    b.ordering = b.ordering ?? 0;

    // @ts-expect-error Need to fix the types.
    if (a.ordering < b.ordering) {
      return -1;
    }

    // @ts-expect-error Need to fix the types.
    if (a.ordering > b.ordering) {
      return 1;
    }
  }

  return 0;
}

export function sortIdentityVerificationLast(a: Section, b: Section) {
  const aIsIdentity = isIdentityVerificationTask(a);
  const bIsIdentity = isIdentityVerificationTask(b);
  if (aIsIdentity && !bIsIdentity) return 1;
  if (!aIsIdentity && bIsIdentity) return -1;
  return 0;
}

export function sortSetCoapplicantsFirst(a: Section, b: Section) {
  const aIsCoapplicants = isSetCoapplicantsTask(a);
  const bIsCoapplicants = isSetCoapplicantsTask(b);
  if (aIsCoapplicants && !bIsCoapplicants) return -1;
  if (!aIsCoapplicants && bIsCoapplicants) return 1;
  return 0;
}

export function sortReviewApplicationLast(a: Section, b: Section) {
  const aIsReview = isReviewApplicationTask(a);
  const bIsReview = isReviewApplicationTask(b);
  if (aIsReview && !bIsReview) return 1;
  if (!aIsReview && bIsReview) return -1;
  return 0;
}

export function isIdentityVerificationTask(
  section: Section | undefined
): boolean {
  if (!section) {
    return false;
  }

  const verificationTask = section.tasks[0];
  if (verificationTask) {
    return verificationTask.attachments.some(
      att => att.type === AttachmentTypes.IDENTITY_VERIFICATION
    );
  }
  return false;
}

export function isCreditCheckTask(section: Section | undefined): boolean {
  if (!section) {
    return false;
  }

  const verificationTask = section.tasks[0];
  if (verificationTask) {
    return verificationTask.attachments.some(
      att => att.type === AttachmentTypes.CREDIT_CHECK
    );
  }
  return false;
}

export function isSetCoapplicantsTask(section: Section | undefined): boolean {
  if (!section) {
    return false;
  }

  return (
    section.tasks?.some(
      task => task.taskType === TaskTypes.SET_COAPPLICANTS
    ) ?? false
  );
}

export function isReviewApplicationTask(section: Section | undefined): boolean {
  if (!section) {
    return false;
  }

  const reviewTask = section.tasks.find(
    task => task.taskType === TaskTypes.REVIEW_APPLICATION
  );
  return Boolean(reviewTask);
}

export function isReviewTaskEnabled(
  section: Section | undefined,
  allSections: Section[],
  userIds: string[]
): boolean {
  if (!section || !isReviewApplicationTask(section)) {
    return false;
  }

  // Get all sections for the same assignee in the same stage (excluding the review section)
  const userSectionsInStage = allSections.filter(
    s =>
      userIds.includes(s.assigneeId ?? '') &&
      s.step === section.step &&
      s.id !== section.id &&
      !isReviewApplicationTask(s)
  );

  // Review task is enabled only if all other tasks in the stage are completed
  return userSectionsInStage.every(s => !isSectionInTodo(s));
}
