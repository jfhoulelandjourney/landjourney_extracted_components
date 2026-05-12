import { RequestUserRoles } from '../../models/requestModels';
import type { SignerInfo } from '../pdf/field-framework/types/field-data';
import { SIGNER_ROLE_PRIORITY } from './annotation.types';

/**
 * Given a signee's allowed `roles` and the concrete `recipients` available in
 * the current request, returns:
 * - `suggested` — the best pick using BORROWER → CO_BORROWER → GUARANTOR priority
 * - `matches`   — every recipient whose `role` is in `roles`
 */
export function resolveRecipientForRoles(
  roles: RequestUserRoles[],
  recipients: SignerInfo[]
): { suggested: SignerInfo | null; matches: SignerInfo[] } {
  if (roles.length === 0 || recipients.length === 0) {
    return { suggested: null, matches: [] };
  }

  const requestedRoles = new Set<RequestUserRoles>(roles);
  const matches = recipients.filter(r => requestedRoles.has(r.role));

  if (matches.length === 0) {
    return { suggested: null, matches: [] };
  }

  const allRoles = Object.values(RequestUserRoles) as RequestUserRoles[];
  const priorityOrder: RequestUserRoles[] = [
    ...SIGNER_ROLE_PRIORITY,
    ...allRoles.filter(r => !SIGNER_ROLE_PRIORITY.includes(r)),
  ];

  let suggested: SignerInfo | null = null;
  for (const role of priorityOrder) {
    const candidate = matches.find(r => r.role === role);
    if (candidate) {
      suggested = candidate;
      break;
    }
  }

  return { suggested, matches };
}
