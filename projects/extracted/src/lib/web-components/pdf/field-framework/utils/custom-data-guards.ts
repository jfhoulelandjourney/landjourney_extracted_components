import { FIELD_DATA_SCHEMA_VERSION } from '../constants';
import type { V2FieldData } from '../plugins/field-plugin';

/**
 * Union of all v2 field data types. Auto-derived from FIELD_PLUGINS in field-plugin.ts.
 * The isV2Custom guard narrows unknown customData to this type; concrete inspectors
 * and overlays narrow further via the `type` discriminant.
 */
export type { V2FieldData };

/**
 * Narrows `unknown` `customData` to v2-shaped `FieldData`.
 *
 * The `schemaVersion === 2` check is the canonical v1↔v2 discriminator and
 * is the single place that performs this narrowing — every bridge / overlay
 * dispatch goes through this guard.
 *
 * @param cd - Untyped customData (typically `WidgetAnnotation.customData`)
 * @returns true if `cd` is v2-shaped
 */
export function isV2Custom(cd: unknown): cd is V2FieldData {
  return (
    typeof cd === 'object' &&
    cd !== null &&
    'schemaVersion' in cd &&
    cd.schemaVersion === FIELD_DATA_SCHEMA_VERSION
  );
}
