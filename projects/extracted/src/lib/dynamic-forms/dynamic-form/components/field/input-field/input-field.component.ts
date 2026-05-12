import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { toMaskitoMask } from '../../../../../constants/masks';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import {
  isPhoneNumber,
  phoneNumberMask,
} from '../../../../../models/phoneNumber';
import {
  formatSSN,
  formatSSNForApi,
  isValidSSN,
  ssnMaskitoMask,
} from '../../../../../models/ssn';
import { isValidEmail } from '../../../../../utils/stringUtil';
import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-input-field',
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ActivateDirective,
    LjInputFieldComponent,
    MatIconModule,
    CopyToClipboardButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: InputFieldComponent }],
})
export class InputFieldComponent
  extends AbstractFieldComponent<string>
  implements OnInit
{
  phoneNumberMask = toMaskitoMask(phoneNumberMask);
  ssnMask = ssnMaskitoMask;
  privacyVisible = signal(false);

  formatSSN = formatSSN;

  togglePrivacyVisibility() {
    this.privacyVisible.update(v => !v);
  }

  isPrivacyMasked(): boolean {
    return Boolean(this.field().parameters.privacy) && !this.privacyVisible();
  }

  getPrivacyDisplayValue(): string {
    const value = this.field().value?.trim() ?? '';
    if (this.isPrivacyMasked()) {
      return value.replace(/./g, '•');
    }
    return value;
  }

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

    if (parameters.type === 'tel') {
      return !isPhoneNumber(value)
        ? ValidationErrorKey.INVALID_PHONE
        : undefined;
    }

    if (parameters.type === 'ssn') {
      const formatted = formatSSN(value);
      return !isValidSSN(formatted)
        ? ValidationErrorKey.INVALID_SSN
        : undefined;
    }

    if (parameters.type === 'email') {
      return !isValidEmail(value ?? '')
        ? ValidationErrorKey.INVALID_EMAIL
        : undefined;
    }

    if (
      parameters.type === 'text' &&
      parameters.validator &&
      parameters.validator.trim() !== ''
    ) {
      let validatorPattern = parameters.validator;
      validatorPattern = validatorPattern.replace(/\\\\/g, '\\');

      const regex = new RegExp(validatorPattern);
      if (!regex.test(value ?? '')) {
        return ValidationErrorKey.INVALID_FORMAT;
      }
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

    // For SSN, strip dashes on blur (after user finishes typing)
    // This allows the mask to show dashes during typing, but we store unformatted
    const field = this.field();
    if (field.parameters.type === 'ssn' && field.value) {
      const unformatted = formatSSNForApi(field.value);
      if (unformatted !== field.value) {
        field.value = unformatted;
        this.dataChange.emit(field);
      }
    }
  }

  override handleValueChange(value: string) {
    super.handleValueChange(value);
  }
}
