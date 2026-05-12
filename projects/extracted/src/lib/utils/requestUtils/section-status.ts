import {
  Section,
  SectionStatuses,
  TaskStatuses,
} from '../../models/sectionModels';

import { computeTaskStatus } from './task-status';

export enum SectionStatusesCategories {
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  TODO = 'TODO',
}

const COMPLETED_SECTION_STATUSES = [SectionStatuses.APPROVED];
const SUBMITTED_SECTION_STATUSES = [
  SectionStatuses.SUBMITTED,
  SectionStatuses.UNDER_REVIEW,
];
const IN_PROGRESS_SECTION_STATUSES = [SectionStatuses.IN_PROGRESS];
const TODO_SECTION_STATUSES = [
  SectionStatuses.INCOMPLETE,
  SectionStatuses.REJECTED,
];
const ACTIVE_SECTION_STATUSES = [
  ...COMPLETED_SECTION_STATUSES,
  ...SUBMITTED_SECTION_STATUSES,
  ...IN_PROGRESS_SECTION_STATUSES,
  ...TODO_SECTION_STATUSES,
];

export const SECTION_STATUSES_CATEGORIES_MAPPING = {
  COMPLETED: COMPLETED_SECTION_STATUSES,
  SUBMITTED: SUBMITTED_SECTION_STATUSES,
  IN_PROGRESS: IN_PROGRESS_SECTION_STATUSES,
  TODO: TODO_SECTION_STATUSES,
};

export const SECTION_STATUSES_CATEGORIES_MAPPING_SIMPLIFIED = {
  COMPLETED: [...COMPLETED_SECTION_STATUSES, ...SUBMITTED_SECTION_STATUSES],
  TODO: [...TODO_SECTION_STATUSES, ...IN_PROGRESS_SECTION_STATUSES],
};

export function getSectionStatusCategory(
  section: Section
): SectionStatusesCategories | undefined {
  /*
    If the section is not active (cancelled, draft), return undefined. Not counted in the total anyway.
    We still need to display those in the UI though (except the draft for clients...)
  */
  if (!ACTIVE_SECTION_STATUSES.includes(section.status)) {
    return undefined;
  }

  if (COMPLETED_SECTION_STATUSES.includes(section.status)) {
    return SectionStatusesCategories.COMPLETED;
  }

  if (SUBMITTED_SECTION_STATUSES.includes(section.status)) {
    return SectionStatusesCategories.SUBMITTED;
  }

  if (IN_PROGRESS_SECTION_STATUSES.includes(section.status)) {
    return SectionStatusesCategories.IN_PROGRESS;
  }

  if (TODO_SECTION_STATUSES.includes(section.status)) {
    return SectionStatusesCategories.TODO;
  }

  return undefined;
}

/**
 * Compute the status for a section by aggregating the statuses of its actionable tasks.
 *
 * This function evaluates each task in the section (using {@link computeTaskStatus}) and
 * derives the section status from the resulting set of task statuses. By default it will
 * also update each task's `status` property with the computed value. Pass
 * `{ modifyTasks: false }` to avoid mutating the provided `section` and `tasks` objects.
 *
 * @param section - Section to evaluate
 * @param options - Optional settings
 * @param options.modifyTasks - When true (default) update each task.status with the computed value.
 *                                When false the computation is side-effect free.
 * @returns The computed {@link SectionStatuses} for the provided section.
 */
