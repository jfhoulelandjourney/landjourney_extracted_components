import { SetRequired } from 'type-fest';
import { isNil } from '../utils/nullishUtil';
import { Address } from './addressModels';
import { SharedViewUserProfile, type Note } from './userModels';

export enum BusinessTypes {
  CORPORATION = 'CORPORATION',
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
  LLC = 'LLC',
  LLP = 'LLP',
  GP = 'GP',
  LP = 'LP',
  TRUST = 'TRUST',
  ESTATE = 'ESTATE',
}

export interface Business {
  // AT SOME POINT, CREATE A SharedViewBusinessProfile IF FIELDS BECOME DIFFERENT
  id?: string;
  organizationId?: string;
  primaryContactId?: string;
  primaryAddressId?: string;
  authorizedSignerIds: string[];
  role?: unknown;
  name: string;
  email: string;
  businessType: BusinessTypes;
  uniqueBusinessIdentifier: string;
  users?: unknown;
  addresses?: Address[];
  representatives?: SharedViewUserProfile[];
  notes?: Note[];
}

export const isBusiness = (input?: object): input is Business => {
  if (isNil(input)) return false;

  const validName = 'name' in input && typeof input['name'] === 'string';
  const validEmail = 'email' in input && typeof input['email'] === 'string';
  const validBusinessType =
    'businessType' in input &&
    Object.values<string>(BusinessTypes).includes(
      String(input['businessType'])
    );
  const validUniqueBusinessIdentifier =
    'uniqueBusinessIdentifier' in input &&
    typeof input['uniqueBusinessIdentifier'] === 'string';

  return (
    validName &&
    validEmail &&
    validBusinessType &&
    validUniqueBusinessIdentifier
  );
};

export const isBusinessWithRepresentatives = (
  input?: object
): input is SetRequired<Business, 'representatives'> => {
  return (
    isBusiness(input) &&
    'representatives' in input &&
    Array.isArray(input['representatives'])
  );
};

export interface BusinessQueryResult {
  items: Business[];
  totalCount: number;
}
