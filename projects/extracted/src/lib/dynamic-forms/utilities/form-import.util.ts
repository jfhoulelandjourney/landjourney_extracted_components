import { getUUID4 } from '../../utils/stringUtil';
import type {
  DynamicFormField,
  DynamicFormSection,
} from '../models/dynamic-forms.models';

function isFormDefinitionSection(
  element: DynamicFormField<unknown> | DynamicFormSection
): element is DynamicFormSection {
  return !Object.keys(element).includes('fieldType');
}

export function cloneFormDefinitionItems(
  items: Array<DynamicFormField<unknown> | DynamicFormSection>
): Array<DynamicFormField<unknown> | DynamicFormSection> {
  return items.map(item => {
    if (isFormDefinitionSection(item)) {
      const section = item as DynamicFormSection;
      return {
        ...section,
        id: getUUID4(),
        fields: cloneFormDefinitionItems(section.fields),
      };
    }
    return { ...item, id: getUUID4() } as DynamicFormField<unknown>;
  });
}
