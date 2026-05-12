import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  MatRadioModule,
} from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { maskitoTransform } from '@maskito/core';
import {
  currencyConfiguration,
  getMoneyMaskitoOptions,
  MaskitoExtendedOptions,
} from '../../../../../constants/masks';
import { FieldDirective } from '../../../../../directives/field.directive';
import { InterestTypes } from '../../../../../services/lending/models/lending.enums';
import { PaymentFrequencies } from '../../../../../utils/loanUtil';
import { formatEnumValue } from '../../../../../utils/stringUtil';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LabelFieldComponent } from '../../../../../web-components/typography/label-field/label-field.component';
import type { LoanInformationFieldModel } from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-loan-information-field',
  templateUrl: './loan-information-field.component.html',
  styleUrls: ['./loan-information-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    FormsModule,
    LjInputFieldComponent,
    LabelFieldComponent,
    MatIconModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: LoanInformationFieldComponent },
    { provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' } },
  ],
})
export class LoanInformationFieldComponent
  extends AbstractFieldComponent<LoanInformationFieldModel>
  implements OnInit
{
  isMobile = input(false);
  private moneyMasks: Record<string, MaskitoExtendedOptions> = {};

  getMoneyMask(key: string | number): MaskitoExtendedOptions {
    if (!this.moneyMasks[key]) {
      this.moneyMasks[key] = getMoneyMaskitoOptions(
        `${this.field().id}-${key}`
      );
    }
    return this.moneyMasks[key] as MaskitoExtendedOptions;
  }

  interestTypesOptions = [
    {
      value: InterestTypes.FIXED,
      label: 'Fixed Rate',
      description: 'Interest will stay the same for all the term',
    },
    {
      value: InterestTypes.VARIABLE,
      label: 'Variable Rate',
      description: 'Interest will vary over the course of the term',
    },
  ];

  paymentFrequencyOptions = [
    {
      value: PaymentFrequencies.MONTHLY,
      label: 'Monthly',
      description: 'Payment will be processed on the same day, once a month',
    },
    {
      value: PaymentFrequencies.SEMI_MONTHLY,
      label: 'Semi-monthly',
      description: 'Payment will be processed on the same days, twice a month',
    },
    {
      value: PaymentFrequencies.BI_WEEKLY,
      label: 'Bi-weekly',
      description:
        'Payment will be processed on the same day of the week, every 2 weeks',
    },
    {
      value: PaymentFrequencies.WEEKLY,
      label: 'Weekly',
      description:
        'Payment will be processed on the same day of the week, every week',
    },
  ];

  ngOnInit() {
    if (
      this.field &&
      (this.field().value === undefined ||
        this.field().value === null ||
        !('paymentFrequency' in (this.field().value ?? {})))
    ) {
      this.field().value = {
        loanAmount: undefined,
        paymentFrequency: PaymentFrequencies.MONTHLY,
        interestType: InterestTypes.FIXED,
        term: 5,
        amortization: 25,
      };
    }
  }

  formatMoney(number: number): string {
    let [integer, decimal] = String(number).split(
      currencyConfiguration.decimalSeparator
    );

    integer = integer || '0';
    decimal = (decimal || '').padEnd(currencyConfiguration.precision, '0');

    const numericString = `${integer}${currencyConfiguration.decimalSeparator}${decimal}`;
    return maskitoTransform(numericString, getMoneyMaskitoOptions('money'));
  }

  formatEnumValue(value: string | undefined): string {
    if (!value) {
      return '';
    }

    return formatEnumValue(value);
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    if (this.getLoanAmountErrorMessage() !== undefined) {
      return ValidationErrorKey.MISSING_FIELDS;
    }
    if (this.getTermErrorMessage() !== undefined) {
      return ValidationErrorKey.MISSING_FIELDS;
    }
    if (this.getAmortizationErrorMessage() !== undefined) {
      return ValidationErrorKey.MISSING_FIELDS;
    }
    return undefined;
  }

  override isValid(): boolean {
    this.touched.set(true);
    return this.getErrorKey() === undefined;
  }

  handleOnBlur() {
    this.touched.set(true);
  }

  getTermErrorMessage(): string | undefined {
    const { value } = this.field();

    if (value?.term === undefined) {
      return 'This field is required';
    }

    if (value.term <= 0) {
      return 'The term cannot be under 0 year';
    }

    return undefined;
  }

  getAmortizationErrorMessage(): string | undefined {
    const { value } = this.field();

    if (value?.amortization === undefined) {
      return 'This field is required';
    }

    if (value.amortization <= 0) {
      return 'The amortization cannot be under 0 year';
    }

    return undefined;
  }

  getLoanAmountErrorMessage(): string | undefined {
    const { value } = this.field();

    if (value?.loanAmount === undefined) {
      return 'This field is required';
    }

    if (value.loanAmount <= 0) {
      return 'The loan amount cannot be under 0$';
    }

    return undefined;
  }

  handleLoanAmountChange(value: number) {
    const { prefix, thousandSeparator } = currencyConfiguration;

    const unformattedValue = `${value}`
      .replaceAll(prefix, '')
      .replaceAll(thousandSeparator, '');

    const number =
      Number.isNaN(Number(unformattedValue)) || unformattedValue === ''
        ? undefined
        : parseFloat(unformattedValue);

    const oldValue = this.field().value?.loanAmount;

    this.field().value = {
      loanAmount: number,
      paymentFrequency:
        this.field().value?.paymentFrequency ?? PaymentFrequencies.MONTHLY,
      interestType: this.field().value?.interestType ?? InterestTypes.FIXED,
      term: this.field().value?.term ?? 5,
      amortization: this.field().value?.amortization ?? 25,
    };

    if (number !== oldValue) {
      this.dataChange.emit(this.field());
    }
  }

  handleInterestTypeChange(value: InterestTypes) {
    const oldValue = this.field().value?.interestType;

    this.field().value = {
      loanAmount: this.field().value?.loanAmount ?? 0,
      paymentFrequency:
        this.field().value?.paymentFrequency ?? PaymentFrequencies.MONTHLY,
      interestType: value,
      term: this.field().value?.term ?? 5,
      amortization: this.field().value?.amortization ?? 25,
    };

    if (value !== oldValue) {
      this.dataChange.emit(this.field());
    }
  }

  handleTermChange(value: number) {
    const oldValue = this.field().value?.term;
    const number =
      Number.isNaN(value) || `${value}` === ''
        ? undefined
        : parseFloat(`${value}`);

    this.field().value = {
      loanAmount: this.field().value?.loanAmount ?? 0,
      paymentFrequency:
        this.field().value?.paymentFrequency ?? PaymentFrequencies.MONTHLY,
      interestType: this.field().value?.interestType ?? InterestTypes.FIXED,
      term: number,
      amortization: this.field().value?.amortization ?? 25,
    };

    if (number !== oldValue) {
      this.dataChange.emit(this.field());
    }
  }

  handleAmortizationChange(value: number) {
    const oldValue = this.field().value?.amortization;
    const number =
      Number.isNaN(value) || `${value}` === ''
        ? undefined
        : parseFloat(`${value}`);

    this.field().value = {
      loanAmount: this.field().value?.loanAmount ?? 0,
      paymentFrequency:
        this.field().value?.paymentFrequency ?? PaymentFrequencies.MONTHLY,
      interestType: this.field().value?.interestType ?? InterestTypes.FIXED,
      term: this.field().value?.term ?? 5,
      amortization: number,
    };

    if (number !== oldValue) {
      this.dataChange.emit(this.field());
    }
  }

  handlePaymentFrequencyChange(value: PaymentFrequencies) {
    const oldValue = this.field().value?.paymentFrequency;

    this.field().value = {
      loanAmount: this.field().value?.loanAmount ?? 0,
      paymentFrequency: value,
      interestType: this.field().value?.interestType ?? InterestTypes.FIXED,
      term: this.field().value?.term ?? 5,
      amortization: this.field().value?.amortization ?? 25,
    };

    if (value !== oldValue) {
      this.dataChange.emit(this.field());
    }
  }
}
