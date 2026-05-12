import { SectionStatuses, TaskStatuses } from '../models/sectionModels';

export class TagUtil {
  static getCssClassForTag(tag: string): string {
    switch (tag) {
      case 'INACTIVE':
        return 'tag red';
      default:
        return 'tag blue';
    }
  }

  static getRequestStatusColor(status: SectionStatuses) {
    if (
      [SectionStatuses.CANCELLED, SectionStatuses.INCOMPLETE].includes(status)
    ) {
      return 'gray';
    }

    if ([SectionStatuses.REJECTED].includes(status)) {
      return 'red';
    }

    if ([SectionStatuses.APPROVED].includes(status)) {
      return 'green';
    }

    return 'yellow';
  }

  static getRequirementStatusColor(status: TaskStatuses) {
    if ([TaskStatuses.INCOMPLETE].includes(status)) {
      return 'gray';
    }

    if ([TaskStatuses.REJECTED].includes(status)) {
      return 'red';
    }

    if ([TaskStatuses.APPROVED].includes(status)) {
      return 'green';
    }

    return 'yellow';
  }
}
