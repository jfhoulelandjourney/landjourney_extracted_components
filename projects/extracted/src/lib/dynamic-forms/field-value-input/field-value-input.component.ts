import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { type Field } from '../../services/products/fields/fields.models';
import { FieldComponent } from '../dynamic-form/components/field/field.component';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  FormTypes,
  SectionLayouts,
  type DynamicFormData,
} from '../models/dynamic-forms.models';
import { getDefaultValueForFieldType } from '../models/fields.models';

@Component({
  selector: 'lj-field-value-input',
  standalone: true,
  imports: [FieldComponent],
  templateUrl: './field-value-input.component.html',
  styleUrl: './field-value-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldValueInputComponent {
  field = input.required<Field>();
  value = input<unknown>(undefined);
  showLabel = input<boolean>(true);
  style = input<'gray' | 'normal'>('gray');
  readonly valueChange = output<unknown>();

  private dynamicFormField = computed<DynamicFormField<unknown>>(() => {
    const apiField = this.field();
    const currentValue = this.value();

    return {
      id: apiField.id ?? `${apiField.name}-field-value-input`,
      name: apiField.name,
      label: apiField.label,
      column: 0,
      fieldType: apiField.fieldType as unknown as DynamicFormFieldTypes,
      required: false,
      parameters: apiField.parameters,
      value:
        currentValue ??
        getDefaultValueForFieldType(
          apiField.fieldType as unknown as DynamicFormFieldTypes
        ),
    };
  });

  private formData = computed<DynamicFormData>(() => {
    const f = this.dynamicFormField();
    return {
      [f.name]: f.value,
    };
  });

  FormTypes = FormTypes;
  SectionLayouts = SectionLayouts;

  getDynamicFormField(): DynamicFormField<unknown> {
    return this.dynamicFormField();
  }

  getFormData(): DynamicFormData {
    return this.formData();
  }

  onFieldDataChange(f: DynamicFormField<unknown>): void {
    this.valueChange.emit(f.value);
  }
}
