import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getUUID4 } from '../../../../utils/stringUtil';
import {
  Directions,
  DynamicFormField,
  DynamicFormFieldTypes,
  DynamicFormSection,
  SectionLayouts,
  type DependsOn,
  type DynamicFormFieldParameters,
} from '../../../models/dynamic-forms.models';
import {
  getFieldsFromFormDefinition,
  getNewFieldName,
  isDynamicFormSection,
} from '../../../utilities/dynamicFormsUtil';
import {
  computeInsertIndexInSectionFields,
  findSectionByIdInFormDefinition,
  parseSectionColumnDropListId,
  removeItemFromFormDefinitionTree,
} from '../../../utilities/form-definition-dnd.util';
import { cloneFormDefinitionItems } from '../../../utilities/form-import.util';
import { ConditionalLogicComponent } from '../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../configuration/editable-input/editable-input.component';
import { SectionConfigurationComponent } from '../configuration/section-configuration/section-configuration.component';

import { MatExpansionModule } from '@angular/material/expansion';
import {
  FieldTypes,
  type Field,
} from '../../../../services/products/fields/fields.models';
import { getDefaultValueForFieldType } from '../../../models/fields.models';
import { FieldComponent } from '../field/field.component';

@Component({
  selector: 'lj-df-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  imports: [
    FieldComponent,
    MatIconModule,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropListGroup,
    EditableInputComponent,
    SectionConfigurationComponent,
    ConditionalLogicComponent,
    MatExpansionModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionComponent {
  formDefinition = input<(DynamicFormField<unknown> | DynamicFormSection)[]>(
    []
  );
  section = input.required<DynamicFormSection>();
  connectedDropListIds = input<string[] | undefined>(undefined);

  readonly remove = output<DynamicFormSection>();
  readonly sectionChange = output<DynamicFormSection>();
  readonly structureChange = output<void>();

  showConditionalLogic = signal<boolean>(false);
  panelOpenState = signal(true);

  getDropZoneIds(): string[] {
    const dropZones: string[] = [];

    const columns = this.getColumns();
    columns.forEach(column => {
      dropZones.push(`section-${this.section().id}-column-${column}`);
    });

    return dropZones.reverse();
  }

  dropListConnections(): string[] {
    const ids = this.connectedDropListIds();
    return ids?.length ? ids : this.getDropZoneIds();
  }

  getExistingFields() {
    const fields = getFieldsFromFormDefinition(
      this.formDefinition() as Array<DynamicFormField | DynamicFormSection>
    );
    return Object.keys(fields).map(value => {
      return { id: value, value: value };
    });
  }

  isSection(element: DynamicFormSection | DynamicFormField<unknown>): boolean {
    return isDynamicFormSection(element);
  }

  getSection(section: unknown): DynamicFormSection {
    return section as DynamicFormSection;
  }

  getField(field: unknown): DynamicFormField {
    return field as DynamicFormField;
  }

  getFieldsForColumn(
    column: number
  ): (DynamicFormSection | DynamicFormField<unknown>)[] {
    return this.section().fields.filter(
      element => (element.column ?? 0) === column
    );
  }

  handleNameChange(name: string | number) {
    const section = this.section();
    section.name = `${name}`;
    this.sectionChange.emit(section);
  }

  handleDescriptionChange(description: string | number) {
    const section = this.section();
    section.description = `${description}`;
    this.sectionChange.emit(section);
  }

  handleConditionalLogicChange(dependsOn: DependsOn | undefined) {
    this.section().dependsOn = dependsOn;
    this.sectionChange.emit(this.section());
  }

  handleRemove() {
    this.remove.emit(this.section());
  }

  handleNewSection(column: number, index: number) {
    const section = this.section();
    const newSection = {
      id: getUUID4(),
      name: 'New sub-section name',
      description: 'New sub-section description',
      layout: SectionLayouts.ONE_COLUMN,
      direction: Directions.COLUMN,
      fields: [],
      column,
    };

    const columnFields = this.getFieldsForColumn(column);
    const insertPosition = Math.min(index, columnFields.length);
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

    section.fields.splice(actualIndex, 0, newSection);
    this.sectionChange.emit(section);
  }

  handleNewField(
    fieldType: DynamicFormFieldTypes,
    column: number,
    index: number
  ) {
    const parameters: DynamicFormFieldParameters = {};

    if (fieldType === DynamicFormFieldTypes.INPUT) {
      parameters.placeholder = '';
      parameters.type = 'text';
      parameters.minimumLength = undefined;
      parameters.maximumLength = undefined;
    }

    if (
      fieldType === DynamicFormFieldTypes.NUMBER ||
      fieldType === DynamicFormFieldTypes.MONEY
    ) {
      parameters.placeholder = '';
      parameters.minimumValue = undefined;
      parameters.maximumValue = undefined;
    }

    if (fieldType === DynamicFormFieldTypes.TEXT) {
      parameters.placeholder = '';
      parameters.minimumLength = undefined;
      parameters.maximumLength = undefined;
    }

    if (fieldType === DynamicFormFieldTypes.DATE) {
      parameters.placeholder = '';
    }

    if (
      fieldType === DynamicFormFieldTypes.SELECT ||
      fieldType === DynamicFormFieldTypes.RADIO
    ) {
      parameters.options = [];
      parameters.placeholder = '';
    }

    if (fieldType === DynamicFormFieldTypes.COMPUTED) {
      parameters.computedFormula = '';
      parameters.computedFormulaReadOnly = false;
      parameters.computedOutputType = 'text';
    }

    const section = this.section();
    const newField: DynamicFormField<unknown> = {
      id: getUUID4(),
      name: getNewFieldName(
        this.formDefinition() as Array<DynamicFormField | DynamicFormSection>
      ),
      label: 'New field',
      column: column,
      fieldType: fieldType,
      required: fieldType !== DynamicFormFieldTypes.COMPUTED,
      parameters,
      value: getDefaultValueForFieldType(fieldType),
    };

    const columnFields = this.getFieldsForColumn(column);
    const insertPosition = Math.min(index, columnFields.length);
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

    section.fields.splice(actualIndex, 0, newField);
    this.sectionChange.emit(section);
  }

  handleNewCustomField(field: Field, column: number, index: number) {
    const section = this.section();
    const parameters: DynamicFormFieldParameters = {
      ...field.parameters,
    } as DynamicFormFieldParameters;
    if (field.fieldType === FieldTypes.COMPUTED) {
      parameters.computedFormulaReadOnly = true;
    }
    const newField: DynamicFormField<unknown> = {
      id: getUUID4(),
      name: field.name,
      label: field.label,
      column: column,
      fieldType: field.fieldType as unknown as DynamicFormFieldTypes,
      required: true,
      parameters,
      value: getDefaultValueForFieldType(
        field.fieldType as unknown as DynamicFormFieldTypes
      ),
    };

    const columnFields = this.getFieldsForColumn(column);
    const insertPosition = Math.min(index, columnFields.length);
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

    section.fields.splice(actualIndex, 0, newField);
    this.sectionChange.emit(section);
  }

  handleSameColumnMove(
    previousContainer: CdkDropList<{
      fields: (DynamicFormSection | DynamicFormField<unknown>)[];
      column: number;
    }>,
    previousIndex: number,
    newContainer: CdkDropList<{
      fields: (DynamicFormSection | DynamicFormField<unknown>)[];
      column: number;
    }>,
    currentIndex: number
  ) {
    const section = this.section();
    const movedField = previousContainer.data.fields[previousIndex];
    const actualPreviousIndex = section.fields.findIndex(
      field => field === movedField
    );
    const targetField = newContainer.data.fields[currentIndex];
    let actualCurrentIndex: number;

    if (targetField) {
      actualCurrentIndex = section.fields.findIndex(
        field => field === targetField
      );
    } else {
      const columnFields = newContainer.data.fields;
      if (columnFields.length > 0) {
        const lastFieldInColumn = columnFields[columnFields.length - 1];
        actualCurrentIndex =
          section.fields.findIndex(field => field === lastFieldInColumn) + 1;
      } else {
        actualCurrentIndex = section.fields.length;
      }
    }
    moveItemInArray(section.fields, actualPreviousIndex, actualCurrentIndex);
    this.sectionChange.emit(section);
  }

  handleImportFormTemplate(
    formDefinition: Array<DynamicFormField<unknown> | DynamicFormSection>,
    column: number,
    index: number
  ) {
    const section = this.section();
    const clonedItems = cloneFormDefinitionItems(formDefinition);

    const columnFields = this.getFieldsForColumn(column);
    const insertPosition = Math.min(index, columnFields.length);
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

    clonedItems.forEach(
      (item: DynamicFormField<unknown> | DynamicFormSection) =>
        (item.column = column)
    );
    section.fields.splice(actualIndex, 0, ...clonedItems);
    this.sectionChange.emit(section);
  }

  drop(
    event: CdkDragDrop<{
      fields: (DynamicFormSection | DynamicFormField<unknown>)[];
      column: number;
    }>
  ) {
    if (event.previousContainer.id === 'section-selector') {
      const targetColumn = event.container.data.column;
      this.handleNewSection(targetColumn, event.currentIndex);
      return;
    }
    if (event.previousContainer.id === 'form-template-selector') {
      const data = event.item.data;
      if (data?.type === 'form-template' && data.formDefinition) {
        const targetColumn = event.container.data.column;
        this.handleImportFormTemplate(
          data.formDefinition,
          targetColumn,
          event.currentIndex
        );
      }
      return;
    }
    if (event.previousContainer.id === 'field-selector') {
      const fieldType = event.item.data.value as DynamicFormFieldTypes;
      const targetColumn = event.container.data.column;
      if (fieldType === DynamicFormFieldTypes.CUSTOM_FIELD) {
        this.handleNewCustomField(
          event.item.data.field,
          targetColumn,
          event.currentIndex
        );
      } else {
        this.handleNewField(fieldType, targetColumn, event.currentIndex);
      }
      return;
    }
    if (event.previousContainer.id === 'form-drop-zone') {
      this.handleDropFromFormRoot(event);
      return;
    }

    const previousParsed = parseSectionColumnDropListId(
      event.previousContainer.id
    );
    const targetParsed = parseSectionColumnDropListId(event.container.id);
    if (!previousParsed || !targetParsed) {
      return;
    }

    if (previousParsed.sectionId === targetParsed.sectionId) {
      if (event.previousContainer === event.container) {
        this.handleSameColumnMove(
          event.previousContainer,
          event.previousIndex,
          event.container,
          event.currentIndex
        );
      } else {
        const section = this.section();
        const movedField =
          event.previousContainer.data.fields[event.previousIndex];
        const targetColumnIndex = event.container.data.column;

        const fieldToMove = section.fields.find(field => field === movedField);
        if (fieldToMove) {
          fieldToMove.column = targetColumnIndex;
        }

        const actualPreviousIndex = section.fields.findIndex(
          field => field === movedField
        );

        let actualCurrentIndex: number;
        const targetField = event.container.data.fields[event.currentIndex];

        if (targetField) {
          actualCurrentIndex = section.fields.findIndex(
            field => field === targetField
          );
        } else {
          const targetColumnFields = this.getFieldsForColumn(targetColumnIndex);
          if (targetColumnFields.length > 0) {
            const lastFieldInColumn =
              targetColumnFields[targetColumnFields.length - 1];
            actualCurrentIndex =
              section.fields.findIndex(field => field === lastFieldInColumn) + 1;
          } else {
            actualCurrentIndex = section.fields.length;
          }
        }

        moveItemInArray(
          section.fields,
          actualPreviousIndex,
          actualCurrentIndex
        );
        this.sectionChange.emit(section);
      }
      return;
    }

    this.handleCrossSectionDrop(event, targetParsed);
  }

  private handleDropFromFormRoot(
    event: CdkDragDrop<{
      fields: (DynamicFormSection | DynamicFormField<unknown>)[];
      column: number;
    }>
  ) {
    const roots = this.formDefinition();
    const moved = roots[event.previousIndex];
    if (!moved || !isDynamicFormSection(moved)) {
      return;
    }
    roots.splice(event.previousIndex, 1);
    const targetSection = this.section();
    const column = event.container.data.column;
    (moved as DynamicFormSection).column = column;
    const insertIdx = computeInsertIndexInSectionFields(
      targetSection,
      column,
      event.currentIndex
    );
    targetSection.fields.splice(insertIdx, 0, moved);
    this.sectionChange.emit(targetSection);
    this.structureChange.emit();
  }

  private handleCrossSectionDrop(
    event: CdkDragDrop<{
      fields: (DynamicFormSection | DynamicFormField<unknown>)[];
      column: number;
    }>,
    targetParsed: { sectionId: string; column: number }
  ) {
    const movedItem = event.previousContainer.data.fields[event.previousIndex];
    if (!movedItem) {
      return;
    }
    const roots = this.formDefinition();
    removeItemFromFormDefinitionTree(roots, movedItem);
    const targetSection = findSectionByIdInFormDefinition(
      roots,
      targetParsed.sectionId
    );
    if (!targetSection) {
      return;
    }
    movedItem.column = targetParsed.column;
    const insertIdx = computeInsertIndexInSectionFields(
      targetSection,
      targetParsed.column,
      event.currentIndex
    );
    targetSection.fields.splice(insertIdx, 0, movedItem);
    this.sectionChange.emit(this.section());
    this.structureChange.emit();
  }

  handleItemRemove(
    itemToRemove: DynamicFormField<unknown> | DynamicFormSection
  ) {
    const section = this.section();
    section.fields = section.fields.filter(item => item.id !== itemToRemove.id);
    this.sectionChange.emit(section);
  }

  handleChange(item: DynamicFormField<unknown> | DynamicFormSection) {
    const section = this.section();
    const itemToUpdate = section.fields.find(f => f.id === item.id);

    if (!itemToUpdate) {
      return;
    }

    Object.assign(itemToUpdate, item);
    this.sectionChange.emit(section);
  }

  getColumns(): number[] {
    switch (this.section().layout) {
      case SectionLayouts.ONE_COLUMN:
        return [0];
      case SectionLayouts.TWO_COLUMNS:
        return [0, 1];
      case SectionLayouts.THREE_COLUMNS:
        return [0, 1, 2];
      default:
        return [0];
    }
  }
}
