import { SenderTypes, TaskStatuses } from '../../../models/sectionModels';

export enum LendAttachmentTypes {
  SIGNATURE = 'SIGNATURE',
  MARKETING = 'MARKETING',
  LOAN_DOCUMENT = 'LOAN_DOCUMENT',
}

export enum LendAttachmentAccessLevel {
  VIEW = 10,
  EDIT = 20,
  SIGN = 30,
}

export enum LendAttachmentHistoryActions {
  CREATED = 'CREATED',
  SIGNED = 'SIGNED',
  SIGNATURE_DELETED = 'SIGNATURE_DELETED',
  VIEWED = 'VIEWED',
  DOWNLOADED = 'DOWNLOADED',
}

export interface LendAttachementAccess {
  organizationUserId: string;
  accessLevel: LendAttachmentAccessLevel;
}

export interface LendAutoRenewalInformation {
  active: boolean;
  templateId?: string;
  requestId?: string;
  triggerOffsetInDays: number;
  sent: boolean;
  sentAt: number;
}

export interface LendAttachmentHistory {
  id?: string;
  organizationUserId: string;
  action: LendAttachmentHistoryActions;
  details: string;
  timestamp: number;
}

export interface AttachmentSchema {
  id?: string;
  name: string | null;
  documentId?: string;
  digest?: string;
  type: LendAttachmentTypes;
  status: TaskStatuses;
  justification?: string;
  writable: boolean;
  senderType: SenderTypes;
  isTemplate?: boolean;
  allowSkip?: boolean;
}

export interface LendAttachment {
  id?: string;
  name: string;
  documentId: string;
  ownerId: string;
  signatureRequired: boolean;
  signatureIds?: string[];
  visibleToEveryone: boolean;
  type: LendAttachmentTypes;
  access: LendAttachementAccess[];
  notifications: string[];
  history: LendAttachmentHistory[];
  digest?: string;
}

export interface PatchLendAttachmentSchema {
  access?: LendAttachementAccess[];
  notifications?: string[];
  locked?: boolean;
  name?: string;
  signatureRequired?: boolean;
  visibleToEveryone?: boolean;
  signatureIds?: string[];
}

export interface SignLendAttachmentSchema {
  signatureId: string;
  digest: string;
}

export function getDefaultLendAttachment(): LendAttachment {
  return {
    name: '',
    documentId: '',
    ownerId: '',
    signatureRequired: false,
    visibleToEveryone: false,
    type: LendAttachmentTypes.LOAN_DOCUMENT,
    access: [],
    notifications: [],
    history: [],
  };
}
