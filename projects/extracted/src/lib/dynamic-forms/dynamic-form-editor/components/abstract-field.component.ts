import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { getUUID4 } from '../../../utils/stringUtil';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  DynamicFormSection,
  SectionLayouts,
  type DependsOn,
} from '../../models/dynamic-forms.models';

export interface FieldCustomAction {
  action: 'export' | 'export_all';
  fieldType: DynamicFormFieldTypes;
  fieldValue: unknown;
}

@Component({
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class AbstractFieldComponent<T> {
  SectionLayouts = SectionLayouts;
  containerLayout = input.required<SectionLayouts>();
  existingFields = input<
    {
      id: string;
      value: string;
    }[]
  >([]);
  formDefinition = input<(DynamicFormField<unknown> | DynamicFormSection)[]>(
    []
  );
  allowPrefill = input<boolean>(true);

  field = model<DynamicFormField<T>>({
    id: getUUID4(),
    fieldType: DynamicFormFieldTypes.INPUT,
    name: '',
    column: 0,
    label: '',
    required: false,
    parameters: {},
  });

  showShadow = signal<boolean>(false);
  showConditionalLogic = signal<boolean>(false);
  focused = signal(false);

  readonly remove = output<DynamicFormField<T>>();
  readonly fieldChange = output<DynamicFormField<T>>();

  protected getNumberOfColumns(): number {
    switch (this.containerLayout()) {
      case SectionLayouts.ONE_COLUMN:
        return 0;
      case SectionLayouts.TWO_COLUMNS:
        return 1;
      case SectionLayouts.THREE_COLUMNS:
        return 2;
      default:
        return 0;
    }
  }

  handleValueChange(value: T) {
    const field = this.field();

    if (field.value !== value) {
      field.value = value;
      this.fieldChange.emit(field);
    }
  }

  handlePlaceholderChange(value: string) {
    const field = this.field();

    if (field.parameters.placeholder !== value) {
      field.parameters.placeholder = value;
      this.fieldChange.emit(field);
    }
  }

  handleLabelChange(value: string | number) {
    const field = this.field();

    if (field.label !== value) {
      field.label = `${value}`;
      this.fieldChange.emit(field);
    }
  }

  handleConditionalLogicChange(dependsOn: DependsOn | undefined) {
    this.field().dependsOn = dependsOn;
    this.fieldChange.emit(this.field());
  }

  handleFieldChange(field: DynamicFormField<unknown>) {
    const target = this.field();
    target.name = field.name;
    target.label = field.label;
    target.required = field.required;
    target.parameters = field.parameters;
    target.prefillable = field.prefillable;
    target.prefillSourceKey = field.prefillSourceKey;
    target.dependsOn = field.dependsOn;
    target.value = field.value as T;
    this.fieldChange.emit(target);
  }

  handleRemove() {
    this.remove.emit(this.field());
  }
}
