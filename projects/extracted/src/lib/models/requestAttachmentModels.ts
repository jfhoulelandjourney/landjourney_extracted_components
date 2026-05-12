export enum RequestAttachmentTypes {
  SIGNATURE = 'SIGNATURE',
  MARKETING = 'MARKETING',
  LOAN_DOCUMENT = 'LOAN_DOCUMENT',
}

export enum RequestAttachmentAccessLevel {
  VIEW = 10,
  EDIT = 20,
  SIGN = 30,
}

export enum RequestAttachmentHistoryActions {
  CREATED = 'CREATED',
  SIGNED = 'SIGNED',
  SIGNATURE_DELETED = 'SIGNATURE_DELETED',
  VIEWED = 'VIEWED',
  DOWNLOADED = 'DOWNLOADED',
}

export interface RequestAttachementAccess {
  organizationUserId: string;
  accessLevel: RequestAttachmentAccessLevel;
}

export interface RequestAttachmentHistory {
  id?: string;
  organizationUserId: string;
  action: RequestAttachmentHistoryActions;
  details: string;
  timestamp: number;
}

export interface RequestAttachment {
  id?: string;
  name: string;
  documentId: string;
  ownerId: string;
  signatureRequired: boolean;
  signatureIds?: string[];
  visibleToEveryone: boolean;
  type: RequestAttachmentTypes;
  access: RequestAttachementAccess[];
  notifications: string[];
  history: RequestAttachmentHistory[];
  digest?: string;
}

export interface PatchRequestAttachmentSchema {
  access?: RequestAttachementAccess[];
  notifications?: string[];
  locked?: boolean;
  name?: string;
  signatureRequired?: boolean;
  visibleToEveryone?: boolean;
  signatureIds?: string[];
}

export interface SignRequestAttachmentSchema {
  signatureId: string;
  digest: string;
}

export function getDefaultRequestAttachment(): RequestAttachment {
  return {
    name: '',
    documentId: '',
    ownerId: '',
    signatureRequired: false,
    visibleToEveryone: false,
    type: RequestAttachmentTypes.LOAN_DOCUMENT,
    access: [],
    notifications: [],
    history: [],
  };
}
