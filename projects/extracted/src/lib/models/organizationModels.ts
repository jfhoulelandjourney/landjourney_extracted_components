import type { BrandColors } from '../services/organization/tenant.models';

export interface Organization {
  id: string;
  name: string;
  termsOfUseUrl?: string;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  dnsPrefix: string;
  logoUri: string;
  logoUriSmall: string;
  colors: {
    primary: BrandColors;
    secondary: BrandColors;
    tertiary: BrandColors;
  };
  syncEnabled: boolean;
  syncKeySecretName?: string;
  syncOutboundQueueName?: string;
  defaultGroups: string[];
  backofficeJwtTtlMinutes: number;
  clientAppsJwtTtlMinutes: number;
  emailOverrides: Record<string, unknown>;
  emails?: Record<string, string>;
  contactDetails: string;
}

export interface Group {
  id?: string;
  organizationId: string;
  name: string;
  email?: string;
  permissions: Permission[];
  system: boolean;
  workgroup: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface FeatureFlag {
  name: string;
  activated: boolean;
}

// --------------------------------------------
// RESOURCES
// --------------------------------------------

export enum Resources {
  CUSTOMERS = 'CUSTOMERS',
  DISCUSSIONS = 'DISCUSSIONS',
  DOCUMENTS = 'DOCUMENTS',
  GROUPS = 'GROUPS',
  LOANS = 'LOANS',
  ORGANIZATION = 'ORGANIZATION',
  REQUESTS_TEMPLATES = 'REQUESTS_TEMPLATES',
  REQUESTS = 'REQUESTS',
  ROOT_ORGANIZATIONS = 'ROOT_ORGANIZATIONS',
  SYNC = 'SYNC',
  USERS = 'USERS',
  DATA_ACCESS = 'DATA_ACCESS',
  FIELDS_GROUP = 'FIELDS_GROUP',
  PRODUCTS_GROUP = 'PRODUCTS_GROUP',
}

// --------------------------------------------
// ACTIONS
// --------------------------------------------

export enum Actions {
  DENY = 0,
  LIST = 1,
  READ = 2,
  UPDATE = 3,
  CREATE = 4,
  DELETE = 5,
}

// --------------------------------------------
// PERMISSION
// --------------------------------------------

export interface Permission {
  resource: Resources;
  action: Actions;
}

export const EMPTY_PERMISSION_MATRIX: Permission[] = [
  { resource: Resources.CUSTOMERS, action: Actions.DENY },
  { resource: Resources.DISCUSSIONS, action: Actions.DENY },
  { resource: Resources.DOCUMENTS, action: Actions.DENY },
  { resource: Resources.GROUPS, action: Actions.DENY },
  { resource: Resources.LOANS, action: Actions.DENY },
  { resource: Resources.REQUESTS_TEMPLATES, action: Actions.DENY },
  { resource: Resources.REQUESTS, action: Actions.DENY },
  { resource: Resources.USERS, action: Actions.DENY },
  { resource: Resources.DATA_ACCESS, action: Actions.DENY },
  { resource: Resources.FIELDS_GROUP, action: Actions.DENY },
  { resource: Resources.PRODUCTS_GROUP, action: Actions.DENY },
];

export interface NavigationItem {
  label: string;
  iconName: string;
  permission: Permission | undefined;
  routeTo: string;
}
