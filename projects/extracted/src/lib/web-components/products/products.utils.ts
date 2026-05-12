import {
  type DynamicForm,
  type DynamicFormData,
} from '../../dynamic-forms/models/dynamic-forms.models';
import {
  ConditionEnum,
  InterestRateTypeEnum,
  OperatorEnum,
  ProductDisplay,
  ProductRule,
  ProductRuleCategoryDisplay,
  ProductRuleDisplay,
  ProductSectionDisplay,
  QualifyingEnum,
  RuleTypeKeyEnum,
  type CriteriaRule,
  type InterestRateStep,
  type Product,
  type Program,
  type ScoreCardCriteria,
} from '../../models/products/products.model';
import { RequestUserRoles } from '../../models/requestModels';
import {
  isScorecardTotalRuleFieldId,
  scorecardTotalRuleField,
} from '../../models/products/product-rule-system-fields';
import {
  FieldTypes,
  type Field,
} from '../../services/products/fields/fields.models';
import { formatAmountFromCents } from '../../utils/numberUtil';
import { readableDateFromTimestamp } from '../../utils/timeUtil';

const SIMULATOR_ASSIGNEE_ID = '__lj_simulator__';

const RULE_TYPES_FOR_PROGRAM_PRODUCT = (
  Object.values(RuleTypeKeyEnum) as RuleTypeKeyEnum[]
).filter(rt => rt !== RuleTypeKeyEnum.LIBRARY_RULES);

export type DynamicFormWithAssignee = {
  dynamicForm: DynamicForm;
  assigneeId: string;
  userRole?: RequestUserRoles;
};

export type ProductRuleEvaluationContext = {
  scorecardCriteria: ScoreCardCriteria[];
};

export function ruleAppliesToParticipantRoles(
  rule: ProductRule,
  participantRoles: RequestUserRoles[] | undefined
): boolean {
  if (participantRoles === undefined) {
    return true;
  }
  const appliesTo = rule.appliesTo;
  if (!appliesTo?.length) {
    return true;
  }
  return appliesTo.some(role => participantRoles.includes(role));
}

function filterFormsForRuleApplicability(
  rule: ProductRule,
  forms: DynamicFormWithAssignee[]
): DynamicFormWithAssignee[] {
  const appliesTo = rule.appliesTo;
  if (!appliesTo?.length) {
    return forms;
  }
  return forms.filter(
    item => item.userRole !== undefined && appliesTo.includes(item.userRole)
  );
}

function mergeDynamicFormsForRuleEvaluation(
  relevantForms: DynamicFormWithAssignee[]
): DynamicForm | undefined {
  const firstEntry = relevantForms[0];
  if (!firstEntry) {
    return undefined;
  }
  const firstForm = firstEntry.dynamicForm;
  const mergedData: DynamicFormData = { ...(firstForm.data ?? {}) };
  for (const { dynamicForm } of relevantForms.slice(1)) {
    Object.assign(mergedData, dynamicForm.data ?? {});
  }
  return {
    ...firstForm,
    data: mergedData,
  };
}

export function calculateQualifyingStatusFromRulesStatuses(
  ruleStatuses: QualifyingEnum[]
): QualifyingEnum {
  if (ruleStatuses.length === 0) {
    return QualifyingEnum.QUALIFYING;
  }

  const hasNotQualifying = ruleStatuses.some(
    status => status === QualifyingEnum.NOT_QUALIFYING
  );
  if (hasNotQualifying) {
    return QualifyingEnum.NOT_QUALIFYING;
  }

  const hasMissing = ruleStatuses.some(
    status => status === QualifyingEnum.MISSING
  );
  if (hasMissing) {
    return QualifyingEnum.MISSING;
  }

  return QualifyingEnum.QUALIFYING;
}

/**
 * Calculates the eligibility status of a product based on its rules and program rules
 * A product is eligible if all its eligibility rules are eligible
 *
 * @param product - The product to evaluate
 * @param selectedUserIds - Array of selected user IDs
 * @param dynamicFormsWithAssigneeId - Dynamic forms with their assignee IDs
 * @param fields - Available fields for field name lookup
 * @returns The eligibility status of the product
 */
