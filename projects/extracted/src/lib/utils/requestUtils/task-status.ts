import {
  AttachmentTypes,
  Attachment,
  Task,
  TaskStatuses,
} from '../../models/sectionModels';

export const COMPLETED_TASK_STATUSES = [TaskStatuses.APPROVED];
export const PROVIDED_TASK_STATUSES = [
  TaskStatuses.PROVIDED,
  TaskStatuses.SKIPPED,
];
export const TODO_TASK_STATUSES = [
  TaskStatuses.INCOMPLETE,
  TaskStatuses.REJECTED,
];
export const ACTIVE_TASK_STATUSES = [
  ...COMPLETED_TASK_STATUSES,
  ...PROVIDED_TASK_STATUSES,
  ...TODO_TASK_STATUSES,
];

export function getUserActionableAttachments(task: Task): Attachment[] {
  const attachments = task.attachments.filter(attachment => {
    return (
      attachment.type !== AttachmentTypes.REFERENCE_DOCUMENT &&
      attachment.status !== TaskStatuses.CANCELLED
    );
  });

  return attachments;
}

export function computeTaskStatus(task: Task): TaskStatuses {
  /* Check if the tasks contains actionable attachments */
  const attachments = getUserActionableAttachments(task);

  if (attachments.length === 0) {
    return TaskStatuses.CANCELLED;
  }

  const attachment_statuses = [
    ...new Set(
      task.attachments
        .filter(
          attachment => attachment.type !== AttachmentTypes.REFERENCE_DOCUMENT
        )
        .map(attachment => attachment.status)
    ),
  ];

  /* CHECK IF A TASK HAVE ALL ATTACHMENT WITH THE SAME STATUS */
  if (attachment_statuses.length === 1) {
    // @ts-expect-error Last line not detected
    return attachment_statuses[0];
  }

  /* CHECK IF A TASK HAS ANY REJECTED ATTACHMENT -> TASK INCOMPLETE */
  if (attachment_statuses.includes(TaskStatuses.REJECTED)) {
    return TaskStatuses.INCOMPLETE;
  }

  /* CHECK IF A TASK HAVE ALL ATTACHMENTS EITHER APPROVED, PROVIDED, SKIPPED OR CANCELLED -> TASK PROVIDED */
  const approved = attachment_statuses.filter(
    status => status === TaskStatuses.APPROVED
  ).length;
  const skipped = attachment_statuses.filter(
    status => status === TaskStatuses.SKIPPED
  ).length;
  const submitted = attachment_statuses.filter(
    status => status === TaskStatuses.PROVIDED
  ).length;
  const cancelled = attachment_statuses.filter(
    status => status === TaskStatuses.CANCELLED
  ).length;

  if (
    approved + skipped + submitted + cancelled ===
    attachment_statuses.length
  ) {
    return TaskStatuses.PROVIDED;
  }
  /*
       At this point, we know that all the attachments don't all have the same status, 
       and that there is more than just cancelled or skipped attachment. We can thus assume that
       the task is incomplete.
    */
  return TaskStatuses.INCOMPLETE;
}
