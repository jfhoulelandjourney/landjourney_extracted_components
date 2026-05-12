import type { Simplify } from 'type-fest/source/simplify';
import { type PaginatedApiQueryOptions } from '../api/api.models';

export interface PasswordResetArgs {
  code: string;
  newPassword: string;
  organizationUserId: string;
  isSetup: boolean;
  isBackoffice: boolean;
}

export interface PasswordResetResponse {
  redirect_path?: string;
  redirect_url?: string;
  token?: string;
}

export interface FileExportConfiguration {
  separator: string;
  exportFilename: string[];
  filenameAssignedTask: string[] | null;
  filenameCommonTask: string[] | null;
  folderStructureAssignedTask: string[] | null;
  folderStructureCommonTask: string[] | null;
}

export type QueryOptions = PaginatedApiQueryOptions;

export type UserQueryParams = Simplify<
  PaginatedApiQueryOptions & {
    groups?: string | string[];
    includeDisabled?: boolean;
  }
>;
export interface BrandColor {
  color: string;
  variations: Record<string, string>;
}

export interface OrganizationUIConfiguration {
  id: string;
  organizationUserId?: string;
  userDigest?: string;

  name: string;
  dnsPrefix: string;
  logoUri: string;
  logoUriSmall: string;
  colors: {
    primary: BrandColor;
    secondary: BrandColor;
    tertiary: BrandColor;
  };
  defaultGroups: string[];
  activatedFeatures: string[];
  novuApplicationIdentifier: string;
  termsOfUseUrl?: string;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  backofficeFQDN?: string;
  webappFQDN?: string;
  mobileappFQDN?: string;
  sharedDomain: boolean;
  sharedDomainId?: string;

  environment?: string;
  pspdfLicenseKey?: string;
  stripePublicKey?: string;
  openreplayProjectKey?: string;
  emails?: Record<string, string>;

  contactDetails: string;
  backofficeLoginMethods?: string[];
  backofficeDomainRestrictions?: string[];
  allowCollaboratorsToValidateBorrowerIdentity: boolean;
  allowCollaboratorsToTriggerBorrowerCreditCheck: boolean;

  fileExportConfiguration: FileExportConfiguration;
}

export interface UnauthenticatedInitiatePasswordResetMethod {
  sendByPhone: boolean;
}
