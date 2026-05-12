import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { getUUID4 } from '../../../utils/stringUtil';
import {
  DynamicFormData,
  DynamicFormField,
  DynamicFormFieldTypes,
  FormModes,
  SectionLayouts,
} from '../../models/dynamic-forms.models';
import {
  CssRootNode,
  getCustomStyleString,
} from '../../utilities/dynamicFormsUtil';
import {
  ALL_ERRORS_SENTINEL,
  ALL_NON_REQUIRED_SENTINEL,
  getValidationErrorLabel,
  ValidationErrorKey,
} from '../../utilities/validation-errors.util';

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
  mode = input<FormModes>('display');
  disabled = input<boolean>(false);
  formData = input.required<DynamicFormData>();
  containerLayout = input.required<SectionLayouts>();
  customStyle = input<CssRootNode>({ parent: null, children: [] });
  style = input<'gray' | 'normal'>('gray');

  suppressedErrorKeys = input<string[]>([]);
  touched = signal(false);
  authenticatedOnly = signal(false);

  private touchedEffect = effect(() => {
    if (this.touched()) {
      untracked(() => this.dataChange.emit(this.field()));
    }
  });

  field = model<DynamicFormField<T>>({
    id: getUUID4(),
    fieldType: DynamicFormFieldTypes.INPUT,
    name: '',
    column: 0,
    label: '',
    required: false,
    parameters: {},
  });

  readonly dataChange = output<DynamicFormField<T>>();
  readonly customAction = output<FieldCustomAction>();
  readonly submit = output<void>();

  getErrorKey(): ValidationErrorKey | undefined {
    return undefined;
  }

  getErrorMessage(): string | undefined {
    const key = this.getErrorKey();
    if (!key) return undefined;
    const suppressed = this.suppressedErrorKeys();
    if (
      suppressed.includes(key) ||
      suppressed.includes(ALL_ERRORS_SENTINEL) ||
      (key !== ValidationErrorKey.REQUIRED &&
        suppressed.includes(ALL_NON_REQUIRED_SENTINEL))
    ) {
      return undefined;
    }
    return getValidationErrorLabel(key, this.field());
  }

  isErrorSuppressed(): boolean {
    const key = this.getErrorKey();
    if (!key) return false;
    const suppressed = this.suppressedErrorKeys();
    return (
      suppressed.includes(key) ||
      suppressed.includes(ALL_ERRORS_SENTINEL) ||
      (key !== ValidationErrorKey.REQUIRED &&
        suppressed.includes(ALL_NON_REQUIRED_SENTINEL))
    );
  }

  isValid(): boolean {
    this.touched.set(true);
    return this.getErrorKey() === undefined;
  }

  handleValueChange(value: T) {
    const field = this.field();

    if (
      field.fieldType !== DynamicFormFieldTypes.SUBMIT_BUTTON &&
      field.value !== value
    ) {
      field.value = value;
      this.dataChange.emit(field);
    }
  }

  getCustomStyle(
    selector: string,
    checkFieldName = false,
    defaultStyle = ''
  ): string {
    if (checkFieldName) {
      const fieldNameStyle = getCustomStyleString(
        this.field().name,
        this.customStyle()
      );
      if (fieldNameStyle.trim() !== '') {
        return fieldNameStyle;
      }
    }

    const customStyle = getCustomStyleString(selector, this.customStyle());

    if (customStyle.trim() !== '') {
      return customStyle;
    }

    return defaultStyle;
  }
}
