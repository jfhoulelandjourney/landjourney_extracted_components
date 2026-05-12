export enum SupportTiers {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export enum BillingFrequencies {
  NEVER = 'NEVER',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export type PlatformLicenseBaseSchema = {
  name: string;
  code: string;

  sharedDomainId?: string;

  features: string[];
  integrations: string[];
  limits: Record<string, number>;
  supportTier: SupportTiers;

  billingAmountCents: number;
  billingFrequency: BillingFrequencies;
  expiresAfterDays?: number;
  trialPeriodDays?: number;

  upgradeAutomatically: boolean;
  licenseUpgradeId?: string;
};

export function getDefaultLicense(): PlatformLicenseBaseSchema {
  return {
    name: '',
    code: '',
    features: [],
    integrations: [],
    limits: {},
    supportTier: SupportTiers.BASIC,
    billingAmountCents: 0,
    billingFrequency: BillingFrequencies.MONTHLY,
    upgradeAutomatically: false,
  };
}

export type AvailableFeatureCategorySchema = {
  category: string;
  features: string[];
};

export type LimitOptionSchema = {
  label: string;
  value: number | undefined;
};

export type LimitSchema = {
  name: string;
  options: LimitOptionSchema[];
};

export const AVAILABLE_LIMITS: LimitSchema[] = [
  {
    name: 'INTERNAL_USERS',
    options: [
      { label: '', value: undefined },
      { label: '1', value: 1 },
      { label: '5', value: 5 },
      { label: '10', value: 10 },
      { label: '100', value: 100 },
      { label: '1000', value: 1000 },
    ],
  },
  {
    name: 'EXTERNAL_USERS',
    options: [
      { label: '', value: undefined },
      { label: '100', value: 100 },
      { label: '500', value: 500 },
      { label: '1000', value: 1000 },
      { label: '10000', value: 10000 },
    ],
  },
  {
    name: 'FILE_STORAGE',
    options: [
      { label: '', value: undefined },
      { label: '100 GB', value: 100 },
      { label: '200 GB', value: 200 },
      { label: '300 GB', value: 300 },
      { label: '400 GB', value: 400 },
      { label: '500 GB', value: 500 },
      { label: '1000 GB', value: 1000 },
    ],
  },
  {
    name: 'MAXIMUM_DOCUMENT_SIZE',
    options: [
      { label: '', value: undefined },
      { label: '1 GB', value: 1 },
      { label: '2 GB', value: 2 },
      { label: '3 GB', value: 3 },
      { label: '4 GB', value: 4 },
      { label: '5 GB', value: 5 },
      { label: '10 GB', value: 10 },
    ],
  },
];

export const AVAILABLE_FEATURES: AvailableFeatureCategorySchema[] = [
  {
    category: 'General',
    features: [
      'GENERIC_PLATFORM_MODE',
      'DOCUMENT_AI_CHATBOT',
      'DYNAMIC_FORMS_FEATURE',
      'THIRD_PARTY_ACCESS_FEATURE',
      'CLIENT_SETTINGS_FEATURE',
      'COMMUNICATION_PREFERENCES',
      'EXPORT_DATA_FEATURE',
    ],
  },
  {
    category: 'Messaging',
    features: [
      'MESSAGING_FEATURE',
      'MESSAGING_CLIENT_FEATURE',
      'MESSAGING_TAB_CLIENT_FEATURE',
    ],
  },
  {
    category: 'Requests',
    features: [
      'REQUEST_DOCUMENTS',
      'ALL_FILES_FORMAT_IN_REQUEST_DOCUMENT_CENTER',
      'SIGNATURE_FEATURE',
    ],
  },
  {
    category: 'Lending',
    features: ['LENDING_FEATURE', 'LENDING_DOCUMENTS', 'LOAN_MANAGER_FEATURE'],
  },
];

export type AvailableIntegrationCategorySchema = {
  category: string;
  integrations: string[];
};

export const AVAILABLE_INTEGRATIONS: AvailableIntegrationCategorySchema[] = [];

export type StandardExpirationSchema = {
  label: string;
  value: number | undefined;
};

export const STANDARD_EPIRATIONS: StandardExpirationSchema[] = [
  {
    label: '',
    value: undefined,
  },
  {
    label: '1 week',
    value: 7,
  },
  {
    label: '2 weeks',
    value: 14,
  },
  {
    label: '3 weeks',
    value: 21,
  },
  {
    label: '4 weeks',
    value: 28,
  },
  {
    label: '90 days',
    value: 90,
  },
  {
    label: '1 year',
    value: 365,
  },
];

export type PlatformLicenseCreatedSchema = {
  id: string;
};

export type ExistingPlatformLicenseSchema = PlatformLicenseCreatedSchema &
  PlatformLicenseBaseSchema;
