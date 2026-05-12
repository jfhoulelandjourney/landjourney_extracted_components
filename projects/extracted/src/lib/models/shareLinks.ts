import { isNil } from 'es-toolkit';
import { Actions, Resources } from './organizationModels';

export interface TaskOverride {
  type: string;
  name: string;
  path: string;
}

export interface ShareLinkScope {
  entity: Resources;
  action: Actions;
  entity_id: string;
}

export interface UnsavedShareLink {
  id?: string;
  organizationUserId: string;
  redirectPath: string;
  externalId: string;
  senderName: string;
  requestName: string;
  requestType: string;
  subjectOverride?: string;
  messageOverride?: string;
  tasksOverride?: TaskOverride[];
  scope: ShareLinkScope[];
}

export interface SavedShareLink {
  id: string;
  organizationUserId: string;
  recipient: string;
  recipientType: 'EMAIL' | 'SMS';
  expiresAt: number;
  redirectPath: string;
  externalId: string;
}

export type ShareLink = UnsavedShareLink | SavedShareLink;

export const isSavedSharedLink = (input?: object): input is SavedShareLink => {
  if (isNil(input)) return false;

  const validId = 'id' in input && typeof input['id'] === 'string';
  const validOrganizationUserId =
    'organizationUserId' in input &&
    typeof input['organizationUserId'] === 'string';
  const validRecipient =
    'recipient' in input && typeof input['recipient'] === 'string';
  const validRecipientType =
    'recipientType' in input &&
    ['EMAIL', 'SMS'].includes(String(input['recipientType']).toUpperCase());
  const validExpiresAt =
    'expiresAt' in input && typeof input['expiresAt'] === 'number';
  const validRedirectPath =
    'redirectPath' in input && typeof input['redirectPath'] === 'string';
  const validExternalId =
    'externalId' in input && typeof input['externalId'] === 'string';

  return (
    validId &&
    validOrganizationUserId &&
    validRecipient &&
    validRecipientType &&
    validExpiresAt &&
    validRedirectPath &&
    validExternalId
  );
};

export interface RemoveLink {
  id: string;
  disabled: boolean;
  disabledReason: string;
}
