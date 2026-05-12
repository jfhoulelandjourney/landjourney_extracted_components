import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { maskitoTransform } from '@maskito/core';
import {
  getMoneyMaskitoOptions,
  MaskitoExtendedOptions,
} from '../../../../../constants/masks';
import { FieldDirective } from '../../../../../directives/field.directive';
import { formatEnumValue } from '../../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LjSelectFieldComponent } from '../../../../../web-components/form/select-field/select-field.component';
import {
  RefinanceLoanTypes,
  UseOfFundsFieldModel,
  UseOfFundTypes,
} from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';

@Component({
  selector: 'lj-df-use-of-funds',
  imports: [
    MatIconModule,
    LjButtonComponent,
    LjInputFieldComponent,
    FormsModule,
    MatSliderModule,
    MatButtonModule,
    LjSelectFieldComponent,
    EditableInputComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
  ],
  templateUrl: './use-of-funds.component.html',
  styleUrl: './use-of-funds.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: UseOfFundsComponent }],
})
export class UseOfFundsComponent extends AbstractFieldComponent<
  UseOfFundsFieldModel[]
> {
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

  editedUse = model<UseOfFundsFieldModel>(this.getDefaultUse());
  nonEditedUse = model<UseOfFundsFieldModel>(this.getDefaultUse());

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

  isRefinance(use: UseOfFundsFieldModel): boolean {
    return use.typeOfUse === UseOfFundTypes.REFINANCE;
  }

  /** Contextual help for the selected type of use (editor preview). */
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

  getUseDetailsLabel(): string {
    return 'Use of funds';
  }

  getAmountLabel(typeOfUse: UseOfFundTypes): string {
    if (this.isRefinance({ typeOfUse } as UseOfFundsFieldModel)) {
      return 'Current loan balance(s)';
    }
    return 'Estimated amount(s)';
  }

  getDefaultUse(): UseOfFundsFieldModel {
    return {
      typeOfUse: UseOfFundTypes.REFINANCE,
      refinanceLoanType: RefinanceLoanTypes.REAL_ESTATE_SECURED_LOANS,
      lenderName: 'Lender Bank',
      useDetails: '',
      amount: 15351.55,
    };
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
}
