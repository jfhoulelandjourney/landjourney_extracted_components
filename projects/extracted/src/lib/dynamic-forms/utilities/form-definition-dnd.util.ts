import type {
  DynamicFormField,
  DynamicFormSection,
} from '../models/dynamic-forms.models';
import { isDynamicFormSection } from './dynamicFormsUtil';

export function parseSectionColumnDropListId(id: string): {
  sectionId: string;
  column: number;
} | null {
  const suffix = '-column-';
  const prefix = 'section-';
  if (!id.startsWith(prefix)) {
    return null;
  }
  const columnIdx = id.lastIndexOf(suffix);
  if (columnIdx < prefix.length) {
    return null;
  }
  const sectionId = id.slice(prefix.length, columnIdx);
  const columnStr = id.slice(columnIdx + suffix.length);
  const column = Number(columnStr);
  if (Number.isNaN(column)) {
    return null;
  }
  return { sectionId, column };
}

export function findSectionByIdInFormDefinition(
  roots: Array<DynamicFormField<unknown> | DynamicFormSection>,
  sectionId: string
): DynamicFormSection | null {
  for (const el of roots) {
    if (isDynamicFormSection(el)) {
      const sec = el as DynamicFormSection;
      if (sec.id === sectionId) {
        return sec;
      }
      const nested = findSectionByIdInFormDefinition(
        sec.fields as Array<DynamicFormField<unknown> | DynamicFormSection>,
        sectionId
      );
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function removeItemFromFormDefinitionTree(
  roots: Array<DynamicFormField<unknown> | DynamicFormSection>,
  item: DynamicFormField<unknown> | DynamicFormSection
): boolean {
  const idx = roots.findIndex(x => x === item);
  if (idx >= 0) {
    roots.splice(idx, 1);
    return true;
  }
  for (const el of roots) {
    if (isDynamicFormSection(el)) {
      const sec = el as DynamicFormSection;
      if (
        removeItemFromFormDefinitionTree(
          sec.fields as Array<DynamicFormField<unknown> | DynamicFormSection>,
          item
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

export function computeInsertIndexInSectionFields(
  section: DynamicFormSection,
  column: number,
  insertPositionInColumn: number
): number {
  const columnFields = section.fields.filter(
    element => (element.column ?? 0) === column
  );
  const insertPosition = Math.min(insertPositionInColumn, columnFields.length);
  let actualIndex = section.fields.length;
  let columnCount = 0;

  for (let i = 0; i < section.fields.length; i++) {
    const field = section.fields[i];
    if (field !== undefined && (field.column ?? 0) === column) {
      if (columnCount === insertPosition) {
        actualIndex = i;
        break;
      }
      columnCount++;
    }
  }

  return actualIndex;
}
