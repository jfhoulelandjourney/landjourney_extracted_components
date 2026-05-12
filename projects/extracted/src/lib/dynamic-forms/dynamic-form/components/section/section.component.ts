import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { isNotNil } from 'es-toolkit';
import {
  Directions,
  DynamicFormData,
  DynamicFormField,
  DynamicFormFieldTypes,
  DynamicFormSection,
  FormModes,
  FormTypes,
  SectionLayouts,
} from '../../../models/dynamic-forms.models';
import {
  CssRootNode,
  elementShouldDisplay,
  getCustomStyleString,
  isDynamicFormSection,
} from '../../../utilities/dynamicFormsUtil';
import { FieldCustomAction } from '../abstract-field.component';
import { FieldComponent } from '../field/field.component';

@Component({
  selector: 'lj-df-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  imports: [FieldComponent, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionComponent {
  formDefinition = input<(DynamicFormField<unknown> | DynamicFormSection)[]>(
    []
  );
  mode = input<FormModes>('display');
  section = input.required<DynamicFormSection>();
  formData = input.required<DynamicFormData>();
  formType = input.required<FormTypes>();
  id = input<string>();
  isMobile = input(false);
  allowManualComputedValueEdit = input(false);
  showHeadingInPanel = input(true);
  customStyle = input<CssRootNode>({ parent: null, children: [] });
  prefillPendingChanges = input<Record<string, unknown>>({});
  fieldValidity = input<Record<string, string | undefined>>({});
  suppressedErrors = input<Record<string, string[]>>({});
  readonly prefillChangeAccepted = output<string>();
  readonly prefillChangeDeclined = output<string>();

  @ViewChildren(FieldComponent) fieldComponents!: QueryList<FieldComponent>;
  @ViewChildren(SectionComponent)
  sectionComponents!: QueryList<SectionComponent>;

  readonly sectionChange = output<DynamicFormSection>();
  readonly customAction = output<FieldCustomAction>();
  readonly dataChange = output<DynamicFormSection>();
  readonly submit = output<void>();

  getId() {
    return this.id();
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
    if (this.isMobile() && this.section().direction === Directions.ROW) {
      if (column === 0) {
        // show all the fields in one column for mobile
        if (this.section().layout === SectionLayouts.TWO_COLUMNS) {
          const firstColumnFields = this.section().fields.filter(
            element => (element.column ?? 0) === 0
          );
          const secondColumnFields = this.section().fields.filter(
            element => (element.column ?? 0) === 1
          );

          const rowOrderedFields: (
            | DynamicFormSection
            | DynamicFormField<unknown>
            | undefined
          )[] = [];

          const l = Math.min(
            firstColumnFields.length,
            secondColumnFields.length
          );

          for (let i = 0; i < l; i++) {
            rowOrderedFields.push(firstColumnFields[i], secondColumnFields[i]);
          }
          rowOrderedFields.push(
            ...firstColumnFields.slice(l),
            ...secondColumnFields.slice(l)
          );

          return rowOrderedFields.filter(isNotNil);
        } else if (this.section().layout === SectionLayouts.THREE_COLUMNS) {
          const firstColumnFields = this.section().fields.filter(
            element => (element.column ?? 0) === 0
          );
          const secondColumnFields = this.section().fields.filter(
            element => (element.column ?? 0) === 1
          );
          const thirdColumnFields = this.section().fields.filter(
            element => (element.column ?? 0) === 2
          );

          const rowOrderedFields: (
            | DynamicFormSection
            | DynamicFormField<unknown>
            | undefined
          )[] = [];

          const l = Math.min(
            firstColumnFields.length,
            secondColumnFields.length,
            thirdColumnFields.length
          );

          for (let i = 0; i < l; i++) {
            rowOrderedFields.push(
              firstColumnFields[i],
              secondColumnFields[i],
              thirdColumnFields[i]
            );
          }
          rowOrderedFields.push(
            ...firstColumnFields.slice(l),
            ...secondColumnFields.slice(l),
            ...thirdColumnFields.slice(l)
          );

          return rowOrderedFields.filter(isNotNil);
        }

        // one column -> already ordered
        return this.section().fields;
      } else {
        return [];
      }
    } else {
      return this.section().fields.filter(
        element => (element.column ?? 0) === column
      );
    }
  }

  showElement(
    element: DynamicFormSection | DynamicFormField<unknown>,
    formData: DynamicFormData,
    mode: FormModes
  ): boolean {
    return elementShouldDisplay(element, formData, mode, this.fieldValidity());
  }

  getValue(
    fieldName: string,
    elements: (DynamicFormSection | DynamicFormField<unknown>)[]
  ): unknown {
    for (const element of elements) {
      if (isDynamicFormSection(element)) {
        const value: unknown = this.getValue(
          fieldName,
          (element as DynamicFormSection).fields
        );

        if (value !== null) {
          return value;
        }
      } else {
        if ((element as DynamicFormField<unknown>).name === fieldName) {
          return (element as DynamicFormField<unknown>).value;
        }
      }
    }

    return null;
  }

  handleSubmit() {
    this.submit.emit();
  }

  handleChange(item: DynamicFormField<unknown> | DynamicFormSection) {
    const section = this.section();
    const itemToUpdate = section.fields.find(value => value === item);

    if (!itemToUpdate) {
      return;
    }

    if (isDynamicFormSection(itemToUpdate)) {
      Object.assign(itemToUpdate, item);
    } else {
      (itemToUpdate as DynamicFormField<unknown>).value = (
        item as DynamicFormField<unknown>
      ).value;
    }

    this.sectionChange.emit(section);
  }

  handleCustomAction(event: FieldCustomAction) {
    this.customAction.emit(event);
  }

  handleDataChange(field: DynamicFormField<unknown> | DynamicFormSection) {
    const section = this.section();
    const itemToUpdate = section.fields.find(value => value === field);

    if (!itemToUpdate) {
      return;
    }

    Object.assign(itemToUpdate, field);

    this.dataChange.emit(section);
  }

  getColumns(): number[] {
    const layout = this.section().layout;
    if (
      this.isMobile() &&
      this.section().direction === Directions.ROW &&
      (layout === SectionLayouts.TWO_COLUMNS ||
        layout === SectionLayouts.THREE_COLUMNS)
    ) {
      return [0];
    }
    switch (layout) {
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

  getCustomStyle(selector: string, defaultStyle = ''): string {
    const customStyle = getCustomStyleString(selector, this.customStyle());

    if (customStyle.trim() !== '') {
      return customStyle;
    }

    return defaultStyle;
  }

  getFieldValidityMap(): Record<string, string | undefined> {
    const validity: Record<string, string | undefined> = {};
    for (const fc of this.fieldComponents) {
      if (fc.isTouched()) {
        validity[fc.field().name] = fc.getErrorKey();
      }
    }
    for (const sc of this.sectionComponents) {
      Object.assign(validity, sc.getFieldValidityMap());
    }
    return validity;
  }

  isValid(): boolean {
    const areValid = this.fieldComponents
      .filter(
        field => field.field().fieldType !== DynamicFormFieldTypes.COMPUTED
      )
      .map(field => field.isValid());
    const sectionIsValid = this.sectionComponents.map(section =>
      section.isValid()
    );

    return (
      areValid.every(value => value) && sectionIsValid.every(value => value)
    );
  }
}
