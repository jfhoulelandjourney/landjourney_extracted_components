import { getUUID4 } from '../utils/stringUtil';
import { WorkflowProductTypes } from './products/workflow-productTypes';

export enum Audiences {
  ALL_CLIENTS = 'ALL_CLIENTS',
  ASSIGNED_CLIENT = 'ASSIGNED_CLIENT',
  ALL_PROCESSORS = 'ALL_PROCESSORS',
  ALL_SUPPORT = 'ALL_SUPPORT',
}

export enum TaskTypes {
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  CREDIT_CHECK = 'CREDIT_CHECK',
  SIGNATURE = 'SIGNATURE',
  DYNAMIC_FORM = 'DYNAMIC_FORM',
  FILE = 'FILE',
  ARRAY_OF_FILES = 'ARRAY_OF_FILES',
  DEFAULT = 'DEFAULT',
  REVIEW_APPLICATION = 'REVIEW_APPLICATION',
  LOAN_MODIFICATION = 'LOAN_MODIFICATION',
  SET_COAPPLICANTS = 'SET_COAPPLICANTS',
}

export enum InternalRoles {
  REQUEST_OWNER = 'REQUEST_OWNER',
  ACCOUNT_OWNER = 'ACCOUNT_OWNER',
  LOAN_OFFICER = 'LOAN_OFFICER',
  PROCESSOR = 'PROCESSOR',
  UNDERWRITER = 'UNDERWRITER',
  APPROVER = 'APPROVER',
  CLOSER = 'CLOSER',
  FUNDER = 'FUNDER',
  POST_CLOSER = 'POST_CLOSER',
}

export enum SectionReviewStatuses {
  NONE = 'NONE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REVIEW_FAILED = 'REVIEW_FAILED',
  REVIEWED = 'REVIEWED',
}

