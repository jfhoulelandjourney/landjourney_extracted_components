import { type Address } from '../../models/addressModels';
import type { OrganizationUIConfiguration } from './organization.models';

export type TenantRequestInput = {
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
};

export type UnauthenticatedTenantRequestInput = TenantRequestInput & {
  recaptchaToken: string;
};

export type BrandColors = {
  color: string;
  variations: Record<string, string>;
};

export type SelfOnboardingRequestResponseSchema = {
  requestId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'CREATED';
};

export type CompleteSelfOnboardingRequestSchema = {
  uiConfiguration: OrganizationUIConfiguration;
  newToken: string;
};

export type SelfOnboardingTenantRequest = {
  // User info
  organizationName: string;
  firstName: string;
  lastName: string;

  address?: Address;

  // License
  licenseId: string;

  // UI Personalization
  logo: string;
  primaryBrandColors: BrandColors;
  secondaryBrandColors: BrandColors;
  tertiaryBrandColors: BrandColors;
  industry: string;
  paymentCompleted: boolean;
  provisioningRequestId?: string;
  provisioningInProgress: boolean;
};

export function getDefaultBrandColors(): BrandColors {
  return {
    color: '',
    variations: {},
  };
}

export function getDefaultSelfOnboardingTenantRequest(): SelfOnboardingTenantRequest {
  return {
    organizationName: '',
    firstName: '',
    lastName: '',
    licenseId: '',
    logo: '',
    primaryBrandColors: {
      color: '',
      variations: {},
    },
    secondaryBrandColors: {
      color: '',
      variations: {},
    },
    tertiaryBrandColors: {
      color: '',
      variations: {},
    },
    industry: '',
    paymentCompleted: false,
    provisioningInProgress: false,
  };
}

export type TenantRequestStatus =
  | 'Waiting Email Verification'
  | 'Waiting Approval'
  | 'Approved'
  | 'Expired';

export type TenantRequest = {
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  requestId: string;
  token: string;
  createdAt: number;
  updatedAt: number;
  verifiedAt: number;
  expiresAt: number;
  organizationKey: string;
  bucketName: string;
};

export type ApprovedTenantRequest = {
  requestId: string;
  organizationKey: string;
  organizationName: string;
  user: {
    email: string;
    phoneNumber: string;
    lastActive: number;
    disabled: boolean;
    firstName: string;
    lastName: string;
    avatarUri: string;
  };
  approvalId: string;
  approvedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: 0;
  updatedAt: 0;
  environmentCreatedAt?: number;
  environmentStartedAt?: number;
  originalTenantRequest: Omit<TenantRequest, 'organizationKey' | 'bucketName'>;
};

export type GetAllTenantRequestsResponse = {
  creationRequests: TenantRequest[];
  approvedRequests: ApprovedTenantRequest[];
};

export type ApproveTenantRequestInput = {
  requestId: string;
  organizationKey: string;
  organizationName: string;
  user: {
    email: string;
    phoneNumber: string;
    lastActive?: 0;
    disabled?: false;
    firstName: string;
    lastName: string;
    avatarUri?: string;
  };
};

export function isTenantRequestApproved(
  tenantRequest: Pick<TenantRequest, 'expiresAt'>
): boolean {
  return tenantRequest.expiresAt === 0;
}

export function calculateTenantRequestStatus(
  tenantRequest: Pick<TenantRequest, 'expiresAt' | 'verifiedAt'>
): TenantRequestStatus {
  const { expiresAt, verifiedAt } = tenantRequest;
  const expired = expiresAt > Date.now();
  const emailVerified = verifiedAt > 0 && verifiedAt <= Date.now();

  if (isTenantRequestApproved(tenantRequest)) {
    return 'Approved';
  }

  if (expired) {
    return 'Expired';
  }

  if (emailVerified) {
    return 'Waiting Approval';
  }

  return 'Waiting Email Verification';
}

export type EmailVerificationResponse = {
  status: 'VERIFIED' | 'EXPIRED';
  message: string;
};
