import { isNotNil } from 'es-toolkit';
import { Business } from '../models/businessModels';
import {
  RequestUser,
  RequestUserRoles,
  RequestUserTypes,
} from '../models/requestModels';
import {
  SharedViewUserProfile,
  UserProfile,
  type BasicUserProfile,
} from '../models/userModels';
import { LoanUserBaseSchema } from '../services/lending/models/loans.models';
import { capitalize, formatEnumValue } from './stringUtil';

export function getUserName(
  value?: Pick<Partial<UserProfile>, 'firstName' | 'lastName'> | null
): string {
  if (!value) return '';
  const { firstName, lastName } = value;
  return [firstName, lastName].filter(isNotNil).join(' ');
}

export function getDisplayNameFromProfile(
  profile: Business | SharedViewUserProfile | undefined
) {
  if (!profile) {
    return 'UNKNOWN';
  }

  if ('businessType' in profile) {
    return profile.name;
  }

  return [profile.firstName, profile.lastName]
    .filter(part => part && part.trim())
    .join(' ');
}

export function getProfileFromRequestUser(
  user: RequestUser
): SharedViewUserProfile {
  const profile = user.profile;
  const emptyProfile = {
    userId: user.userId,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
  };

  if (!profile) {
    return emptyProfile;
  }

  if ('businessType' in profile) {
    const castedProfile = profile as Business;

    const representative = castedProfile.representatives?.at(0);
    const organizationName = castedProfile.name;
    const representativeSuffix = representative
      ? ` (${representative.firstName} ${representative.lastName})`
      : '';
    const email = representative?.email ?? castedProfile.email ?? '';

    return {
      userId: user.userId,
      firstName: `${organizationName}${representativeSuffix}`,
      lastName: '',
      email: email,
    };
  } else {
    const castedProfile = profile as SharedViewUserProfile;

    return {
      userId: user.userId,
      firstName: castedProfile.firstName ?? '',
      lastName: castedProfile.lastName ?? '',
      email: castedProfile.email ?? '',
      avatarUri: castedProfile.avatarUri,
    };
  }
}

export function getProfileFromLoanUser(
  user: LoanUserBaseSchema
): SharedViewUserProfile {
  const profile = user.profile;
  const emptyProfile = {
    userId: user.userId,
    firstName: '',
    lastName: '',
    email: '',
  };

  if (!profile) {
    return emptyProfile;
  }

  const { firstName, lastName, email, avatarUri } = profile;

  return {
    userId: user.userId,
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    email: email ?? '',
    avatarUri: avatarUri ?? '',
  };
}

export interface RoleOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export const getEntityTypeOptions = () => [
  {
    label: formatEnumValue(RequestUserTypes.CORPORATION),
    description: '',
    value: RequestUserTypes.CORPORATION,
  },
  {
    label: formatEnumValue(RequestUserTypes.SOLE_PROPRIETORSHIP),
    description: '',
    value: RequestUserTypes.SOLE_PROPRIETORSHIP,
  },
  {
    label: RequestUserTypes.LLC,
    description: '',
    value: RequestUserTypes.LLC,
  },
  {
    label: RequestUserTypes.LLP,
    description: '',
    value: RequestUserTypes.LLP,
  },
  {
    label: RequestUserTypes.GP,
    description: '',
    value: RequestUserTypes.GP,
  },
  {
    label: RequestUserTypes.LP,
    description: '',
    value: RequestUserTypes.LP,
  },
  {
    label: formatEnumValue(RequestUserTypes.TRUST),
    description: '',
    value: RequestUserTypes.TRUST,
  },
  {
    label: formatEnumValue(RequestUserTypes.ESTATE),
    description: '',
    value: RequestUserTypes.ESTATE,
  },
];