export enum AttachmentReviewStatuses {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SectionStatuses {
  // Section being created and not submitted yet
  DRAFT = 'DRAFT',
  // All tasks are still incomplete/No document was submitted yet
  INCOMPLETE = 'INCOMPLETE',
  // All tasks are provided but no review done
  // All documents were sent by the user under all tasks, but no task was reviewed yet
  SUBMITTED = 'SUBMITTED',
  // Some tasks (but not all) are provided and none of them were reviewed
  IN_PROGRESS = 'IN_PROGRESS',
  // Some tasks are provided and at least one of it were reviewed
  // Some documents were sent by the user and the office reviewed at least one of them
  UNDER_REVIEW = 'UNDER_REVIEW',
  // All tasks were reviewed by the office, and all of them were rejected or cancelled
  REJECTED = 'REJECTED',
  // All tasks were reviewed by the office, and all of them were approved or cancelled
  APPROVED = 'APPROVED',
  // All tasks were reviewed by the office, and all of them were cancelled
  CANCELLED = 'CANCELLED',
  // Section is waiting to be activated
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
}

export enum TaskStatuses {
  // It indicates an attachment where the document was not provided yet
  INCOMPLETE = 'INCOMPLETE',
  // It indicates an attachment after the client submits the document
  PROVIDED = 'PROVIDED',
  // It indicates an attachment reviewed by the office, and not approved
  // The user should send a different document in the future
  REJECTED = 'REJECTED',
  // It indicates an attachment reviewed by the office, and it is accepted by the office
  APPROVED = 'APPROVED',
  // It indicates the attachment is not required anymore and it is not necessary to send it
  CANCELLED = 'CANCELLED',
  // It indicates that the clients are requesting for the task to be cancelled by the backoffice, counts as submitted as a justification is required
  SKIPPED = 'SKIPPED',
}

export enum SignatureTargets {
  REQUEST = 'REQUEST',
  SECTION = 'SECTION',
  DOCUMENT = 'DOCUMENT',
  FILE = 'FILE',
  DYNAMIC_FORM = 'DYNAMIC_FORM',
}

export enum SignatoryTypes {
  USER = 'USER',
  GROUP = 'GROUP',
}

export interface Signature {
  id?: string;
  targetType: SignatureTargets;
  targetId: string;
  signatoryType: SignatoryTypes;
  signatoryId: string;
  signature: string;
  signatureDate?: number;
}

export enum AudiencePermissionsLevel {
  VIEW_STATUS = 0,
  VIEW_DATA = 1,
  EDIT = 5,
  SUBMIT = 10,
  INVITE = 15,
  ACCEPT = 20,
  CLOSE = 25,
}

export enum SenderTypes {
  CLIENT = 'CLIENT',
  SYSTEM = 'SYSTEM',
}

export enum AttachmentTypes {
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  CREDIT_CHECK = 'CREDIT_CHECK',
  SIGNATURE = 'SIGNATURE',
  DYNAMIC_FORM = 'DYNAMIC_FORM',
  FILE = 'FILE',
  REFERENCE_DOCUMENT = 'REFERENCE_DOCUMENT',
  TEXT = 'TEXT',
  REVIEW_APPLICATION_SIGNATURE = 'REVIEW_APPLICATION_SIGNATURE',
}

export type AttachmentTypeVisualDescription = {
  key: AttachmentTypes;
  label: string;
  icon: (file?: File) => string;
};

// AUDIENCE PERMISSIONS
// -----------------------------------------------
export type AudiencesPermission = Record<string, AudiencePermissionsLevel>;

// ATTACHMENT MODEL
// -----------------------------------------------

export interface AttachmentNote {
  createdBy: string;
  createdByUserName: string;
  message: string;
  createdAt: number;
  fromStatus: string;
  toStatus: string;
}

export type ReviewApplicationSignatureAttachmentMetadata = {
  signedName: string;
  signedAt: number;
  signedBy: string;
};

export interface Attachment {
  id?: string;
  name: string | null;
  documentId?: string;
  digest?: string;
  type: AttachmentTypes;
  status: TaskStatuses;
  justification?: string;
  notes?: AttachmentNote[];
  writable: boolean;
  senderType: SenderTypes;
  isTemplate?: boolean;
  allowSkip?: boolean;
  checklistTemplateId?: string;
  dataExtractionTemplateId?: string | null;
  text?: string;
  reviewStatus?: AttachmentReviewStatuses;
  reviewJustification?: string;
  reviewNotes?: AttachmentNote[];
  metadata?: unknown;
}

export interface ReviewApplicationSignatureAttachment extends Attachment {
  name: string; // Override to make it required - BE will complain if it's null
  type: AttachmentTypes.REVIEW_APPLICATION_SIGNATURE;
  metadata: ReviewApplicationSignatureAttachmentMetadata;
}

export interface PatchAttachmentInput {
  id: string;
  status: TaskStatuses;
  documentId?: string;
}

export const getDefaultAttachment = (): Attachment => {
  return {
    id: getUUID4(),
    name: '',
    senderType: SenderTypes.SYSTEM,
    writable: true,
    type: AttachmentTypes.FILE,
    status: TaskStatuses.INCOMPLETE,
    documentId: undefined,
    isTemplate: true,
  };
};

// SECTION CONDITIONAL MODEL
// ----------------------------------------------
export enum SectionConditionalConditionEnum {
  VALUE_COMPARISON = 'VALUE_COMPARISON',
  TASK_COMPLETION = 'TASK_COMPLETION',
  REGEX = 'REGEX',
}

export enum SectionConditionalOperatorEnum {
  EQUAL = 'EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL_TO = 'GREATER_THAN_OR_EQUAL_TO',
  LESS_THAN_OR_EQUAL_TO = 'LESS_THAN_OR_EQUAL_TO',
  NOT_EQUAL = 'NOT_EQUAL',
}

export interface SectionConditionalComparison {
  operator: SectionConditionalOperatorEnum;
  value: string;
}

export interface FieldBasedConditionalRule {
  id: string;
  condition: SectionConditionalConditionEnum;
  comparisons: SectionConditionalComparison[];
  fieldId: string;
  fieldName: string;
  isMet: boolean;
}

export interface TaskStatusBasedConditionalRule {
  id: string;
  condition: SectionConditionalConditionEnum;
  sectionName: string;
  requiredStatus: SectionStatuses[];
  isMet: boolean;
  manuallyActivated?: boolean;
  manuallyActivatedBy?: string;
}

export type SectionConditionalRule =
  | FieldBasedConditionalRule
  | TaskStatusBasedConditionalRule;

export interface SectionConditional {
  id: string;
  isMet: boolean;
  rules: SectionConditionalRule[];
}

// TASK MODEL
// ----------------------------------------------

export type TaskScope = 'applicant' | 'request';

export interface UnsavedTask {
  id?: string;
  default?: boolean;
  name: string;
  description?: string;
  status: TaskStatuses;
  taskType: TaskTypes;
  audiences: string[];
  audiencesPermission: AudiencesPermission;
  justification?: string;
  attachments: Attachment[];
  scope?: TaskScope;
  entityHash?: string;
  taskDigest?: string;
  submittedAt?: number;
  submittedBy?: string;
}

export interface SavedTask extends UnsavedTask {
  sectionId: string;
  entityHash: string;
}

export type Task = UnsavedTask | SavedTask;

// SECTION MODEL
// -----------------------------------------------

export type SectionScope = 'applicant' | 'request';

export interface SectionApplyTo {
  userTypes: string[];
  userRoles: string[];
}

export interface UnsavedSection {
  sectionId?: string;
  id?: string;
  name: string;
  refreshAtRenewal?: boolean;
  scope: SectionScope;
  ordering?: number;
  applyTo: SectionApplyTo;
  assigneeId?: string;
  audiences: string[];
  audiencesPermission: AudiencesPermission;
  sectionConditionals: SectionConditional[];
  usersToInclude: string[];
  usersToExclude: string[];
  description: string;
  dueDate?: number;
  instructions: string[];
  productType?: WorkflowProductTypes;
  tasks: Task[];
  permission?: AudiencePermissionsLevel;
  status: SectionStatuses;
  step?: string;
  entityHash?: string;
  sectionDigest?: string;
  internal: boolean;
  internalAssigneeIds: string[];
  internalRole?: InternalRoles | null;
  reviewRequired: boolean;
  reviewerRole?: InternalRoles | null;
  reviewStatus?: SectionReviewStatuses | null;
  reviewerAssigneeId?: string | null;
}

export interface SavedSection extends UnsavedSection {
  id: string;
  step: string;
  requestId: string;
  entityHash: string;
}

export type Section = UnsavedSection | SavedSection;

// Status update
// -----------------------------------------------
const taskStatusesLevel = {
  [TaskStatuses.INCOMPLETE]: 0,
  [TaskStatuses.PROVIDED]: 1,
  [TaskStatuses.SKIPPED]: 2,
  [TaskStatuses.CANCELLED]: 2,
  [TaskStatuses.REJECTED]: 3,
  [TaskStatuses.APPROVED]: 3,
};

export function updateTaskStatus(
  currentStatus: TaskStatuses,
  status: TaskStatuses
): TaskStatuses {
  const currentLevel = taskStatusesLevel[currentStatus];
  const newLevel = taskStatusesLevel[status];

  if (newLevel >= currentLevel) {
    return status;
  }

  return currentStatus;
}

export function deriveTaskStatus(
  attachments: Attachment[]
): TaskStatuses | undefined {
  const attachmentStatuses = Array.from(
    attachments
      .filter(attachment => attachment.writable)
      .reduce((set, { status }) => {
        set.add(status);
        return set;
      }, new Set<TaskStatuses>())
  );

  if (attachmentStatuses.length === 1) {
    // @ts-expect-error TS deals bad with indexes. We can ensure item is defined
    const item: TaskStatuses = attachmentStatuses.at(0);
    return item;
  }

  // This is fine
  const approvedStatuses = [TaskStatuses.APPROVED, TaskStatuses.CANCELLED];

  //
  const rejectedStatuses = [TaskStatuses.REJECTED];

  // If one file is rejected, back to incomplete
  const providedStatuses = [
    TaskStatuses.APPROVED,
    TaskStatuses.CANCELLED,
    TaskStatuses.PROVIDED,
    TaskStatuses.REJECTED,
  ];

  if (attachmentStatuses.every(status => approvedStatuses.includes(status))) {
    return TaskStatuses.APPROVED;
  }

  if (attachmentStatuses.some(status => rejectedStatuses.includes(status))) {
    return TaskStatuses.REJECTED;
  }

  if (attachmentStatuses.every(status => providedStatuses.includes(status))) {
    return TaskStatuses.PROVIDED;
  }

  return undefined;
}

export function deriveSectionStatus(
  tasks: Task[]
): SectionStatuses | undefined {
  const taskStatuses = Array.from(
    tasks.reduce((set, { status }) => {
      set.add(status);
      return set;
    }, new Set<TaskStatuses>())
  );

  /* This code is order dependent, so avoid reordering the validations below */

  // CANCELLED
  const cancelledSection = taskStatuses.every(
    status => TaskStatuses.CANCELLED === status
  );
  if (cancelledSection) {
    return SectionStatuses.CANCELLED;
  }

  // APPROVED
  const approvedSection = taskStatuses.every(status =>
    [TaskStatuses.APPROVED, TaskStatuses.CANCELLED].includes(status)
  );
  if (approvedSection) {
    return SectionStatuses.APPROVED;
  }

  // REJECTED
  // one rejected tasks is enough to put the section in rejected status
  // we cannot count the cancelled here tho!
  const rejectedSection = taskStatuses.some(status =>
    [TaskStatuses.REJECTED].includes(status)
  );

  if (rejectedSection) {
    return SectionStatuses.REJECTED;
  }

  // UNDER_REVIEW
  // At least one task is approved, rejected or cancelled

  // SUBMITTED
  // All documents was sent
  const submittedSection = taskStatuses.every(
    status =>
      status !== TaskStatuses.INCOMPLETE && status !== TaskStatuses.CANCELLED
  );
  if (submittedSection) {
    return SectionStatuses.SUBMITTED;
  }

  // IN PROGRESS
  const initiatedSection =
    taskStatuses.filter(
      status =>
        status !== TaskStatuses.INCOMPLETE && status !== TaskStatuses.CANCELLED
    ).length === 1;
  if (initiatedSection) {
    return SectionStatuses.IN_PROGRESS;
  }

  // INCOMPLETE
  const incompleteSection = taskStatuses.every(status =>
    [TaskStatuses.INCOMPLETE, TaskStatuses.CANCELLED].includes(status)
  );
  if (incompleteSection) {
    return SectionStatuses.INCOMPLETE;
  }

  // OTHERS
  return undefined;
}
