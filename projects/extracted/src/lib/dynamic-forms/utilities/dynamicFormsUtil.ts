import Parser from 'css-simple-parser';

import {
  ComparisonOperators,
  DynamicForm,
  DynamicFormData,
  DynamicFormField,
  DynamicFormFieldTypes,
  DynamicFormSection,
  FormModes,
} from '../models/dynamic-forms.models';
import {
  getDefaultFieldNames,
  resetValueForField,
} from '../models/fields.models';

function setDataRecursively(
  target: DynamicFormField<unknown> | DynamicFormSection,
  fieldName: string,
  value: unknown
) {
  if (isDynamicFormSection(target)) {
    const castedSection = target as DynamicFormSection;
    for (const newTarget of castedSection.fields) {
      setDataRecursively(newTarget, fieldName, value);
    }
  } else {
    const castedField = target as DynamicFormField<unknown>;

    if (
      castedField.name === fieldName &&
      typeof castedField.value === typeof value
    ) {
      castedField.value = value;
    }
  }
}

function fetchDataRecursively(
  data: DynamicFormData,
  target: DynamicFormField<unknown> | DynamicFormSection
): DynamicFormData {
  if (isDynamicFormSection(target)) {
    const castedSection = target as DynamicFormSection;
    for (const newTarget of castedSection.fields) {
      data = fetchDataRecursively(data, newTarget);
    }
  } else {
    const castedField = target as DynamicFormField<unknown>;
    if (castedField.fieldType !== DynamicFormFieldTypes.NOTE) {
      data[castedField.name] = castedField.value;
    }
  }

  return data;
}

export function fetchFieldNamesRecursively(
  target:
    | DynamicFormField<unknown>
    | DynamicFormSection
    | Array<DynamicFormField<unknown> | DynamicFormSection>
): string[] {
  let fields: string[] = [];

  if (Array.isArray(target)) {
    for (const child of target as Array<
      DynamicFormField | DynamicFormSection
    >) {
      fields = fields.concat(fetchFieldNamesRecursively(child));
    }
  } else {
    if (isDynamicFormSection(target)) {
      const castedSection = target as DynamicFormSection;

      for (const child of castedSection.fields) {
        fields = fields.concat(fetchFieldNamesRecursively(child));
      }
    } else {
      const castedField = target as DynamicFormField<unknown>;

      fields.push(...getDefaultFieldNames(castedField));
    }
  }

  return fields;
}

export function fetchPrefillQueryKeys(
  target: DynamicFormField<unknown> | DynamicFormSection | Array<DynamicFormField<unknown> | DynamicFormSection>
): string[] {
  let keys: string[] = [];
  if (Array.isArray(target)) {
    for (const child of target as Array<DynamicFormField | DynamicFormSection>) {
      keys = keys.concat(fetchPrefillQueryKeys(child));
    }
  } else if (isDynamicFormSection(target)) {
    const section = target as DynamicFormSection;
    for (const child of section.fields) {
      keys = keys.concat(fetchPrefillQueryKeys(child));
    }
  } else {
    const field = target as DynamicFormField<unknown>;
    if (field.prefillable === true) {
      const prefillKey = getPrefillKey(field);
      if (prefillKey) {
        const defaultNames = getDefaultFieldNames(field);
        keys.push(prefillKey, ...defaultNames.slice(1));
      }
    }
  }
  return keys;
}

export function fetchFieldsRecursively(
  target:
    | DynamicFormField<unknown>
    | DynamicFormSection
    | Array<DynamicFormField<unknown> | DynamicFormSection>
): DynamicFormField<unknown>[] {
  let fields: DynamicFormField<unknown>[] = [];

  if (Array.isArray(target)) {
    for (const child of target as Array<
      DynamicFormField<unknown> | DynamicFormSection
    >) {
      fields = fields.concat(fetchFieldsRecursively(child));
    }
  } else {
    if (isDynamicFormSection(target)) {
      const castedSection = target as DynamicFormSection;

      for (const child of castedSection.fields) {
        fields = fields.concat(fetchFieldsRecursively(child));
      }
    } else {
      const castedField = target as DynamicFormField<unknown>;

      fields.push(castedField);
    }
  }

  return fields;
}