export function getUserRoleOptions(options?: {
  allowEmptyOption?: boolean;
  primaryBorrowerSelected?: boolean;
}): RoleOption[] {
  const normalizedOptions = {
    allowEmptyOption: false,
    primaryBorrowerSelected: false,
    ...options,
  };

  return [
    normalizedOptions.allowEmptyOption
      ? {
          label: '-',
          value: '',
        }
      : null,
    {
      label: 'Primary Borrower',
      value: RequestUserRoles.BORROWER,
      disabled: normalizedOptions.primaryBorrowerSelected,
    },
    {
      label: 'Co-Borrower',
      value: RequestUserRoles.CO_BORROWER,
    },
    {
      label: 'Guarantor',
      value: RequestUserRoles.GUARANTOR,
    },
    {
      label: 'Non Obligated Party',
      value: RequestUserRoles.NON_OBLIGATED_PARTY,
    }
  ].filter(isNotNil);
}

export function formatUserProfile(profile: BasicUserProfile | undefined) {
  if (!profile) {
    return 'Unknown user';
  }

  return [profile.firstName, profile.lastName]
    .filter(p => p && p.trim() !== '')
    .join(' ');
}

interface ResolvedRequestUser {
  displayName: string;
  email?: string;
}

interface NestedBusinessUser {
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

function formatPersonName(
  firstName: string | undefined,
  lastName: string | undefined
): string {
  return [firstName, lastName]
    .filter((part): part is string => Boolean(part) && part?.trim() !== '')
    .map(part => capitalize(part))
    .join(' ');
}

function toNestedBusinessUsers(value: unknown): NestedBusinessUser[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is NestedBusinessUser =>
      Boolean(item) && typeof item === 'object' && 'userId' in item
  );
}

function resolveFromNestedPerson(
  person: NestedBusinessUser | SharedViewUserProfile | undefined,
  fallback: ResolvedRequestUser
): ResolvedRequestUser {
  if (!person) {
    return fallback;
  }

  const displayName = formatPersonName(person.firstName, person.lastName);

  return {
    displayName: displayName || fallback.displayName,
    email: person.email ?? fallback.email,
  };
}

export function resolveRequestUserById(
  users: RequestUser[],
  targetId: string
): ResolvedRequestUser | null {
  if (!targetId) {
    return null;
  }

  const topLevel = users.find(u => u.userId === targetId);

  if (topLevel) {
    const profile = topLevel.profile;

    if (profile && 'businessType' in profile) {
      const business = profile as Business;
      return {
        displayName: business.name,
        email: business.email,
      };
    }

    const personProfile = profile as SharedViewUserProfile | undefined;
    const displayName = formatPersonName(
      personProfile?.firstName ?? topLevel.firstName,
      personProfile?.lastName ?? topLevel.lastName
    );

    return {
      displayName: displayName || topLevel.email || targetId,
      email: personProfile?.email ?? topLevel.email,
    };
  }

  for (const user of users) {
    if (user.userType === RequestUserTypes.INDIVIDUAL) {
      continue;
    }

    const profile = user.profile;

    if (!profile || !('businessType' in profile)) {
      continue;
    }

    const business = profile as Business;
    const representatives = business.representatives ?? [];
    const nestedUsers = toNestedBusinessUsers(business.users);
    const businessFallback: ResolvedRequestUser = {
      displayName: business.name,
      email: business.email,
    };

    if (business.primaryContactId === targetId) {
      const nestedMatch =
        representatives.find(r => r.userId === targetId) ??
        nestedUsers.find(u => u.userId === targetId);
      return resolveFromNestedPerson(nestedMatch, businessFallback);
    }

    const representativeMatch = representatives.find(
      r => r.userId === targetId
    );
    if (representativeMatch) {
      return resolveFromNestedPerson(representativeMatch, businessFallback);
    }

    const userMatch = nestedUsers.find(u => u.userId === targetId);
    if (userMatch) {
      return resolveFromNestedPerson(userMatch, businessFallback);
    }
  }

  return null;
}