export function computeSectionStatus(
  section: Section,
  options?: { modifyTasks?: boolean }
): SectionStatuses {
  const { modifyTasks = true } = options ?? {};

  /* If it is a draft, we do not change the status */
  if (section.status === SectionStatuses.DRAFT) {
    return SectionStatuses.DRAFT;
  }

  /* Check if the section contains actionable tasks */
  const actionableTasks = section.tasks.filter(task => {
    const status = computeTaskStatus(task);
    if (modifyTasks) {
      task.status = status;
    }
    return status !== TaskStatuses.CANCELLED;
  });

  if (actionableTasks.length === 0) {
    return SectionStatuses.CANCELLED;
  }

  const task_statuses = [...new Set(actionableTasks.map(task => task.status))];

  /* CHECK IF A SECTION HAVE ALL TASKS WITH THE SAME STATUS */
  if (task_statuses.length === 1) {
    if (task_statuses[0] === TaskStatuses.APPROVED) {
      return SectionStatuses.APPROVED;
    }

    // WE JUST NEED A DEFAULT VALUE THAT IS NOT THE COMPARED VALUE, HENCE THE REJECTED
    if (
      [TaskStatuses.PROVIDED, TaskStatuses.SKIPPED].includes(
        task_statuses[0] ?? TaskStatuses.REJECTED
      )
    ) {
      return SectionStatuses.SUBMITTED;
    }

    if (task_statuses[0] === TaskStatuses.INCOMPLETE) {
      return SectionStatuses.INCOMPLETE;
    }

    if (task_statuses[0] === TaskStatuses.REJECTED) {
      return SectionStatuses.REJECTED;
    }
  }

  if (
    task_statuses.length === 2 &&
    task_statuses.includes(TaskStatuses.PROVIDED) &&
    task_statuses.includes(TaskStatuses.SKIPPED)
  ) {
    return SectionStatuses.SUBMITTED;
  }

  /* Check if the review has started and return under review if started. */
  if (
    (task_statuses.includes(TaskStatuses.APPROVED) ||
      task_statuses.includes(TaskStatuses.PROVIDED)) &&
    !task_statuses.includes(TaskStatuses.REJECTED) &&
    !task_statuses.includes(TaskStatuses.INCOMPLETE)
  ) {
    return SectionStatuses.UNDER_REVIEW;
  }

  /*
      At this point, we know that all the tasks don't all have the same status,
      that no loan officer has actually impacted any of the tasks in the section,
      and that there is more than just cancelled tasks. We can thus assume that
      the section is in progress.
  */
  return SectionStatuses.IN_PROGRESS;
}
export function isSectionCurrent(
  requestStatus: string | undefined,
  section: Section
): boolean {
  if (!requestStatus) {
    return false;
  }

  return requestStatus === section.step;
}

export function isSectionPast(
  requestStatusFlow: string[] | undefined,
  requestStatus: string | undefined,
  section: Section
): boolean {
  if (!requestStatus || !requestStatusFlow || requestStatusFlow.length === 0) {
    return false;
  }

  const currentStatusIndex = requestStatusFlow.findIndex(
    status => status === requestStatus
  );

  if (currentStatusIndex === -1) {
    return false;
  }

  const previousStatus = requestStatusFlow.filter(
    (_, index) => index < currentStatusIndex
  );

  return previousStatus.includes(section.step ?? '');
}

export function isSectionInTodo(section?: Section): boolean {
  if (!section) {
    return false;
  }

  return (
    TODO_SECTION_STATUSES.includes(section.status) ||
    IN_PROGRESS_SECTION_STATUSES.includes(section.status)
  );
}

export function isSectionEnabled(section?: Section): boolean {
  if (!section) {
    return false;
  }

  if (section.sectionConditionals.length === 0) {
    return true;
  }

  return section.sectionConditionals.every(condition => condition.isMet);
}

export function getSectionStatusColorClass(
  section: Section
): 'green' | 'yellow' | 'red' | 'grey' {
  const category = getSectionStatusCategory(section);

  if (section.status === SectionStatuses.REJECTED) {
    return 'red';
  }

  if (section.status === SectionStatuses.CANCELLED) {
    return 'grey';
  }

  switch (category) {
    case SectionStatusesCategories.TODO:
      return 'yellow';
    case SectionStatusesCategories.COMPLETED:
      return 'green';
    case SectionStatusesCategories.IN_PROGRESS:
      return 'yellow';
    case SectionStatusesCategories.SUBMITTED:
      return 'green';
  }

  return 'grey';
}
