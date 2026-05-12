import type { BorrowerModel } from '../../dynamic-forms/models/fields.models';
import type { BusinessTypes } from '../../models/businessModels';
import { RequestUserRoles } from '../../models/requestModels';

export type InvitationType = 'USER_INVITATION' | 'BUSINESS_INVITATION';

interface InvitationBaseSchema {
  invitationType: InvitationType;
  requestId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RequestUserRoles;
}

export interface UserInvitationSchema extends InvitationBaseSchema {
  invitationType: 'USER_INVITATION';
}

export interface BusinessInvitationSchema extends InvitationBaseSchema {
  invitationType: 'BUSINESS_INVITATION';
  businessName: string;
  businessType: BusinessTypes;
  businessUniqueIdentifier?: string;
  businessId?: string;
  businessContactId?: string;
}

export type InvitationSchema = UserInvitationSchema | BusinessInvitationSchema;

export interface InvitationEnvelope {
  invitation: InvitationSchema;
}

export type ExistingRequestUserInvitationSchema = InvitationBaseSchema & {
  id: string;
  senderUserId: string;
  active: boolean;
  allowAddingIndividuals: boolean;
};

export interface AcceptInvitationSchema {
  code: string;
  user: BorrowerModel;
}

export interface InvitationInformationSchema {
  requestName: string;
  allowAddingIndividuals: boolean;
  firstName: string;
  lastName: string;
  email: string;
}
