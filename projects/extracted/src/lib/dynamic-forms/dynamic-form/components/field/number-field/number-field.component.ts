import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

import { MatIconModule } from '@angular/material/icon';
import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';

import { MaskitoOptions, maskitoTransform } from '@maskito/core';
import { numberMaskitoMask } from '../../../../../constants/masks';
import { FieldDirective } from '../../../../../directives/field.directive';

@Component({
  selector: 'lj-df-number-field',
  templateUrl: './number-field.component.html',
  styleUrls: ['./number-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    LjInputFieldComponent,
    MatIconModule,
    CopyToClipboardButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: NumberFieldComponent }],
})
export class NumberFieldComponent extends AbstractFieldComponent<
  number | undefined
> {
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
      return ValidationErrorKey.MAX_VALUE;
    }

    if (
      parameters.minimumValue !== undefined &&
      parameters.minimumValue !== null &&
      value < parameters.minimumValue
    ) {
      return ValidationErrorKey.MIN_VALUE;
    }

    return undefined;
  }

  handleOnBlur() {
    this.touched.set(true);
  }

  formatValue(number: number | undefined) {
    if (number === undefined || number === null) {
      return '';
    }

    return maskitoTransform(`${number}`, this.getNumberMask());
  }

  // This field is a number but the maskito formatter changes it to string
  override handleValueChange(valueAsString: number) {
    const field = this.field();

    // Remove commas, preserve minus and decimal
    const value = `${valueAsString}`.replaceAll(',', '').trim();

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

  getNumberMask(): MaskitoOptions {
    const numberMask: MaskitoOptions = numberMaskitoMask(
      this.field().parameters.decimalPrecision ?? 2
    );
    return numberMask;
  }

  getDefaultPlaceholder(): string {
    const precision = this.field().parameters.decimalPrecision ?? 2;
    if (precision === 0) {
      return '__';
    }

    if (precision > 0) {
      let zeros = '';
      for (let i = 0; i < precision; i++) {
        zeros += '_';
      }
      return `__.${zeros}`;
    }

    return '__.__';
  }
}