export function fetchSectionsRecursively(
  target:
    | DynamicFormField<unknown>
    | DynamicFormSection
    | Array<DynamicFormField<unknown> | DynamicFormSection>
): DynamicFormSection[] {
  let sections: DynamicFormSection[] = [];

  if (Array.isArray(target)) {
    for (const child of target as Array<
      DynamicFormField<unknown> | DynamicFormSection
    >) {
      sections = sections.concat(fetchSectionsRecursively(child));
    }
  } else {
    if (isDynamicFormSection(target)) {
      const castedSection = target as DynamicFormSection;
      sections = sections.concat(
        castedSection,
        fetchSectionsRecursively(castedSection.fields)
      );
    }
  }

  return sections;
}

export function isDynamicFormSection(
  element: DynamicFormSection | DynamicFormField<unknown>
): boolean {
  return !Object.keys(element).includes('fieldType');
}

export function setField(
  form: DynamicForm,
  fieldName: string,
  value: unknown
): DynamicForm {
  for (const target of form.formDefinition) {
    setDataRecursively(target, fieldName, value);
  }

  return form;
}

export function getFields(form: DynamicForm): DynamicFormData {
  let data: DynamicFormData = {};

  for (const target of form.formDefinition) {
    data = fetchDataRecursively(data, target);
  }

  return data;
}

export function removeAllValues(form: DynamicForm): DynamicForm {
  return {
    ...form,
    data: {},
    formDefinition: removeValuesFromFormDefinition(
      form.formDefinition as Array<
        DynamicFormField<unknown> | DynamicFormSection
      >
    ),
  };
}

function removeValuesFromFormDefinition(
  formDefinition: Array<DynamicFormField<unknown> | DynamicFormSection>
): Array<DynamicFormField<unknown> | DynamicFormSection> {
  return formDefinition.map(element => {
    if (isDynamicFormSection(element)) {
      const section = element as DynamicFormSection;
      return {
        ...section,
        touched: undefined,
        valid: undefined,
        fields: removeValuesFromFormDefinition(
          section.fields as Array<
            DynamicFormField<unknown> | DynamicFormSection
          >
        ),
      };
    } else {
      const field = element as DynamicFormField<unknown>;
      return {
        ...field,
        touched: undefined,
        valid: undefined,
        value: resetValueForField(field),
      };
    }
  });
}

export function getFieldsFromFormDefinition(
  formDefinition: Array<DynamicFormField | DynamicFormSection>
): DynamicFormData {
  let data: DynamicFormData = {};

  for (const target of formDefinition) {
    data = fetchDataRecursively(data, target);
  }

  return data;
}

export function fetchFieldsByType(
  target:
    | DynamicFormField<unknown>
    | DynamicFormSection
    | Array<DynamicFormField | DynamicFormSection>,
  fieldType: DynamicFormFieldTypes
): DynamicFormField<unknown>[] {
  let fields: DynamicFormField<unknown>[] = [];

  if (Array.isArray(target)) {
    for (const child of target as Array<
      DynamicFormField | DynamicFormSection
    >) {
      fields = fields.concat(fetchFieldsByType(child, fieldType));
    }
  } else {
    if (isDynamicFormSection(target)) {
      const castedSection = target as DynamicFormSection;

      for (const child of castedSection.fields) {
        fields = fields.concat(fetchFieldsByType(child, fieldType));
      }
    } else {
      const castedField = target as DynamicFormField<unknown>;
      if (castedField.fieldType === fieldType) {
        fields.push(castedField);
      }
    }
  }

  return fields;
}

export function getNewFieldName(
  formDefinition: Array<DynamicFormField | DynamicFormSection>
): string {
  const data = getFieldsFromFormDefinition(formDefinition);
  const newFields = Object.keys(data).filter(key => key.startsWith('newField'));
  const newFieldsNumber = newFields.map(value => {
    const truncatedValue = value.replace('newField', '');
    try {
      return parseInt(truncatedValue);
    } catch {
      return 0;
    }
  });

  if (newFieldsNumber.length === 0) {
    return 'newField1';
  }

  const nextNumber = Math.max(...newFieldsNumber) + 1;

  return `newField${nextNumber}`;
}

