import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { maskitoTransform } from '@maskito/core';
import {
  getMoneyMaskitoOptions,
  MaskitoExtendedOptions,
} from '../../../../../constants/masks';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { ConfirmationRequiredDirective } from '../../../../../directives/confirmation-required/confirmation-required.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import {
  formatEnumValue,
  getUUID4,
  stripNonNumberCharacters,
} from '../../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LjSelectFieldComponent } from '../../../../../web-components/form/select-field/select-field.component';
import {
  RefinanceLoanTypes,
  UseOfFundsFieldModel,
  UseOfFundTypes,
} from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-use-of-funds',
  imports: [
    MatIconModule,
    LjButtonComponent,
    ActivateDirective,
    LjInputFieldComponent,
    FormsModule,
    MatButtonModule,
    ConfirmationRequiredDirective,
    LjSelectFieldComponent,
  ],
  templateUrl: './use-of-funds.component.html',
  styleUrl: './use-of-funds.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: UseOfFundsComponent }],
})
export class UseOfFundsComponent
  extends AbstractFieldComponent<UseOfFundsFieldModel[]>
  implements OnInit
{
  private moneyMasks: Record<string, MaskitoExtendedOptions> = {};

  getMoneyMask(key: string | number): MaskitoExtendedOptions {
    const _key = String(key);
    if (!this.moneyMasks[_key]) {
      // Create a new independent instance with a unique ID
      this.moneyMasks[_key] = getMoneyMaskitoOptions(
        `${this.field().id}-${_key}`
      );
    }
    return this.moneyMasks[_key] as MaskitoExtendedOptions;
  }

  isMobile = input(false);

  editedUse = model<UseOfFundsFieldModel>(this.getDefaultUse());

  useDetailsTouched = signal(false);
  lenderNameTouched = signal(false);
  refinanceLoanTypeTouched = signal(false);
  amountTouched = signal(false);

  useOfLoanTypes = Object.values(UseOfFundTypes).map(item => {
    return { label: formatEnumValue(item as string), value: item };
  });

  refinanceLoanTypeOptions = [
    {
      label: 'Refinance Real Estate Secured Loans',
      value: RefinanceLoanTypes.REAL_ESTATE_SECURED_LOANS,
    },
    {
      label: 'Refinance Non-Real Estate Secured Loans',
      value: RefinanceLoanTypes.NON_REAL_ESTATE_SECURED_LOANS,
    },
  ];

  ngOnInit() {
    if (
      this.field() &&
      (!this.field().value || !Array.isArray(this.field().value))
    ) {
      this.field().value = [];
    }
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const { value } = this.field();
    const isValid =
      Array.isArray(value) && value.every(use => this.isUseOfFundValid(use));

    if (isValid) {
      return undefined;
    }

    return ValidationErrorKey.MISSING_FIELDS;
  }

  override isValid(): boolean {
    this.touched.set(true);
    this.amountTouched.set(true);
    this.lenderNameTouched.set(true);
    this.useDetailsTouched.set(true);
    return this.getErrorKey() === undefined;
  }

  isEdited(): boolean {
    const { value } = this.field();

    return (
      Array.isArray(value) && value.some(c => c.id === this.editedUse().id)
    );
  }

  isCurrentlyEditedUse(use: UseOfFundsFieldModel): boolean {
    return use.id === this.editedUse().id;
  }

  isRefinance(use: UseOfFundsFieldModel): boolean {
    return use.typeOfUse === UseOfFundTypes.REFINANCE;
  }

  /** Contextual help for the selected type of use (edit + read-only cards). */
  getTypeOfUseHelpText(
    typeOfUse: UseOfFundTypes,
    refinanceLoanType?: RefinanceLoanTypes
  ): string | null {
    const messages: Partial<Record<UseOfFundTypes, string>> = {
      [UseOfFundTypes.WORKING_CAPITAL_FOR_OPERATIONS]:
        'Proceeds to provide liquidity for day-to-day business needs and operating expenses.',
      [UseOfFundTypes.CAPITAL_IMPROVEMENTS]:
        'Proceeds to finance upgrades or improvements to property or business assets, such as building structures, installing irrigation, or repairing fencing and roofing etc.',
      [UseOfFundTypes.CASH_OUT_OR_OTHER]:
        'Other requested loan proceeds not specified above.',
    };
    if (typeOfUse === UseOfFundTypes.REFINANCE) {
      if (refinanceLoanType === RefinanceLoanTypes.REAL_ESTATE_SECURED_LOANS) {
        return 'Proceeds pay off existing loans that are secured by real estate, such as mortgages on agricultural property.';
      }
      if (
        refinanceLoanType === RefinanceLoanTypes.NON_REAL_ESTATE_SECURED_LOANS
      ) {
        return 'Proceeds pay off or pay down debts not tied to real estate, such as equipment loans, operating lines of credit, or private loans.';
      }
      return 'Select the refinance loan type: Real Estate Secured Loans or Non-Real Estate Secured Loans.';
    }
    return messages[typeOfUse] ?? null;
  }

  getRefinanceLoanTypeLabel(value?: RefinanceLoanTypes): string {
    if (value === RefinanceLoanTypes.REAL_ESTATE_SECURED_LOANS) {
      return 'Refinance Real Estate Secured Loans';
    }
    if (value === RefinanceLoanTypes.NON_REAL_ESTATE_SECURED_LOANS) {
      return 'Refinance Non-Real Estate Secured Loans';
    }
    return '';
  }

  getUseDetailsError(use: UseOfFundsFieldModel): string | undefined {
    if (!use.useDetails || use.useDetails === '') {
      return 'Use of Funds is a mandatory field.';
    }

    return undefined;
  }

  getUseDetailsLabel(): string {
    return 'Use of funds';
  }

  getAmountLabel(typeOfUse: UseOfFundTypes): string {
    if (this.isRefinance({ typeOfUse } as UseOfFundsFieldModel)) {
      return 'Current loan balance(s)';
    }
    return 'Estimated amount(s)';
  }

  getAmountError(use: UseOfFundsFieldModel): string | undefined {
    if (use.amount === 0 || isNaN(use.amount)) {
      return 'Amount is a mandatory field.';
    }

    return undefined;
  }

  getRefinanceLoanTypeError(use: UseOfFundsFieldModel): string | undefined {
    if (this.isRefinance(use) && !use.refinanceLoanType) {
      return 'Refinance type is a mandatory field.';
    }
    return undefined;
  }

  getLenderNameError(use: UseOfFundsFieldModel): string | undefined {
    if (this.isRefinance(use) && use.lenderName.trim() === '') {
      return "Lender's name is a mandatory field";
    }

    return undefined;
  }

  getDefaultUse(): UseOfFundsFieldModel {
    return {
      typeOfUse: UseOfFundTypes.REFINANCE,
      refinanceLoanType: RefinanceLoanTypes.REAL_ESTATE_SECURED_LOANS,
      lenderName: '',
      useDetails: '',
      amount: 0,
    };
  }

  handleTypeOfUseChange(value: UseOfFundTypes) {
    const model = this.editedUse();
    model.typeOfUse = value;
    if (value !== UseOfFundTypes.REFINANCE) {
      model.refinanceLoanType = undefined;
    }
    this.editedUse.set(structuredClone(model));
  }

  handleRefinanceLoanTypeChange(value: RefinanceLoanTypes | undefined) {
    if (!value) return;
    const model = this.editedUse();
    if (model.refinanceLoanType !== value) {
      model.refinanceLoanType = value;
      this.refinanceLoanTypeTouched.set(true);
      this.editedUse.set(structuredClone(model));
    }
  }

  handleUseDetailsChange(value: string) {
    const model = this.editedUse();

    if (model.useDetails !== value) {
      this.useDetailsTouched.set(true);
      model.useDetails = value;
      this.editedUse.set(structuredClone(model));
    }
  }

  formatMoney(number: number): string {
    if (number === 0) {
      return '';
    }
    return maskitoTransform(`${number}`, getMoneyMaskitoOptions('money'));
  }

  formatEnumValue(value: string) {
    return formatEnumValue(value);
  }

  handleLenderNameChange(value: string) {
    const model = this.editedUse();
    if (model.lenderName !== value) {
      this.lenderNameTouched.set(true);
      model.lenderName = value;
      this.editedUse.set(structuredClone(model));
    }
  }

  handleAmountChange(value: number | string) {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    const number = Number.isNaN(value)
      ? undefined
      : (parseFloat(stripNonNumberCharacters(`${value}`)) as number);

    const model = this.editedUse();
    if (model.amount !== number) {
      model.amount = number as number;
      this.amountTouched.set(true);
      this.editedUse.set(structuredClone(model));
    }
  }

  isUseOfFundValid(use: UseOfFundsFieldModel): boolean {
    if (this.isRefinance(use)) {
      if (this.getRefinanceLoanTypeError(use)) {
        return false;
      }
      if (this.getLenderNameError(use)) {
        return false;
      }
    } else {
      if (this.getUseDetailsError(use)) {
        return false;
      }
    }

    if (this.getAmountError(use)) {
      return false;
    }

    return true;
  }

  saveUse() {
    const field = this.field();
    const use = this.editedUse();

    this.amountTouched.set(true);
    this.useDetailsTouched.set(true);
    this.lenderNameTouched.set(true);
    this.refinanceLoanTypeTouched.set(true);

    if (!this.isUseOfFundValid(use)) {
      return;
    }

    if (this.isRefinance(use)) {
      use.useDetails = '';
    } else {
      use.lenderName = '';
      use.refinanceLoanType = undefined;
    }

    if (!field.value) {
      return;
    }

    field.value = field.value.map(c => {
      if (c.id === use.id) {
        if (!use.id) {
          use.id = getUUID4();
        }

        return use;
      }

      return c;
    });

    this.editedUse.set(structuredClone(this.getDefaultUse()));
    this.dataChange.emit(field);
    this.cancelEdit();
  }

  cancelEdit() {
    const editedUse = this.editedUse();
    this.editedUse.set(this.getDefaultUse());

    this.amountTouched.set(false);
    this.useDetailsTouched.set(false);
    this.lenderNameTouched.set(false);
    this.refinanceLoanTypeTouched.set(false);

    if (editedUse.id) {
      return;
    }

    const field = this.field();

    if (!field.value) {
      return;
    }

    field.value = field.value.filter(c => Boolean(c.id));
  }

  addNewUse() {
    const field = this.field();
    const use = this.getDefaultUse();

    this.amountTouched.set(false);
    this.useDetailsTouched.set(false);
    this.lenderNameTouched.set(false);
    this.refinanceLoanTypeTouched.set(false);

    if (!field.value) {
      return;
    }

    field.value.push(use);
    this.editedUse.set(structuredClone(use));
  }

  removeUse(use: UseOfFundsFieldModel) {
    const field = this.field();
    field.value = Array.isArray(field.value)
      ? field.value.filter(c => c.id !== use.id)
      : field.value;
    this.field.set(field);
  }

  getFunds() {
    if (this.mode() === 'locked') {
      return (this.field().value ?? []).filter(fund => {
        return this.isUseOfFundValid(fund);
      });
    }

    return this.field().value ?? [];
  }
}
