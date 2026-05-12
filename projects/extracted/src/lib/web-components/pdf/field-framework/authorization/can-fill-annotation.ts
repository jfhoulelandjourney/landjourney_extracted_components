import { FIELD_DATA_SCHEMA_VERSION } from '../constants';
import { FIELD_PLUGINS } from '../plugins/field-plugin';

/**
 * Minimal user shape the authorization functions need. Application code
 * supplies a full `RequestUser` / `UserProfile`; the framework only consumes
 * these two ids.
 */
export interface AuthorizationUser {
  id?: string;
  activeOrganizationUserId?: string;
}

/**
 * Minimal annotation shape the authorization functions inspect. Only
 * `customData` is read; everything else on a PSPDFKit annotation is ignored.
 */
export interface AuthorizableAnnotation {
  customData?: unknown;
}

/**
 * Subset of `customData` that authorization actually inspects. Common to both
 * v1 (`AnnotationData`) and v2 (`V2FieldData`) — kept tiny on purpose to avoid
 * coupling the framework's authorization code to either generation's full type.
 */
interface AuthInspectableCustomData {
  readonly filled?: boolean;
  readonly signer?: { readonly id?: string } | null;
  readonly type?: string;
  readonly schemaVersion?: number;
}

/**
 * Checks if a user can fill a specific annotation.
 *
 * Returns `false` if the annotation is already filled (filled fields are
 * effectively read-only). Otherwise delegates to `isAuthorizedForAnnotation`
 * for the permission check.
 */
export function canFillAnnotation(
  annotation: AuthorizableAnnotation,
  currentUser: AuthorizationUser | null,
  impersonateId: string | null
): boolean {
  const customData = annotation.customData as
    | AuthInspectableCustomData
    | null
    | undefined;

  if (customData?.filled) {
    return false;
  }

  return isAuthorizedForAnnotation(annotation, currentUser, impersonateId);
}

/**
 * Checks if the current user is authorized to fill an annotation, ignoring
 * the filled state. Used by computed signals that filter "annotations the
 * user is responsible for" regardless of whether each one is already filled.
 *
 * Authorization rules:
 * - No `customData` (e.g. plain shape annotations): always authorized.
 * - v2 fields with an assigned `signer`: only that signer (or someone whose
 *   `impersonateId` matches) may fill, regardless of plugin type.
 * - v2 fields with no `signer`: any authenticated user may fill, but only when
 *   the plugin has `requiresAssignment: false` (e.g. date). v2 fields with no
 *   signer and `requiresAssignment: true` is a bug state and returns `false`.
 * - v1 fields: must have `signer.id` set, and that id must match one of the
 *   current user's identities (general id, active organization id, or
 *   impersonated id).
 */
export function isAuthorizedForAnnotation(
  annotation: AuthorizableAnnotation,
  currentUser: AuthorizationUser | null,
  impersonateId: string | null
): boolean {
  const customData = annotation.customData as
    | AuthInspectableCustomData
    | null
    | undefined;

  if (!customData) {
    return true;
  }

  const signerId = customData.signer?.id;

  // v2 path: plugin registry tells us whether assignment is required.
  if (customData.schemaVersion === FIELD_DATA_SCHEMA_VERSION) {
    if (signerId) {
      return matchesUserIdentity(signerId, currentUser, impersonateId);
    }

    const plugin = Object.values(FIELD_PLUGINS).find(
      p => p.type === customData.type
    );
    return (
      plugin !== undefined && !plugin.requiresAssignment && currentUser !== null
    );
  }

  // v1 path: must have a signer that matches one of the user's identities.
  if (!signerId) {
    return false;
  }
  return matchesUserIdentity(signerId, currentUser, impersonateId);
}

function matchesUserIdentity(
  signerId: string,
  currentUser: AuthorizationUser | null,
  impersonateId: string | null
): boolean {
  const generalUserId = currentUser?.id ?? '';
  const activeOrganizationUserId = currentUser?.activeOrganizationUserId ?? '';
  return (
    impersonateId === signerId ||
    activeOrganizationUserId === signerId ||
    generalUserId === signerId
  );
}