export function elementShouldDisplay(
  element: DynamicFormSection | DynamicFormField<unknown>,
  data: DynamicFormData,
  mode: FormModes,
  fieldValidity?: Record<string, string | undefined>
): boolean {
  if (mode === 'edit') {
    return true;
  }

  if (element.dependsOn) {
    if (element.dependsOn.operation === ComparisonOperators.NONE) {
      return true;
    }

    const operator: ComparisonOperators = element.dependsOn.operation;

    if (
      operator === ComparisonOperators.IS_VALID ||
      operator === ComparisonOperators.IS_NOT_VALID
    ) {
      if (
        !fieldValidity ||
        !(element.dependsOn.field in fieldValidity)
      ) {
        return false;
      }
      const errorKey = fieldValidity[element.dependsOn.field];
      if (operator === ComparisonOperators.IS_VALID) {
        return errorKey === undefined;
      }
      if (element.dependsOn.value === '__ALL_ERRORS__') {
        return errorKey !== undefined;
      }
      if (element.dependsOn.value) {
        return errorKey === element.dependsOn.value;
      }
      return errorKey !== undefined && errorKey !== 'REQUIRED';
    }

    const fieldValue = data[element.dependsOn.field] ?? undefined;
    const comparisonValue: unknown = element.dependsOn.value;

    if (fieldValue === undefined || fieldValue === null || !operator || !comparisonValue) {
      return false;
    }

    const fieldValueStr = String(fieldValue);
    const castedComparisonValue = comparisonValue as typeof fieldValue;

    switch (operator) {
      case ComparisonOperators.EQUAL:
        return fieldValueStr === String(comparisonValue);
      case ComparisonOperators.NOT_EQUAL:
        return fieldValueStr !== String(comparisonValue);
      case ComparisonOperators.IN:
        return (comparisonValue as string).split(',').includes(fieldValueStr);
      case ComparisonOperators.NOT_IN:
        return !(comparisonValue as string).split(',').includes(fieldValueStr);
      case ComparisonOperators.GREATER_THAN:
        // TODO: If string or array, check length
        return fieldValue > castedComparisonValue;
      case ComparisonOperators.GREATER_THAN_OR_EQUAL:
        return fieldValue >= castedComparisonValue;
      case ComparisonOperators.LESS_THAN:
        return fieldValue < castedComparisonValue;
      case ComparisonOperators.LESS_THAN_OR_EQUAL:
        return fieldValue <= castedComparisonValue;
      case ComparisonOperators.BETWEEN: {
        const parts = (comparisonValue as string)
          .split(',')
          .map(value => parseFloat(value.trim()));

        const min = parts[0];
        const max = parts[1];
        const numericFieldValue = parseFloat(fieldValue as string);

        return (
          min !== undefined &&
          max !== undefined &&
          !isNaN(min) &&
          !isNaN(max) &&
          !isNaN(numericFieldValue) &&
          numericFieldValue >= min &&
          numericFieldValue <= max
        );
      }
      default:
        throw new Error('Unsupported comparison operator for dependsOn field.');
    }
  }

  return true;
}

// FORM CSS MANIPULATION

export type AST = CssRootNode;

export type CssRootNode = {
  parent: null;
  children: CssNode[];
};

export type CssNode = {
  parent: CssRootNode | CssNode;
  index: number;
  indexEnd: number;
  selector: string;
  selectorIndex: number;
  selectorIndexEnd: number;
  body: string;
  bodyIndex: number;
  bodyIndexEnd: number;
  children: CssNode[];
};

export function parseCustomCss(customCss: string): CssRootNode {
  return Parser.parse(customCss);
}

export function getCustomStyleString(
  selector: string,
  customCss: CssRootNode,
  minimize = true
): string {
  const style: string =
    customCss.children.find(
      child =>
        child.selector.trim().toLowerCase() === selector.trim().toLowerCase()
    )?.body ?? '';

  if (minimize) {
    return style.replace(/\s+/g, '');
  }

  return style;
}

export function getPrefillKey(field: DynamicFormField<unknown>): string | undefined {
  return field.prefillSourceKey?.trim() || undefined;
}