export function calculateQualifyingStatusFromRules(
  rules: ProductRule[],
  selectedUserIds: string[],
  dynamicFormsWithAssigneeId: DynamicFormWithAssignee[],
  fields: Field[],
  ruleEvaluationContext?: ProductRuleEvaluationContext
): QualifyingEnum {
  // If no rules, return qualifying
  if (rules.length === 0) {
    return QualifyingEnum.QUALIFYING;
  }

  // Calculate status for each rule
  const ruleStatuses: QualifyingEnum[] = rules.map(rule => {
    const status = calculateQualifyingRuleStatus(
      rule,
      selectedUserIds,
      dynamicFormsWithAssigneeId,
      fields,
      ruleEvaluationContext
    );
    return status.qualifying;
  });

  const hasNotQualifying = ruleStatuses.some(
    status => status === QualifyingEnum.NOT_QUALIFYING
  );
  if (hasNotQualifying) {
    return QualifyingEnum.NOT_QUALIFYING;
  }

  const hasMissing = ruleStatuses.some(
    status => status === QualifyingEnum.MISSING
  );
  if (hasMissing) {
    return QualifyingEnum.MISSING;
  }

  // All rules are qualifying
  return QualifyingEnum.QUALIFYING;
}

/**
 * Calculates the eligibility status of a rule based on dynamic form data
 *
 * @param rule - The eligibility rule to evaluate
 * @param selectedUserIds - Array of selected user IDs
 * @param dynamicFormsWithAssigneeId - Dynamic forms with their assignee IDs
 * @returns The eligibility status of the rule
 */
export function calculateQualifyingRuleStatus(
  rule: ProductRule,
  selectedUserIds: string[],
  dynamicFormsWithAssigneeId: DynamicFormWithAssignee[],
  fields: Field[],
  ruleEvaluationContext?: ProductRuleEvaluationContext
): {
  qualifying: QualifyingEnum;
  fieldValue: unknown;
} {
  const relevantForms = dynamicFormsWithAssigneeId.filter(item =>
    selectedUserIds.includes(item.assigneeId)
  );

  if (relevantForms.length === 0) {
    return {
      qualifying: QualifyingEnum.MISSING,
      fieldValue: '',
    };
  }

  const formsForRule = filterFormsForRuleApplicability(rule, relevantForms);

  if (formsForRule.length === 0) {
    return {
      qualifying: QualifyingEnum.MISSING,
      fieldValue: '',
    };
  }

  if (isScorecardTotalRuleFieldId(rule.fieldId)) {
    const merged = mergeDynamicFormsForRuleEvaluation(formsForRule);
    const criteria = ruleEvaluationContext?.scorecardCriteria ?? [];
    const score = calculateScorecardValue(criteria, fields, merged);
    const syntheticField = scorecardTotalRuleField();
    const qualifying = evaluateRuleValidation(rule, score);
    return {
      qualifying,
      fieldValue: formatDisplayValue(score, syntheticField),
    };
  }

  const field = fields.find(f => f.id === rule.fieldId);

  let fieldValues: unknown = '';
  for (const { dynamicForm } of formsForRule) {
    const value = dynamicForm.data?.[field?.name ?? ''];

    if (value) {
      const displayValue = formatDisplayValue(value, field);
      if (fieldValues === '') {
        fieldValues = displayValue;
      } else {
        fieldValues = `${fieldValues} / ${displayValue}`;
      }
    }
  }

  let hasAtLeastOneValidValue = false;
  let hasAtLeastOneValue = false;

  for (const { dynamicForm } of formsForRule) {
    const fieldValue = dynamicForm.data?.[field?.name ?? ''];

    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      continue;
    }

    hasAtLeastOneValue = true;

    const ruleStatus = evaluateRuleValidation(rule, fieldValue);

    if (ruleStatus === QualifyingEnum.NOT_QUALIFYING) {
      return {
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        fieldValue: fieldValues,
      };
    } else if (ruleStatus === QualifyingEnum.QUALIFYING) {
      hasAtLeastOneValidValue = true;
      break;
    }
  }

  if (hasAtLeastOneValidValue) {
    return {
      qualifying: QualifyingEnum.QUALIFYING,
      fieldValue: fieldValues,
    };
  }

  if (hasAtLeastOneValue) {
    return {
      qualifying: QualifyingEnum.MISSING,
      fieldValue: fieldValues,
    };
  }

  return {
    qualifying: QualifyingEnum.MISSING,
    fieldValue: fieldValues,
  };
}

/**
 * Evaluates a rule's validation against a field value
 */
