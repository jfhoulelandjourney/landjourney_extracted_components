import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { maskitoTransform } from '@maskito/core';
import { getMoneyMaskitoOptions } from '../../../constants/masks';
import { getUUID4, stripNonNumberCharacters } from '../../../utils/stringUtil';
import { BaseControlValueAccessorComponent } from '../base-control-value-accessor/BaseControlValueAccessor';
import {
  AutocompleteOption,
  LjInputFieldComponent,
} from '../input-field/input-field.component';

export function convertMoneyFieldValueToNumber(
  value: string | number | null
): number | null {
  if (!value) {
    return null;
  }

  const convertedValue = Number.isNaN(value)
    ? null
    : parseFloat(`${value}`.replaceAll(',', '').replaceAll('$', ''));

  return convertedValue;
}

@Component({
  selector: 'lj-money-input-field',
  imports: [FormsModule, LjInputFieldComponent],
  templateUrl: './money-input-field.component.html',
  styleUrl: './money-input-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LjMoneyInputFieldComponent extends BaseControlValueAccessorComponent<number> {
  id = input(getUUID4());
  label = input<string>();
  placeholder = input<string | null>(null);
  showError = input(true);
  customErrorMessage = input<string | undefined>();
  stripped = input<boolean>(false);
  autocomplete = input<boolean>(false);
  autocompleteOptions = input<AutocompleteOption[]>([]);
  readonly autocompleteOptionClick = output<AutocompleteOption>();
  customCssStyle = input<string>('');
  customCssTitleStyle = input<string>('');
  after = input<string>();
  before = input<string>();
  style = input<'normal' | 'gray'>('normal');
  readonly = input(false, {
    transform: (value: unknown) => Boolean(value),
  });
  readonly onInputFocus = output<FocusEvent>();
  readonly onInputBlur = output<FocusEvent>();

  // Mask-related inputs
  moneyMask = getMoneyMaskitoOptions(this.id());
  readonly change = output<number | undefined>();

  handleValueChange(value: number) {
    const convertedValue = convertMoneyFieldValueToNumber(value);

    if (convertedValue && this.value() !== convertedValue) {
      this.change.emit(convertedValue);
    }
  }

  formatMoney(number: number | null): string {
    if (!number || number === 0) {
      return '';
    }
    const response = maskitoTransform(
      stripNonNumberCharacters(`${number}`),
      this.moneyMask
    );
    return response;
  }
}
