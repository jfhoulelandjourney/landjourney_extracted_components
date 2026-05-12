import { Condition } from '../services/organization/conditions.models';
import { BasicGroup } from './authModels';

export enum CoreUpdateTypes {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  PASSWORD = 'PASSWORD',
}

export enum CoreUpdateStatuses {
  INITIATED = 'INITIATED',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
}

export interface CoreUpdateRequest {
  coreUpdateType: CoreUpdateTypes;
  newValue: string;
}

export interface CoreUpdateResponseSchema {
  status: CoreUpdateStatuses;
}

export interface CoreUpdateExecuteSchema {
  newValue: string;
  code: string;
}

export enum DigestFrequenciesEnum {
  NO_DIGEST = 'NO_DIGEST',
  DIGEST_30_MINUTE = 'DIGEST_30_MINUTES',
  DIGEST_60_MINUTES = 'DIGEST_60_MINUTES',
  DIGEST_4_HOURS = 'DIGEST_4_HOURS',
  DIGEST_8_HOURS = 'DIGEST_8_HOURS',
  DIGEST_DAILY = 'DIGEST_DAILY',
  DIGEST_WEEKLY = 'DIGEST_WEEKLY',
}

export interface Preferences {
  digestFrequencies: Record<string, DigestFrequenciesEnum>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ui: Record<string, any>;
}

export interface BasicUserProfile {
  id?: string;
  userId?: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  avatarUri?: string;
  disabled: boolean;
  lastActive?: number;
  ipAddress?: string;
  organizationId?: string;
}

export interface SharedViewUserProfile {
  avatarUri?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  disabled?: boolean; // => need to return if any of the organization flag or the user flag is true
  userId?: string; // => OrganizationUserId
  users?: unknown;
}

export interface Note {
  createdBy: string;
  createdByUserName: string;
  message: string;
  createdAt: number;
}

export interface UserProfile extends BasicUserProfile {
  activeOrganization?: string;
  activeOrganizationUserId?: string;
  digest?: string;
  groups?: BasicGroup[];
  conditionsToAccept?: Condition[];
  preferences?: Preferences;
  notes?: Note[];
}

export function buildLocalNote(
  author: {
    id?: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  },
  message: string
): Note {
  const displayName =
    `${author.firstName ?? ''} ${author.lastName ?? ''}`.trim();
  return {
    createdBy: author.id ?? author.userId ?? '',
    createdByUserName: displayName || author.email || 'Unknown',
    message,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

export interface UserQueryResult {
  totalCount: number;
  items: (UserProfile | BasicUserProfile)[];
}

export interface SafeUserCreate {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email: string;
  groups: string[];
  retailerId?: string;
}

export interface UpdateOrganizationUserSchema {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatarUri?: string;
  preferences?: Preferences;
  notes?: Note[];
  organizationId?: string;
}

export interface UpdateMeUserSettingsSchema {
  firstName?: string;
  lastName?: string;
  avatarUri?: string;
  preferences?: Preferences;
}

export function getDefaultUserProfile(): UserProfile {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    disabled: false,
    lastActive: 0,
    preferences: {
      digestFrequencies: {},
      ui: {},
    },
    organizationId: '',
  };
}
