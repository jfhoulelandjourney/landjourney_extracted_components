import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { maskitoTransform } from '@maskito/core';
import { getMoneyMaskitoOptions } from '../../../../../constants/masks';
import { FieldDirective } from '../../../../../directives/field.directive';
import { stripNonNumberCharacters } from '../../../../../utils/stringUtil';
import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-computed-field',
  templateUrl: './computed-field.component.html',
  styleUrl: './computed-field.component.scss',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule,
    LjInputFieldComponent,
    CopyToClipboardButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: ComputedFieldComponent }],
})
export class ComputedFieldComponent
  extends AbstractFieldComponent<string>
  implements OnInit
{
  formattedValue(): string {
    const raw = this.field().value;
    const outputType = this.field().parameters.computedOutputType ?? 'text';

    if (raw === undefined || raw === null || raw === '') {
      return '';
    }

    if (outputType === 'money') {
      const n =
        typeof raw === 'number'
          ? raw
          : Number(stripNonNumberCharacters(`${raw}`));
      if (Number.isNaN(n)) {
        return `${raw}`;
      }
      return maskitoTransform(`${n}`, getMoneyMaskitoOptions('computed-field'));
    }

    if (outputType === 'number') {
      const n =
        typeof raw === 'number'
          ? raw
          : Number(stripNonNumberCharacters(`${raw}`));
      if (Number.isNaN(n)) {
        return `${raw}`;
      }
      return `${n}`;
    }

    return `${raw}`;
  }

  ngOnInit() {
    if (this.field() && this.field().value === undefined) {
      this.field().value = '';
    }
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const { value, parameters, required } = this.field();
    const textValue =
      value === undefined || value === null ? '' : `${value}`;
    const trimmed = textValue.trim();

    if (required && trimmed === '') {
      return ValidationErrorKey.REQUIRED;
    }

    if (!required && trimmed === '') {
      return undefined;
    }

    if (
      (parameters.computedOutputType === 'text' ||
        !parameters.computedOutputType) &&
      parameters.validator &&
      parameters.validator.trim() !== ''
    ) {
      let validatorPattern = parameters.validator;
      validatorPattern = validatorPattern.replace(/\\\\/g, '\\');
      const regex = new RegExp(validatorPattern);
      if (!regex.test(textValue)) {
        return ValidationErrorKey.INVALID_FORMAT;
      }
    }

    if (
      trimmed &&
      parameters.maximumLength &&
      trimmed.length > parameters.maximumLength
    ) {
      return ValidationErrorKey.MAX_LENGTH;
    }

    if (
      trimmed &&
      parameters.minimumLength &&
      trimmed.length < parameters.minimumLength
    ) {
      return ValidationErrorKey.MIN_LENGTH;
    }

    return undefined;
  }

  handleOnBlur() {
    this.touched.set(true);
  }
}
