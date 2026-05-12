import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FieldDirective } from '../../../../../directives/field.directive';
import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { LjTextareaFieldComponent } from '../../../../../web-components/form/textarea-field/textarea-field.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';

@Component({
  selector: 'lj-df-text-field',
  templateUrl: './text-field.component.html',
  styleUrls: ['./text-field.component.scss'],
  imports: [
    MatIconModule,
    MatInputModule,
    FormsModule,
    LjTextareaFieldComponent,
    CopyToClipboardButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: TextFieldComponent }],
})
export class TextFieldComponent
  extends AbstractFieldComponent<string>
  implements OnInit
{
  ngOnInit() {
    if (this.field() && !this.field().value) {
      this.field().value = '';
    }
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const { value, parameters, required } = this.field();

    if (required && !value) {
      return ValidationErrorKey.REQUIRED;
    }

    if (required && value?.trim() === '') {
      return ValidationErrorKey.REQUIRED;
    }

    if ((!required && !value) || (!required && value?.trim() === '')) {
      return undefined;
    }

    if (
      value &&
      parameters.maximumLength &&
      value.length > parameters.maximumLength
    ) {
      return ValidationErrorKey.MAX_LENGTH;
    }

    if (
      value &&
      parameters.minimumLength &&
      value.length < parameters.minimumLength
    ) {
      return ValidationErrorKey.MIN_LENGTH;
    }

    return undefined;
  }

  handleOnBlur() {
    this.touched.set(true);
  }
}
