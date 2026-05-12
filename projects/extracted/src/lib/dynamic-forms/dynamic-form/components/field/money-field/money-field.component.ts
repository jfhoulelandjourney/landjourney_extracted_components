import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { maskitoTransform } from '@maskito/core';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';

import { getMoneyMaskitoOptions } from '../../../../../constants/masks';
import { FieldDirective } from '../../../../../directives/field.directive';
import { stripNonNumberCharacters } from '../../../../../utils/stringUtil';

@Component({
  selector: 'lj-df-money-field',
  templateUrl: './money-field.component.html',
  styleUrls: ['./money-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    LjInputFieldComponent,
    MatIconModule,
    CopyToClipboardButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: MoneyFieldComponent }],
})
export class MoneyFieldComponent extends AbstractFieldComponent<
  number | undefined
> {
  inputFieldRef = viewChild('inputField', {
    read: ElementRef<HTMLInputElement>,
  });
  moneyMask = getMoneyMaskitoOptions(this.field().id);

  override getErrorKey(): ValidationErrorKey | undefined {
    const { required, value, parameters } = this.field();
    if (required && (value === undefined || value === null)) {
      return ValidationErrorKey.REQUIRED;
    }

    if (value === undefined || value === null) {
      return undefined;
    }

    if (
      parameters.maximumValue !== undefined &&
      parameters.maximumValue !== null &&
      value > parameters.maximumValue
    ) {
      return ValidationErrorKey.MAX_AMOUNT;
    }

    if (
      parameters.minimumValue !== undefined &&
      parameters.minimumValue !== null &&
      value < parameters.minimumValue
    ) {
      return ValidationErrorKey.MIN_AMOUNT;
    }

    return undefined;
  }

  handleOnBlur() {
    this.touched.set(true);
  }

  // This field is a number but the maskito formatter changes it to string
  override handleValueChange(valueAsString: number) {
    const field = this.field();

    // Remove $ and commas, preserve minus and decimal
    const value = `${valueAsString}`
      .replaceAll('$', '')
      .replaceAll(',', '')
      .trim();

    // Replace Unicode minus (U+2212) with ASCII minus
    const normalized = value.replace(/\u2212/g, '-');
    let sanitized = normalized.replace(/[^0-9.-]/g, '');
    sanitized = sanitized.replace(/(?!^)-/g, ''); // Remove any minus not at the start

    const number =
      sanitized === '' || isNaN(parseFloat(sanitized))
        ? undefined
        : parseFloat(sanitized);

    if (field.value !== number) {
      field.value = number;
      this.dataChange.emit(this.field());
    }
  }

  formatMoney(number: number | undefined): string {
    if (number === undefined || number === null) {
      return '';
    }

    const response = maskitoTransform(
      stripNonNumberCharacters(`${number}`),
      this.moneyMask
    );
    return response;
  }
}
