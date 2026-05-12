import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FieldDirective } from '../../../../../directives/field.directive';
import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LjSelectComponent } from '../../../../../web-components/form/select/select.component';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-select-field',
  templateUrl: './select-field.component.html',
  styleUrls: ['./select-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    LjInputFieldComponent,
    LjSelectComponent,
    CopyToClipboardButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: SelectFieldComponent }],
})
export class SelectFieldComponent
  extends AbstractFieldComponent<string>
  implements OnInit
{
  isBackoffice = window.location.href.toLowerCase().includes('backoffice');

  ngOnInit() {
    this.field().parameters.options = this.field().parameters.options ?? [];
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const { required, value } = this.field();
    const options = this.field().parameters.options;

    if (required && !value) {
      return ValidationErrorKey.REQUIRED;
    }

    if (options && value) {
      if (!options.map(option => option.value).includes(value)) {
        return ValidationErrorKey.INVALID_OPTION;
      }
    }

    return undefined;
  }

  handleOnBlur() {
    this.touched.set(true);
  }

  getSelectedLabel(): string {
    const { value, parameters } = this.field();
    if (!value || !parameters.options) {
      return '';
    }
    const option = parameters.options.find(opt => opt.value === value);
    return option ? option.label : '';
  }
}
