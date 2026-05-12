import type { BusinessTypes } from './businessModels';
import type { RequestUserRoles } from './requestModels';
import type { InvitationType } from '../services/workflows-api/invitation.models';

export type CoApplicantStatus = 'pending' | 'accepted' | 'active' | 'sending';
export type CoApplicantSource = 'direct' | 'invited';
export type CoApplicantEntityType = 'individual' | 'business';

export interface CoApplicantViewModel {
  id: string;
  displayName: string;
  email: string;
  entityType: CoApplicantEntityType;
  source: CoApplicantSource;
  status: CoApplicantStatus;
  role?: RequestUserRoles;
  businessName?: string;
  businessType?: BusinessTypes;
  invitationId?: string;
  userId?: string;
}

export interface InviteCoApplicantPayload {
  requestId: string;
  invitationType: InvitationType;
  firstName: string;
  lastName: string;
  email: string;
  role: RequestUserRoles;
  businessName?: string;
  businessType?: BusinessTypes;
  businessUniqueIdentifier?: string;
  businessId?: string;
  businessContactId?: string;
}
