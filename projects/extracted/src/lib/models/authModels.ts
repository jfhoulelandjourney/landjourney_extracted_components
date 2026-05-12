export enum AuthTokenTypes {
  AUTH_CODE = 'AUTH_CODE',
  MAGIC_LINK = 'MAGIC_LINK',
  COMBINED = 'COMBINED',
}

export enum SystemGroups {
  ORGANIZATION_OWNER = 'ORGANIZATION OWNER',
  LOAN_OFFICER = 'LOAN OFFICER',
  EMPLOYEES = 'EMPLOYEES',
  CUSTOMERS = 'CUSTOMERS',
  RETAILER_EMPLOYEES = 'RETAILER EMPLOYEES',
}

export interface BasicGroup {
  id: string;
  name: string;
  system: boolean;
}
