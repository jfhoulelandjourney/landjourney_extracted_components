import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  MatRadioModule,
} from '@angular/material/radio';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FieldDirective } from '../../../../../directives/field.directive';
import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { LabelFieldComponent } from '../../../../../web-components/typography/label-field/label-field.component';
import { DynamicFormField } from '../../../../models/dynamic-forms.models';

@Component({
  selector: 'lj-df-radio-field',
  templateUrl: './radio-field.component.html',
  styleUrls: ['./radio-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatRadioModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    CopyToClipboardButtonComponent,
    LabelFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: RadioFieldComponent },
    { provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' } },
  ],
})
export class RadioFieldComponent
  extends AbstractFieldComponent<string>
  implements OnInit
{
  isBackoffice = window.location.href.toLowerCase().includes('backoffice');

  ngOnInit() {
    this.field().parameters.options = this.field().parameters.options ?? [];
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const { name, parameters, required } = this.field();
    const value = this.formData()[name] as string;
    const options = parameters.options;

    if (required && !value) {
      return ValidationErrorKey.REQUIRED;
    }

    if (!required && !value) {
      return undefined;
    }

    if (options) {
      if (!options.map(option => option.value).includes(value)) {
        return ValidationErrorKey.INVALID_OPTION;
      }
    }

    return undefined;
  }

  handleOnBlur() {
    this.touched.set(true);
  }

  getSelectedLabel(field: DynamicFormField): string {
    const option = field.parameters.options?.find(
      opt => opt.value === field.value
    );
    return option ? option.label : '';
  }
}
