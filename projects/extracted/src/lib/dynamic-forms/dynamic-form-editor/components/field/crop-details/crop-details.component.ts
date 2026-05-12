import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MaskitoOptions, maskitoTransform } from '@maskito/core';
import {
  getMoneyMaskitoOptions,
  numberMaskitoMask,
} from '../../../../../constants/masks';
import { FieldDirective } from '../../../../../directives/field.directive';
import {
  formatEnumValue,
  stripNonNumberCharacters,
} from '../../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LjSelectFieldComponent } from '../../../../../web-components/form/select-field/select-field.component';
import {
  CropDetailsFieldModel,
  IrrigationTypes,
} from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';

@Component({
  selector: 'lj-df-crop-details',
  imports: [
    MatIconModule,
    LjButtonComponent,
    LjInputFieldComponent,
    FormsModule,
    MatButtonModule,
    LjSelectFieldComponent,
    FieldConfigurationComponent,
    ConditionalLogicComponent,
    EditableInputComponent,
  ],
  templateUrl: './crop-details.component.html',
  styleUrl: './crop-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: CropDetailsComponent }],
})
export class CropDetailsComponent extends AbstractFieldComponent<
  CropDetailsFieldModel[]
> {
  readonly IrrigationTypes = IrrigationTypes;

  moneyMask: MaskitoOptions = getMoneyMaskitoOptions('crop-details');
  numberMask: MaskitoOptions = numberMaskitoMask();
  editedCrop = signal<CropDetailsFieldModel>(this.getDefaultCrop());
  nonEditedCrop = signal<CropDetailsFieldModel>(this.getDefaultCrop());

  irrigationOptions = [
    { label: 'Irrigated', value: IrrigationTypes.IRRIGATED },
    { label: 'Non-Irrigated', value: IrrigationTypes.NON_IRRIGATED },
    { label: 'Both', value: IrrigationTypes.BOTH },
  ];

  yieldUnitOptions = [
    'Acres',
    'Bags',
    'Bales',
    'Boxes',
    'Bunches',
    'Bushels',
    'Gallons',
    'Hundredweight (cwt)',
    'Kilograms',
    'Liters',
    'Metric tons',
    'Pounds',
    'Square feet',
    'Tons',
    'Units',
    '$ in total',
  ].map(item => {
    return { label: formatEnumValue(item), value: item };
  });

  getDefaultCrop(): CropDetailsFieldModel {
    return {
      cropType: 'Wheat',
      irrigation: IrrigationTypes.BOTH,
      percentageIrrigated: 65,
      numberOfAcres: 5,
      expectedLandValue: 100,
      expectedYieldValue: 230,
      expectedYieldUnit: 'Kilograms',
      revenueInsuranceDetails: '',
    };
  }

  formatMoney(number: number): string {
    if (number === 0) {
      return '';
    }
    return maskitoTransform(
      stripNonNumberCharacters(`${number}`),
      this.moneyMask
    );
  }

  formatNumber(number: number): string {
    if (number === 0) {
      return '';
    }
    return maskitoTransform(
      stripNonNumberCharacters(`${number}`),
      this.numberMask
    );
  }

  formatIrrigationMessage(crop: CropDetailsFieldModel): string {
    if (crop.irrigation === IrrigationTypes.IRRIGATED) {
      return `Irrigated - ${crop.percentageIrrigated}%`;
    }

    if (crop.irrigation === IrrigationTypes.NON_IRRIGATED) {
      return 'Non-irrigated';
    }

    return `Both irrigated and non-irrigated at a percentage of ${crop.percentageIrrigated}%`;
  }

  formatAcresAndPriceMessage(crop: CropDetailsFieldModel): string {
    return `A ${this.formatNumber(crop.numberOfAcres)} acres land, for an average price of ${this.formatMoney(crop.expectedLandValue)}, with an expected yield of ${this.formatNumber(crop.expectedYieldValue)} ${crop.expectedYieldUnit.toLowerCase()}`;
  }

  formatRevenueInsuranceDetailsMessage(crop: CropDetailsFieldModel): string {
    if (crop.revenueInsuranceDetails.trim() === '') {
      return 'Revenue insurance and type not provided';
    }

    return crop.revenueInsuranceDetails;
  }
}
