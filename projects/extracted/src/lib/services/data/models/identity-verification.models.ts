import type { IdDocumentType } from '../enums/identity-verification.enums';

/**
 * All possible statuses from the Authenticate service.
 * Matches backend AuthenticateStatuses enum.
 */
export enum AuthenticateStatuses {
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  IMAGE_POOR_QUALITY = 'IMAGE_POOR_QUALITY',
  IN_PROGRESS = 'IN_PROGRESS',
  INVALID = 'INVALID',
  NAME_MISMATCH = 'NAME_MISMATCH',
  NON_US_IDENTITY = 'NON_US_IDENTITY',
  NOT_PERFORMED = 'NOT_PERFORMED',
  UNKNOWN = 'UNKNOWN',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  VERIFIED = 'VERIFIED',
}

/**
 * The full test result data returned after successful verification.
 * Matches backend AuthenticateGetTestResultResponseSchema.
 */
export interface AuthenticateGetTestResultData {
  extractedDocument: Record<string, unknown>;
  extractedPerson: Record<string, unknown>;
  isSsnVerified: boolean | null;
  providedPerson: Record<string, unknown>;
  ssnValidationScore: number | null;
  nameValidationScore: number | null;
  dateOfBirthValidationScore: number | null;
  manualVerification: boolean;
}

/**
 * Base response schema from Authenticate service.
 * Generic response for all authenticate operations.
 * Matches backend AuthenticateResponseSchema.
 */
export interface AuthenticateResponseSchema<TData = unknown> {
  status: AuthenticateStatuses;
  retryable: boolean;
  isError: boolean;
  statusDetails: string | null;
  data: TData | null;
  existingId?: string | null;
  errorSource?: string | null;
}

/**
 * Customer-facing schema with only status field.
 * Matches backend CustomerSchema.
 */
export interface CustomerSchema {
  status: AuthenticateStatuses;
}

/**
 * User details needed for identity verification.
 */
export type IdentityVerificationDetails = {
  organizationUserId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phoneNumber: string | null;
  dateOfBirth: number;
  ssn: string | null;
  email: string;
  streetNumber: string | null;
  streetName: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
};

/**
 * Input payload for verify operation.
 */
export type IdentityVerificationInput = IdentityVerificationDetails & {
  idDocumentType: IdDocumentType;
  idFrontDocumentId: string;
  idBackDocumentId?: string | null | undefined;
};

/**
 * Request schema for verify operation.
 */
export type IdentityVerificationVerifySchema = {
  vendor: 'ID_VALIDATION';
  operation: 'verify';
  data: IdentityVerificationInput;
};

/**
 * Response from verify operation on success.
 * Returns a ValidResponse with correlationId.
 */
export type IdentityVerificationVerifyResponse = {
  correlationId: string;
};

/**
 * Request schema for status operation.
 */
export type IdentityVerificationStatusSchema = {
  vendor: 'ID_VALIDATION';
  operation: 'status';
  data: {
    organizationUserId: string;
    correlationId: string;
    idDocumentType: IdDocumentType;
  };
};

/**
 * Response from status operation.
 * Returns AuthenticateResponseSchema with full test result data.
 */
export type IdentityVerificationStatusResponse =
  AuthenticateResponseSchema<AuthenticateGetTestResultData>;

/**
 * Full response from backoffice endpoint GET /identity-verification/{organizationUserId}
 */
export type IdentityVerificationBackofficeResponse =
  AuthenticateResponseSchema<AuthenticateGetTestResultData>;
