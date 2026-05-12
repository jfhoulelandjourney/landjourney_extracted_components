/**
 * Specifies the source of the prefill data unit.
 */
export enum PrefillSourceTypes {
  DOCUMENT = 'DOCUMENT',
  DYNAMIC_FORM = 'DYNAMIC_FORM',
  TASK = 'TASK',
}

export enum ArtifactTypes {
  BUSINESS = 'BUSINESS',
  EMAIL = 'EMAIL',
  LOCATION = 'LOCATION',
  PERSON = 'PERSON',
  PHONE = 'PHONE',
  CUSTOM = 'CUSTOM',
}

export const IDENTITY_VERIFICATION_PREFILL_FIELDS = [
  'firstName',
  'lastName',
  'middleName',
  'phoneNumber',
  'ssn',
  'dateOfBirth',
  'streetNumber',
  'streetName',
  'city',
  'state',
  'zipCode',
  'country',
];

export const CREDIT_CHECK_PREFILL_FIELDS = [
  'firstName',
  'lastName',
  'middleName',
  'phoneNumber',
  'ssn',
  'dateOfBirth',
  'streetNumber',
  'streetName',
  'city',
  'state',
  'zipCode',
  'country',
];
