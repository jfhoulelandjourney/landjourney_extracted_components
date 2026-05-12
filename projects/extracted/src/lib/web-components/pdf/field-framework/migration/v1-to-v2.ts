import { FIELD_DATA_SCHEMA_VERSION } from '../constants';
import type { V2FieldData } from '../plugins/field-plugin';
import type { SigneeInfo, SignerInfo } from '../types/field-data';
import type { SignatureInstantJSON } from '../types/instant-json';
import { isV2Custom } from '../utils/custom-data-guards';

/**
 * v1 customData shape — defensive type capturing only the fields the migration
 * reads. v1's full union (`AnnotationData` in `signature/annotation.types.ts`)
 * carries more fields, but the migration only consumes a subset.
 *
 * @internal
 */
export interface V1FieldCustomData {
  readonly type: 'name' | 'signature' | 'initials' | 'date' | 'custom';
  readonly readonly?: boolean;
  readonly filled?: boolean;
  readonly signee?: SigneeInfo | null;
  readonly signer?: SignerInfo | null;
}

const V1_FIELD_TYPES: ReadonlySet<string> = new Set([
  'name',
  'signature',
  'initials',
  'date',
  'custom',
]);

/**
 * Narrows `unknown` customData to v1 shape. Symmetric with `isV2Custom`.
 *
 * v1 is identified by:
 * - presence of a `type` field whose value is one of the five v1 types
 * - absence of the v2 `schemaVersion === 2` discriminator
 *
 * Defensive: returns false for missing/malformed customData, label
 * TextAnnotations (no `type` field), or v2-shaped customData.
 */
export function isV1Custom(cd: unknown): cd is V1FieldCustomData {
  if (typeof cd !== 'object' || cd === null) return false;
  if (!('type' in cd) || typeof cd.type !== 'string') return false;
  if (!V1_FIELD_TYPES.has(cd.type)) return false;
  if (
    'schemaVersion' in cd &&
    cd.schemaVersion === FIELD_DATA_SCHEMA_VERSION
  ) {
    return false;
  }
  return true;
}

type AnnotationEntry = SignatureInstantJSON['annotations'][number];

/**
 * Migrate one widget annotation from v1 customData shape to v2.
 *
 * Idempotent: already-v2 annotations are returned unchanged. Defensive:
 * annotations whose `customData` doesn't match either shape (missing,
 * malformed, label TextAnnotations) are returned unchanged.
 *
 * Mapping (v1 → v2):
 * - `type` → unchanged (the four production types: name, signature, initials, date)
 * - `signee` (full `SigneeInfo`) → `{id, name, roles}` (drop email/phone/image)
 * - `signer` → unchanged shape
 * - `readonly` → unchanged (default false)
 * - `filled` → mirrored to both `filled` and `filledByUser` (v1's filled was always user-driven)
 * - (added) `required: false` — v1 had no required concept
 * - (added) `schemaVersion: 2` — the v2 discriminator
 * - All other v1 fields (`name`, `initials`, `date`, `customRendering`, `filledAt`,
 *   `filledBy`, `visible`, `isTemplate`, `width`, `height`, `createdAt`) — dropped
 *
 * The v1 `custom` type has no v2 equivalent and is left unchanged; the v2
 * dispatcher's "no plugin" branch handles it gracefully.
 */
export function migrateV1Annotation(ann: AnnotationEntry): AnnotationEntry {
  const cd: unknown = ann.customData;

  if (isV2Custom(cd)) return ann;
  if (!isV1Custom(cd)) return ann;
  if (cd.type === 'custom') return ann;

  const common = {
    schemaVersion: FIELD_DATA_SCHEMA_VERSION,
    signee: cd.signee
      ? {
          id: cd.signee.id,
          name: cd.signee.name,
          roles: [...(cd.signee.roles ?? [])],
        }
      : null,
    signer: cd.signer ?? null,
    filled: cd.filled ?? false,
    filledByUser: cd.filled ?? false,
    readonly: cd.readonly ?? false,
    required: false,
  } as const;

  let v2: V2FieldData;
  switch (cd.type) {
    case 'signature':
      v2 = { ...common, type: 'signature' };
      break;
    case 'initials':
      v2 = { ...common, type: 'initials' };
      break;
    case 'date':
      v2 = { ...common, type: 'date' };
      break;
    case 'name':
      v2 = { ...common, type: 'name' };
      break;
    default: {
      // Compile-time exhaustiveness check: if a new v1 type is added to
      // `V1_FIELD_TYPES` without a case here, TypeScript fails the build.
      const _exhaustive: never = cd.type;
      return _exhaustive;
    }
  }

  return { ...ann, customData: v2 };
}

/**
 * Migrate an entire `SignatureInstantJSON` blob. Pure, idempotent, fast.
 * Form fields and form-field values are returned unchanged — no v1↔v2
 * differences in those structures.
 */
export function migrateV1InstantJson(
  json: SignatureInstantJSON
): SignatureInstantJSON {
  return {
    ...json,
    annotations: json.annotations.map(migrateV1Annotation),
  };
}
