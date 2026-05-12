import { RequestType } from '../web-components/messaging/request-messaging/request-messaging.component';
import { Section } from './sectionModels';

export enum TargetEntityType {
  REQUEST = 'REQUEST',
  SECTION = 'SECTION',
  TASK = 'TASK',
  DOCUMENT = 'DOCUMENT',
  INTERNAL_TASK_DISCUSSION = 'INTERNAL_TASK_DISCUSSION',
  INTERNAL_SECTION_DISCUSSION = 'INTERNAL_SECTION_DISCUSSION',
  INTERNAL_REQUEST_DISCUSSION = 'INTERNAL_REQUEST_DISCUSSION',
}

export interface TargetEntity {
  requestId: string;
  sectionId: string;
  taskId?: string | undefined;
  type: TargetEntityType;
  digest: string | undefined;
  requestName: string;
  sectionName: string;
  taskName?: string | undefined;
  assigneeId?: string | undefined;
}

export interface UserComment {
  id?: string;
  discussionId: string;
  targetEntityId: string;
  targetEntityType: TargetEntityType;
  targetEntityDigest?: string;
  message: string;
  createdBy: string;
  name: string;
  metadata: {
    threadId?: string;
  };
  createdAt?: number;
  updatedAt?: number | null;
  deletedAt?: number | null;
  componentInternalId: string;
  avatar?: string;
  requestId: string;
  sectionId: string;
  taskId?: string;
  requestName: string;
  sectionName: string;
  taskName?: string;
  assigneeId?: string;
}

export interface Discussion {
  id?: string;
  targetEntityId: string;
  targetEntityType: TargetEntityType;
  participants: {
    users: string[];
    workgroups: string[];
  };
  closedAt?: number;
  metadata: Record<string, unknown>;
  comments: UserComment[];
  usersDigest?: string;
}

export interface CommentGroup {
  parentComment: UserComment;
  threadComments: UserComment[];
}

export const extractTargetEntitiesFromRequest = (
  request: RequestType | undefined,
  requestSections: Section[],
  selectedEntityTargetId?: string,
  selectedEntityTargetType?: TargetEntityType,
  internal = false
): TargetEntity[] => {
  const entities: TargetEntity[] = [];

  const addTaskEntities = (section: Section) => {
    section.tasks.forEach(task => {
      entities.push({
        type: TargetEntityType.TASK,
        digest: task.taskDigest ?? '',
        requestId: request?.id ?? '',
        sectionId: section.id ?? '',
        taskId: task.id ?? '',
        requestName: request?.name ?? '',
        sectionName: section.name,
        assigneeId: section.assigneeId,
        taskName: task.name,
      });
    });
  };

  const addSectionEntities = (sections: Section[]) => {
    sections.forEach(section => {
      entities.push({
        type: TargetEntityType.SECTION,
        digest: section.sectionDigest ?? '',
        requestId: request?.id ?? '',
        sectionId: section.id ?? '',
        requestName: request?.name ?? '',
        sectionName: section.name,
        assigneeId: section.assigneeId,
      });
      addTaskEntities(section);
    });
  };

  if (!selectedEntityTargetId || !selectedEntityTargetType) {
    addSectionEntities(requestSections);
  } else if ([TargetEntityType.REQUEST].includes(selectedEntityTargetType)) {
    // Handle REQUEST - add request-level entity
    entities.push({
      type: selectedEntityTargetType,
      digest: request?.requestDigest ?? '',
      requestId: request?.id ?? '',
      sectionId: '',
      requestName: request?.name ?? '',
      sectionName: '',
    });
  } else if (selectedEntityTargetType === TargetEntityType.SECTION) {
    const sections = selectedEntityTargetId
      ? requestSections.filter(section => section.id === selectedEntityTargetId)
      : requestSections;
    addSectionEntities(sections);
  } else {
    const task = requestSections
      .flatMap(section => section.tasks)
      .find(task => task.id === selectedEntityTargetId);
    if (task) {
      // @ts-expect-error sectionId is part of Task but TypeScript is not recognizing it
      const sectionId = task.sectionId;
      const parentSection = requestSections.find(
        section => section.id === sectionId
      );
      entities.push({
        type: TargetEntityType.TASK,
        digest: task.taskDigest ?? '',
        requestId: request?.id ?? '',
        sectionId: sectionId ?? '',
        taskId: task.id ?? '',
        requestName: request?.name ?? '',
        sectionName: parentSection?.name ?? '',
        assigneeId: parentSection?.assigneeId,
        taskName: task.name,
      });
    }
  }
  if (internal) {
    const internalMap = new Map<TargetEntityType, TargetEntityType>([
      [TargetEntityType.REQUEST, TargetEntityType.INTERNAL_REQUEST_DISCUSSION],
      [TargetEntityType.SECTION, TargetEntityType.INTERNAL_SECTION_DISCUSSION],
      [TargetEntityType.TASK, TargetEntityType.INTERNAL_TASK_DISCUSSION],
    ]);
    return entities.map(entity => {
      const { type } = entity;
      return {
        ...entity,
        type: internalMap.get(type) ?? type,
      };
    });
  }
  return entities;
};
