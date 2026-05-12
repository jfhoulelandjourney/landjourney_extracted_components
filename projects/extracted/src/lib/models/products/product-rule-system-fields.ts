import {
  FieldTypes,
  type Field,
} from '../../services/products/fields/fields.models';

export const SCORECARD_TOTAL_RULE_FIELD_ID =
  'c4a8f0e2-9b3d-4f1a-8c7e-2d6a9f5e1b0c';

export function isScorecardTotalRuleFieldId(
  fieldId: string | undefined | null
): boolean {
  return fieldId === SCORECARD_TOTAL_RULE_FIELD_ID;
}

export function scorecardTotalRuleField(): Field {
  return {
    id: SCORECARD_TOTAL_RULE_FIELD_ID,
    name: 'scorecardTotal',
    label: 'Scorecard (total)',
    isSystem: true,
    fieldType: FieldTypes.NUMBER,
    parameters: {},
    regulations: {},
    disabled: false,
    isDeleted: false,
    version: 1,
  };
}