function evaluateRuleValidation(
  rule: ProductRule,
  fieldValue: unknown
): QualifyingEnum {
  // Manual validation: if value exists, it's qualifying
  if (rule.validationOptions?.validationType === 'manual') {
    return QualifyingEnum.QUALIFYING;
  }

  // Filled validation: field must exist and not be null, undefined, or empty string when trimmed
  if (rule.validationOptions?.validationType === 'filled') {
    if (
      fieldValue !== null &&
      fieldValue !== undefined &&
      (typeof fieldValue !== 'string' ||
        (typeof fieldValue === 'string' && fieldValue.trim() !== ''))
    ) {
      return QualifyingEnum.QUALIFYING;
    }
    return QualifyingEnum.NOT_QUALIFYING;
  }

  // Regex validation
  if (
    rule.validationOptions?.validationType === 'regex' &&
    rule.validationOptions.value
  ) {
    try {
      const regex = new RegExp(rule.validationOptions.value);
      const valueStr = String(fieldValue);

      if (regex.test(valueStr)) {
        return QualifyingEnum.QUALIFYING;
      } else {
        return QualifyingEnum.NOT_QUALIFYING;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return QualifyingEnum.MISSING;
    }
  }

  // Value comparison validation
  if (
    rule.validationOptions?.validationType === 'value_comparison' &&
    rule.validationOptions.operator &&
    rule.validationOptions.value !== undefined
  ) {
    const result = compareValues(
      fieldValue,
      rule.validationOptions.operator,
      rule.validationOptions.value
    );

    if (result) {
      return QualifyingEnum.QUALIFYING;
    } else {
      return QualifyingEnum.NOT_QUALIFYING;
    }
  }

  // No validation specified or validation not recognized
  return QualifyingEnum.MISSING;
}

/**
 * Compares a field value against a comparison value using an operator
 */
function compareValues(
  fieldValue: unknown,
  operator: OperatorEnum,
  comparisonValue: string
): boolean {
  // Convert values to numbers if possible
  const numFieldValue = Number(fieldValue);
  const numComparisonValue = Number(comparisonValue);

  // If both are valid numbers, use numeric comparison
  if (!isNaN(numFieldValue) && !isNaN(numComparisonValue)) {
    switch (operator) {
      case OperatorEnum.GREATER_THAN:
        return numFieldValue > numComparisonValue;
      case OperatorEnum.GREATER_THAN_OR_EQUAL_TO:
        return numFieldValue >= numComparisonValue;
      case OperatorEnum.LESS_THAN:
        return numFieldValue < numComparisonValue;
      case OperatorEnum.LESS_THAN_OR_EQUAL_TO:
        return numFieldValue <= numComparisonValue;
      case OperatorEnum.EQUAL:
        return numFieldValue === numComparisonValue;
      case OperatorEnum.NOT_EQUAL:
        return numFieldValue !== numComparisonValue;
      default:
        return false;
    }
  }

  // String comparison fallback
  const strFieldValue = String(fieldValue);
  const strComparisonValue = String(comparisonValue);

  switch (operator) {
    case OperatorEnum.EQUAL:
      return strFieldValue === strComparisonValue;
    case OperatorEnum.NOT_EQUAL:
      return strFieldValue !== strComparisonValue;
    default:
      return false;
  }
}

/**
 * Formats a single interest rate step to a display string
 * @param step - The interest rate step to format
 * @returns Formatted rate string (e.g., "25.00%") or empty string
 */
export function rateDisplay(step: {
  interestRateType: InterestRateTypeEnum;
  rateValue: number;
}): string {
  // rateValue is stored as decimal (0.25 = 25%), convert to percentage
  const percentage = (step.rateValue * 100).toFixed(2);
  if (
    step.interestRateType === InterestRateTypeEnum.FIXED ||
    step.interestRateType === InterestRateTypeEnum.VARIABLE
  ) {
    return `${percentage}%`;
  }
  return '';
}

/**
 * Formats product interest rate steps to a display string
 * Handles promo rates (rates with "promo" in comments) specially:
 * - Promo rates are sorted by date and only lower rates are applied
 * - Base rates (non-promo) are applied after promo rates
 * Shows rates in chronological order (sorted by startingOn)
 * Displays first rate, first → second, or first → second → third if more than 2 steps exist
 * @param interestRateSteps - Array of interest rate steps
 * @returns Formatted rate display string (e.g., "25.00%", "25.00% → 30.00%", or "25.00% → 30.00% → 35.00%") or empty string
 */
export function calculateInterestRateStepDisplay(
  interestRateSteps: InterestRateStep[]
): string {
  if (!interestRateSteps || interestRateSteps.length === 0) {
    return '';
  }

  // Filter out invalid steps
  const validSteps = interestRateSteps.filter(step => {
    // Ensure step has required fields and valid rate value
    return (
      step &&
      step.startingOn !== undefined &&
      step.startingOn !== null &&
      step.rateValue !== undefined &&
      step.rateValue !== null &&
      !isNaN(step.rateValue) &&
      step.interestRateType !== undefined
    );
  });

  if (validSteps.length === 0) {
    return '';
  }

  // Separate promo rates from base rates
  const promoSteps: InterestRateStep[] = [];
  const baseSteps: InterestRateStep[] = [];

  for (const step of validSteps) {
    const isPromo =
      step.comments && step.comments.toLowerCase().includes('promo');
    if (isPromo) {
      promoSteps.push(step);
    } else {
      baseSteps.push(step);
    }
  }

  // Sort promo rates by startingOn (earliest first)
  promoSteps.sort((a, b) => (a.startingOn ?? 0) - (b.startingOn ?? 0));

  // Process promo rates: apply first one, then only apply subsequent ones if rate is lower
  const effectivePromoSteps: InterestRateStep[] = [];
  let currentRate: number | null = null;

  for (const promoStep of promoSteps) {
    if (currentRate === null) {
      // First promo rate - always apply
      effectivePromoSteps.push(promoStep);
      currentRate = promoStep.rateValue;
    } else if (promoStep.rateValue < currentRate) {
      // Subsequent promo rate - only apply if it's lower
      effectivePromoSteps.push(promoStep);
      currentRate = promoStep.rateValue;
    }
  }

  // Sort base rates by startingOn (earliest first)
  baseSteps.sort((a, b) => (a.startingOn ?? 0) - (b.startingOn ?? 0));

  // Combine: promo rates first, then base rates
  const finalSteps = [...effectivePromoSteps, ...baseSteps];

  if (finalSteps.length === 0) {
    return '';
  }

  // Format the rates (show up to 3)
  const rateDisplays = finalSteps
    .slice(0, 3)
    .map(step => rateDisplay(step))
    .filter(display => display !== ''); // Filter out empty displays

  if (rateDisplays.length === 0) {
    return '';
  }

  if (rateDisplays.length === 1) {
    const firstDisplay = rateDisplays[0];
    return firstDisplay ?? '';
  }

  // Join with arrows and add ellipsis if there are more than 3 steps
  const display = rateDisplays.join(' → ');
  if (finalSteps.length > 3) {
    return `${display}...`;
  }

  return display;
}

/**
 * Creates a ProductDisplay object from a Product and its associated Program
 * Calculates eligibility statuses for all rules and categories
 *
 * @param program - The program to display
 * @param product - The product to display (if any)
 * @param selectedUserIds - Array of selected user IDs for eligibility calculation
 * @param dynamicFormsWithAssigneeId - Dynamic forms with their assignee IDs
 * @param fields - Available fields for field name lookup
 * @returns ProductDisplay object with formatted data ready for display
 */

function getCategoryDisplayName(
  categoryName: string,
  regulationNames: string[] | undefined
): string {
  if (!regulationNames?.length) return categoryName;
  if (!regulationNames.includes(categoryName)) return categoryName;
  return categoryName.replace(/_/g, ' ');
}

export function getProductDisplay(
  program: Program,
  product: Product | undefined,
  selectedUserIds: string[],
  dynamicFormsWithAssigneeId: DynamicFormWithAssignee[],
  fields: Field[]
): ProductDisplay {
  // Get all rules from program and product
  const programRules = program.rules ?? [];
  const productRules = product?.rules ?? [];
  const allRules = [...programRules, ...productRules];

  // Build sections array
  const sections: ProductSectionDisplay[] = [];

  // Approval Limits section
  const approvalLimits = [
    ...(program.approvalLimits ?? []),
    ...(product?.approvalLimits ?? []),
  ];
  const approvalLimitsValue =
    approvalLimits.length > 0
      ? formatAmountFromCents(
          Math.max(...approvalLimits.map(l => (l.limit ?? 0) * 100))
        )
      : undefined;
  sections.push({
    type: 'APPROVAL_LIMITS',
    qualifying:
      approvalLimits.length > 0 &&
      approvalLimits.some(limit => (limit.limit ?? 0) > 0)
        ? QualifyingEnum.QUALIFYING
        : QualifyingEnum.MISSING,
    value: approvalLimitsValue,
  });

  // Scorecard section
  const scorecard = [
    ...(program.scoreCard ?? []),
    ...(product?.scoreCard ?? []),
  ];

  // dynamicFormFrom DynamicForms takes the first dynamic form, then in the data merges the data of the other dynamic forms
  // the data is merged by the field name
  // IMPORTANT: Create a copy to avoid mutating the original form's data
  let dynamicFormFromDynamicForms: DynamicForm | undefined = undefined;

  if (dynamicFormsWithAssigneeId.length > 0) {
    const firstForm = dynamicFormsWithAssigneeId[0]?.dynamicForm;
    if (firstForm) {
      // Create a deep copy of the form to avoid mutating the original
      const mergedData: DynamicFormData = { ...firstForm.data };
      if (dynamicFormsWithAssigneeId.length > 1) {
        for (const dynamicForm of dynamicFormsWithAssigneeId.slice(1)) {
          Object.assign(mergedData, dynamicForm.dynamicForm.data);
        }
      }
      dynamicFormFromDynamicForms = {
        ...firstForm,
        data: mergedData,
      };
    }
  }

  sections.push(
    buildScorecardSectionDisplay(
      scorecard,
      fields,
      dynamicFormFromDynamicForms
    )
  );

  // Helper function to process a rule type and return a section
  const processRuleType = (
    ruleType: RuleTypeKeyEnum
  ): ProductSectionDisplay => {
    // Filter rules by rule type
    const rulesForType = allRules.filter(rule => rule.ruleType === ruleType);

    // Group rules by category
    const categoryMap = new Map<
      string,
      { rule: ProductRule; qualifying: QualifyingEnum; fieldValue: unknown }[]
    >();

    for (const rule of rulesForType) {
      const ruleStatus = calculateQualifyingRuleStatus(
        rule,
        selectedUserIds,
        dynamicFormsWithAssigneeId,
        fields,
        { scorecardCriteria: scorecard }
      );

      const categoryName = rule.category || 'Uncategorized';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      const categoryRules = categoryMap.get(categoryName);
      if (categoryRules) {
        categoryRules.push({
          rule,
          qualifying: ruleStatus.qualifying,
          fieldValue: ruleStatus.fieldValue,
        });
      }
    }

    // Convert map to categories with rules
    const categories: ProductRuleCategoryDisplay[] = [];
    const allRuleStatuses: QualifyingEnum[] = [];

    for (const [categoryName, rulesWithStatus] of categoryMap.entries()) {
      // Calculate category qualifying from rule statuses
      const ruleStatuses = rulesWithStatus.map(r => r.qualifying);
      const categoryQualifying =
        calculateQualifyingStatusFromRulesStatuses(ruleStatuses);

      // Collect all rule statuses for overall status
      allRuleStatuses.push(...ruleStatuses);

      // Build rule displays
      const ruleDisplays: ProductRuleDisplay[] = rulesWithStatus.map(r => ({
        id: r.rule.id ?? '',
        name: r.rule.name,
        qualifying: r.qualifying,
        valueDisplay: r.fieldValue,
      }));

      const regulationNames = [
        ...(program.regulations ?? []),
        ...(product?.regulations ?? []),
      ];
      categories.push({
        id: categoryName,
        name: getCategoryDisplayName(categoryName, regulationNames),
        qualifying: categoryQualifying,
        rules: ruleDisplays,
      });
    }

    // Calculate overall status for this rule type
    const overallStatus =
      allRuleStatuses.length > 0
        ? calculateQualifyingStatusFromRulesStatuses(allRuleStatuses)
        : QualifyingEnum.MISSING;

    return {
      type: ruleType,
      qualifying: overallStatus,
      categories,
    };
  };

  // Process each rule type from RuleTypeKeyEnum
  for (const ruleType of RULE_TYPES_FOR_PROGRAM_PRODUCT) {
    sections.push(processRuleType(ruleType));
  }

  // Calculate overall product qualifying from all sections
  // If any section is NOT_QUALIFYING, overall is NOT_QUALIFYING
  // If all sections are QUALIFYING, overall is QUALIFYING
  // Otherwise (at least one MISSING but none NOT_QUALIFYING), overall is MISSING
  const allSectionQualifying = sections.map(section => section.qualifying);
  const overallQualifying =
    calculateQualifyingStatusFromRulesStatuses(allSectionQualifying);

  return {
    programName: program.name,
    productName: product?.name ?? '',
    rateDisplay: calculateInterestRateStepDisplay(
      product?.interestRateSteps ?? []
    ),
    qualifying: overallQualifying,
    wordDisplay: 'Qualifying',
    sections,
  };
}

/**
 * Creates a ProductDisplay object from a Product and its associated Program for simulator use
 * Calculates eligibility statuses using provided field values from a DynamicForm
 *
 * @param program - The program to display
 * @param product - The product to display (if any)
 * @param fields - Available fields for field name lookup
 * @param dynamicForm - The DynamicForm containing field values in its data property
 * @returns ProductDisplay object with formatted data ready for display
 */
export function getProductDisplayForSimulator(
  program: Program,
  product: Product | undefined,
  fields: Field[],
  dynamicForm: DynamicForm | undefined
): ProductDisplay {
  const programRules = program.rules ?? [];
  const productRules = product?.rules ?? [];
  const allRules = [...programRules, ...productRules];

  const sections: ProductSectionDisplay[] = [];

  const approvalLimits = [
    ...(program.approvalLimits ?? []),
    ...(product?.approvalLimits ?? []),
  ];
  const approvalLimitsValue =
    approvalLimits.length > 0
      ? formatAmountFromCents(
          Math.max(...approvalLimits.map(l => (l.limit ?? 0) * 100))
        )
      : undefined;
  sections.push({
    type: 'APPROVAL_LIMITS',
    qualifying: approvalLimitsValue
      ? QualifyingEnum.QUALIFYING
      : QualifyingEnum.MISSING,
    value: approvalLimitsValue,
  });

  const scorecard = [
    ...(program.scoreCard ?? []),
    ...(product?.scoreCard ?? []),
  ];
  sections.push(buildScorecardSectionDisplay(scorecard, fields, dynamicForm));

  const simulatorForms: DynamicFormWithAssignee[] = dynamicForm
    ? [
        {
          dynamicForm,
          assigneeId: SIMULATOR_ASSIGNEE_ID,
          userRole: RequestUserRoles.BORROWER,
        },
      ]
    : [];

  const processRuleType = (
    ruleType: RuleTypeKeyEnum
  ): ProductSectionDisplay => {
    const rulesForType = allRules.filter(rule => rule.ruleType === ruleType);

    const categoryMap = new Map<
      string,
      { rule: ProductRule; qualifying: QualifyingEnum; fieldValue: unknown }[]
    >();

    for (const rule of rulesForType) {
      const ruleStatus = calculateQualifyingRuleStatus(
        rule,
        [SIMULATOR_ASSIGNEE_ID],
        simulatorForms,
        fields,
        { scorecardCriteria: scorecard }
      );

      const categoryName = rule.category || 'Uncategorized';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      const categoryRules = categoryMap.get(categoryName);
      if (categoryRules) {
        categoryRules.push({
          rule,
          qualifying: ruleStatus.qualifying,
          fieldValue: ruleStatus.fieldValue,
        });
      }
    }

    // Convert map to categories with rules
    const categories: ProductRuleCategoryDisplay[] = [];
    const allRuleStatuses: QualifyingEnum[] = [];

    for (const [categoryName, rulesWithStatus] of categoryMap.entries()) {
      // Calculate category qualifying from rule statuses
      const ruleStatuses = rulesWithStatus.map(r => r.qualifying);
      const categoryQualifying =
        calculateQualifyingStatusFromRulesStatuses(ruleStatuses);

      // Collect all rule statuses for overall status
      allRuleStatuses.push(...ruleStatuses);

      // Build rule displays
      const ruleDisplays: ProductRuleDisplay[] = rulesWithStatus.map(r => ({
        id: r.rule.id ?? '',
        name: r.rule.name,
        qualifying: r.qualifying,
        valueDisplay: r.fieldValue,
      }));

      const regulationNames = [
        ...(program.regulations ?? []),
        ...(product?.regulations ?? []),
      ];
      categories.push({
        id: categoryName,
        name: getCategoryDisplayName(categoryName, regulationNames),
        qualifying: categoryQualifying,
        rules: ruleDisplays,
      });
    }

    // Calculate overall status for this rule type
    const overallStatus =
      allRuleStatuses.length > 0
        ? calculateQualifyingStatusFromRulesStatuses(allRuleStatuses)
        : QualifyingEnum.MISSING;

    return {
      type: ruleType,
      qualifying: overallStatus,
      categories,
    };
  };

  // Process each rule type from RuleTypeKeyEnum
  for (const ruleType of RULE_TYPES_FOR_PROGRAM_PRODUCT) {
    sections.push(processRuleType(ruleType));
  }

  // Calculate overall product qualifying from all sections
  // If any section is NOT_QUALIFYING, overall is NOT_QUALIFYING
  // If all sections are QUALIFYING, overall is QUALIFYING
  // Otherwise (at least one MISSING but none NOT_QUALIFYING), overall is MISSING
  const allSectionQualifying = sections.map(section => section.qualifying);
  const overallQualifying =
    calculateQualifyingStatusFromRulesStatuses(allSectionQualifying);

  return {
    programName: program.name,
    productName: product?.name ?? '',
    rateDisplay: calculateInterestRateStepDisplay(
      product?.interestRateSteps ?? []
    ),
    qualifying: overallQualifying,
    wordDisplay: 'Qualifying',
    sections,
  };
}

/**
 * Builds a ProductDisplay for the request-products-coverage view.
 * Uses template field presence only: rules/scorecard fields in missingFieldNames
 * are marked MISSING, others QUALIFYING. Approval limits and rate come from the product.
 *
 * @param product - The product
 * @param program - The program
 * @param missingFieldNames - Field names required by the product but not in the template
 * @param idToName - Map of field id → name for rules and scorecard
 * @returns ProductDisplay for lj-product
 */
export function displayProductForCoverage(
  product: Product,
  program: Program,
  missingFieldNames: string[],
  idToName: Map<string, string>
): ProductDisplay {
  const missingSet = new Set(missingFieldNames);
  const regulationNames = product.regulations ?? [];
  const sections: ProductSectionDisplay[] = [];

  // Approval limits (product only; not template-dependent)
  const approvalLimits = [
    ...(program.approvalLimits ?? []),
    ...(product.approvalLimits ?? []),
  ];
  const approvalLimitsValue =
    approvalLimits.length > 0
      ? formatAmountFromCents(
          Math.max(...approvalLimits.map(l => (l.limit ?? 0) * 100))
        )
      : undefined;
  sections.push({
    type: 'APPROVAL_LIMITS',
    qualifying:
      approvalLimits.length > 0 &&
      approvalLimits.some(limit => (limit.limit ?? 0) > 0)
        ? QualifyingEnum.QUALIFYING
        : QualifyingEnum.MISSING,
    value: approvalLimitsValue,
  });

  const scorecard = [
    ...(program.scoreCard ?? []),
    ...(product.scoreCard ?? []),
  ] as ScoreCardCriteria[];
  let scorecardQualifying = QualifyingEnum.QUALIFYING;
  for (const c of scorecard) {
    if (!c.fieldId) continue;
    const name = idToName.get(c.fieldId);
    if (name && missingSet.has(name)) {
      scorecardQualifying = QualifyingEnum.MISSING;
      break;
    }
  }
  sections.push({
    type: 'SCORECARD',
    value: undefined,
    qualifying: scorecardQualifying,
  });

  // Rule types: build categories from product rules, qualify by field presence
  const processRuleType = (
    ruleType: RuleTypeKeyEnum
  ): ProductSectionDisplay => {
    const rulesForType = [
      ...(program.rules ?? []),
      ...(product.rules ?? []),
    ].filter(r => r.ruleType === ruleType);
    const categoryMap = new Map<
      string,
      { rule: ProductRule; qualifying: QualifyingEnum }[]
    >();

    for (const rule of rulesForType) {
      let qualifying: QualifyingEnum;
      if (isScorecardTotalRuleFieldId(rule.fieldId)) {
        qualifying = scorecardQualifying;
      } else {
        const fieldName = rule.fieldId ? idToName.get(rule.fieldId) : undefined;
        qualifying =
          fieldName && missingSet.has(fieldName)
            ? QualifyingEnum.MISSING
            : QualifyingEnum.QUALIFYING;
      }

      const categoryName = rule.category || 'Uncategorized';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      const categoryRules = categoryMap.get(categoryName);
      if (categoryRules) {
        categoryRules.push({ rule, qualifying });
      }
    }

    const categories: ProductRuleCategoryDisplay[] = [];
    const allRuleStatuses: QualifyingEnum[] = [];

    for (const [categoryName, rulesWithStatus] of categoryMap.entries()) {
      const ruleStatuses = rulesWithStatus.map(r => r.qualifying);
      const categoryQualifying =
        calculateQualifyingStatusFromRulesStatuses(ruleStatuses);
      allRuleStatuses.push(...ruleStatuses);

      const ruleDisplays: ProductRuleDisplay[] = rulesWithStatus.map(r => ({
        id: r.rule.id ?? '',
        name: r.rule.name,
        qualifying: r.qualifying,
        valueDisplay:
          r.qualifying === QualifyingEnum.MISSING ? '' : 'In template',
      }));

      categories.push({
        id: categoryName,
        name: getCategoryDisplayName(categoryName, regulationNames),
        qualifying: categoryQualifying,
        rules: ruleDisplays,
      });
    }

    const overallStatus =
      allRuleStatuses.length > 0
        ? calculateQualifyingStatusFromRulesStatuses(allRuleStatuses)
        : QualifyingEnum.MISSING;

    return { type: ruleType, qualifying: overallStatus, categories };
  };

  for (const ruleType of RULE_TYPES_FOR_PROGRAM_PRODUCT) {
    sections.push(processRuleType(ruleType));
  }

  const allSectionQualifying = sections.map(s => s.qualifying);
  const overallQualifying =
    calculateQualifyingStatusFromRulesStatuses(allSectionQualifying);

  return {
    programName: program.name,
    productName: product.name ?? '',
    rateDisplay: calculateInterestRateStepDisplay(
      product.interestRateSteps ?? []
    ),
    qualifying: overallQualifying,
    wordDisplay: 'Covered',
    sections,
  };
}

function formatDisplayValue(fieldValue: unknown, field: Field | undefined) {
  if (!field) {
    return fieldValue;
  }

  if (field.fieldType === FieldTypes.MONEY) {
    return formatAmountFromCents(Number(fieldValue) * 100);
  }

  if (field.fieldType === FieldTypes.DATE) {
    // Date values are stored as Unix timestamps in seconds
    if (typeof fieldValue === 'number') {
      return readableDateFromTimestamp(fieldValue, 'short');
    }
    // If it's already a string or other format, return as-is
    return fieldValue;
  }

  // For SELECT and RADIO fields, display the option label if available
  if (
    (field.fieldType === FieldTypes.SELECT ||
      field.fieldType === FieldTypes.RADIO) &&
    field.parameters.options
  ) {
    const option = field.parameters.options.find(
      opt => opt.value === String(fieldValue)
    );
    if (option) {
      return option.label;
    }
  }

  return fieldValue;
}

export function calculateScorecardValue(
  scorecard: ScoreCardCriteria[],
  fields: Field[],
  dynamicForm: DynamicForm | undefined
): number {
  if (!dynamicForm?.data) {
    return 0;
  }

  const fieldValues = dynamicForm.data;
  let totalPoints = 0;

  // Go through all criteria
  for (const criteria of scorecard) {
    if (!criteria.fieldId) {
      continue;
    }

    // Find the field by fieldId
    const field = fields.find(f => f.id === criteria.fieldId);
    if (!field || !field.name) {
      continue;
    }

    // Get the field value from dynamicForm
    const fieldValue = fieldValues[field.name];
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      continue;
    }

    // Evaluate each rule in the criteria
    for (const rule of criteria.rules) {
      const rulePassed = evaluateCriteriaRule(rule, fieldValue);
      if (rulePassed) {
        // Add points * weight for this criteria
        const points = rule.points ?? 0;
        const weight = criteria.weight ?? 0;
        totalPoints += points * weight;
        // Only count the first matching rule (based on typical scorecard logic)
        break;
      }
    }
  }

  return totalPoints;
}

