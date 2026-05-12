import type { Business } from '../../models/businessModels';
import type { RequestUser } from '../../models/requestModels';
import type { SharedViewUserProfile } from '../../models/userModels';
import type { AuthorizationUser } from '../pdf/field-framework/authorization/can-fill-annotation';

// The framework owns the pure deciding logic + types. Re-export from here so
// existing callers (`annotation-fill.directive.ts`, the spec, downstream
// projects importing via `'common'`) keep their import sites stable.
export {
  canFillAnnotation,
  isAuthorizedForAnnotation,
  type AuthorizableAnnotation,
  type AuthorizationUser,
} from '../pdf/field-framework/authorization/can-fill-annotation';

/**
 * Builds a map from signer userId to the list of user IDs authorized to sign on their behalf.
 *
 * - Business with authorizedSignerIds: [userId, ...authorizedSignerIds]
 * - Business with primaryContactId (legacy): [userId, primaryContactId]
 * - Individual: [userId]
 *
 * Touches `RequestUser` (an app-level model) so it stays in `signature/`.
 */
export function buildAuthorizedSignersMap(
  users: RequestUser[]
): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const { userId, profile } of users) {
    if (!userId || !profile) {
      continue;
    }

    if (isBusinessWithAuthorizedSigners(profile)) {
      result.set(userId, [userId, ...profile.authorizedSignerIds]);
    } else if (isBusinessWithPrimaryContact(profile)) {
      result.set(userId, [userId, profile.primaryContactId]);
    } else {
      result.set(userId, [userId]);
    }
  }

  return result;
}

/**
 * Given a current user and the authorized-signers map, resolves which signer
 * the current user is impersonating (i.e. acting on behalf of).
 *
 * Returns the signer's userId, or null if the user is not authorized for any signer.
 *
 * Stays alongside `buildAuthorizedSignersMap` because it's the same pipeline
 * step — converting app-level user data into an impersonation id the framework
 * authorization functions can consume.
 */
export function resolveImpersonatedSigner(
  currentUser: AuthorizationUser | null,
  authorizedSigners: Map<string, string[]>
): string | null {
  if (!currentUser || authorizedSigners.size === 0) {
    return null;
  }

  const effectiveUserId =
    currentUser.activeOrganizationUserId ?? currentUser.id ?? '';

  for (const [signerId, authorizedIds] of authorizedSigners.entries()) {
    if (authorizedIds.includes(effectiveUserId)) {
      return signerId;
    }
  }

  return null;
}

function isBusinessWithAuthorizedSigners(
  profile: Business | SharedViewUserProfile
): profile is Business & { authorizedSignerIds: string[] } {
  return (
    'authorizedSignerIds' in profile &&
    Array.isArray((profile as Business).authorizedSignerIds)
  );
}

function isBusinessWithPrimaryContact(
  profile: Business | SharedViewUserProfile
): profile is Business & { primaryContactId: string } {
  return (
    'primaryContactId' in profile &&
    Boolean((profile as Business).primaryContactId)
  );
}
