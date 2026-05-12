import type { RequestUserRoles } from '../../../models/requestModels';
import type { SigneeInfo, SignerInfo } from './types/field-data';

/**
 * Discriminated union describing how the signature inspector's assignment
 * section should behave for a given host flow.
 *
 * - `kind: 'signees'`    — template-builder flow. Renders a single-select of
 *                          template signees written to `customData.signee`.
 *                          The optional `onSigneeCreate` handler enables an
 *                          inline "+ Add new signee" form in the inspector.
 * - `kind: 'recipients'` — request-builder flow. Renders a single-select of
 *                          concrete signers written to `customData.signer`.
 */
export type AssignmentMode =
  | {
      readonly kind: 'signees';
      readonly signees: readonly SigneeInfo[];
      readonly onSigneeCreate?: (request: {
        readonly name: string;
        readonly roles: readonly RequestUserRoles[];
      }) => Promise<SigneeInfo>;
    }
  | { readonly kind: 'recipients'; readonly recipients: readonly SignerInfo[] };
