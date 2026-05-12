import {
  CommentGroup,
  TargetEntity,
  TargetEntityType,
  UserComment,
} from '../../models/discussionModel';

export enum CommentAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ADD = 'ADD',
}

export enum CommentFilter {
  REQUEST = 'request',
  SECTION = 'section',
  TASK = 'task',
}

export interface CommentEvent {
  action: CommentAction;
  id?: string;
  componentInternalId?: string;
  sinceTimestamp?: number;
  userId: string;
  targetEntityId: string;
  targetEntityType: TargetEntityType;
  message: string;
  participants: string[];
}

export function sortComments(list: UserComment[]): CommentGroup[] {
  const sortByCreatedAt = (
    a: UserComment,
    b: UserComment,
    direction: 'desc' | 'asc'
  ) =>
    direction === 'desc'
      ? (b.createdAt ?? 0) - (a.createdAt ?? 0)
      : (a.createdAt ?? 0) - (b.createdAt ?? 0);

  const parentComments = list
    .filter(comment => !comment.metadata.threadId)
    .sort((a, b) => sortByCreatedAt(a, b, 'desc'));
  const childComments = list.filter(comment => comment.metadata.threadId);

  const finalList: CommentGroup[] = parentComments.map(parent => {
    const children = childComments
      .filter(child => child.metadata.threadId === parent.id)
      .sort((a, b) => sortByCreatedAt(a, b, 'asc'));
    return {
      parentComment: parent,
      threadComments: children,
    };
  });

  return finalList;
}

export function sortByLastActivity(list: UserComment[]): UserComment[] {
  return list.sort((a, b) => {
    const aAt = a.updatedAt ?? a.createdAt;
    const bAt = b.updatedAt ?? b.createdAt;

    return (bAt ?? 0) - (aAt ?? 0);
  });
}

export function flattenComments(list: CommentGroup[]): UserComment[] {
  return list.flatMap(group => [group.parentComment, ...group.threadComments]);
}

export function getTargetEntityId(item: TargetEntity): string {
  if ([TargetEntityType.REQUEST].includes(item.type)) {
    return item.requestId;
  } else if (item.type === TargetEntityType.SECTION) {
    return item.sectionId;
  } else {
    return item.taskId ?? item.sectionId ?? item.requestId;
  }
}
