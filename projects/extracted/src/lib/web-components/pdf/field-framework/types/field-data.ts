import type { RequestUserRoles } from '../../../../models/requestModels';

/**
 * Design-time signee — the role-based placeholder created in the template
 * builder. A `SigneeInfo` carries an id, a display name, and the set of roles
 * the signee fulfils. At request-creation time, signees are matched to actual
 * recipients (`SignerInfo`) by role.
 */
export interface SigneeInfo {
  readonly id: string;
  readonly name: string;
  readonly roles: RequestUserRoles[];
  readonly email?: string;
  readonly phone?: string;
  readonly image?: Blob | null;
  readonly imageUrl?: string | null;
}

/**
 * Resolved signer — an actual person or organization expected to fill the
 * field. Populated either explicitly (via the inspector) or implicitly (via
 * `mapCustomersToSigners` matching a `SigneeInfo`'s roles to a recipient).
 */
export interface SignerInfo {
  readonly id: string;
  readonly name: string;
  readonly role: RequestUserRoles;
  readonly email?: string;
  readonly phone?: string;
  readonly image?: Blob | null;
  readonly imageUrl?: string | null;
}

/**
 * Audit record stored in `SignatureInstantJSON.signedBy[]` once a signer
 * confirms their fields. Server-managed; the framework only reads it.
 */
export interface SignedBy {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly ipAddress?: string;
  readonly signedAt: number;
}