function buildScorecardSectionDisplay(
  scorecard: ScoreCardCriteria[],
  fields: Field[],
  mergedForm: DynamicForm | undefined
): ProductSectionDisplay {
  if (scorecard.length === 0) {
    return {
      type: 'SCORECARD',
      qualifying: QualifyingEnum.MISSING,
      value: undefined,
    };
  }
  const total = calculateScorecardValue(scorecard, fields, mergedForm);
  return {
    type: 'SCORECARD',
    value: String(total),
    qualifying:
      total > 0 ? QualifyingEnum.QUALIFYING : QualifyingEnum.NOT_QUALIFYING,
  };
}

/**
 * Evaluates a CriteriaRule against a field value
 * Returns true if the rule passes, false otherwise
 */
function evaluateCriteriaRule(
  rule: CriteriaRule,
  fieldValue: unknown
): boolean {
  const condition = rule.condition ?? ConditionEnum.VALUE_COMPARISON;
  const comparisons = rule.comparisons ?? [];

  switch (condition) {
    case ConditionEnum.VALUE_COMPARISON:
      // Check if any comparison passes
      for (const comparison of comparisons) {
        const operator = comparison.operator ?? OperatorEnum.EQUAL;
        const result = compareValues(fieldValue, operator, comparison.value);
        if (result) {
          return true;
        }
      }
      return false;

    case ConditionEnum.REGEX:
      // Check if any regex comparison passes
      for (const comparison of comparisons) {
        try {
          const regex = new RegExp(comparison.value);
          const valueStr = String(fieldValue);
          if (regex.test(valueStr)) {
            return true;
          }
        } catch {
          // Invalid regex, skip
          continue;
        }
      }
      return false;

    case ConditionEnum.ELSE:
      // ELSE condition: if no other rules matched, this one passes
      // This is typically used as a fallback, so we return true
      return true;

    default:
      return false;
  }
}
