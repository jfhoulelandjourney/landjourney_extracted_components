import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FieldDirective } from '../../../../../directives/field.directive';
import {
  formatEnumValue,
  getUUID4,
  stripNonNumberCharacters,
} from '../../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { AbstractFieldComponent } from '../../abstract-field.component';

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MaskitoOptions, maskitoTransform } from '@maskito/core';
import {
  getMoneyMaskitoOptions,
  numberMaskitoMask,
} from '../../../../../constants/masks';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { ConfirmationRequiredDirective } from '../../../../../directives/confirmation-required/confirmation-required.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LjSelectFieldComponent } from '../../../../../web-components/form/select-field/select-field.component';
import {
  CropDetailsFieldModel,
  IrrigationTypes,
} from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';

@Component({
  selector: 'lj-df-crop-details',
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
  templateUrl: './crop-details.component.html',
  styleUrl: './crop-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: CropDetailsComponent }],
})
export class CropDetailsComponent
  extends AbstractFieldComponent<CropDetailsFieldModel[]>
  implements OnInit
{
  moneyMask: MaskitoOptions = getMoneyMaskitoOptions('crop-details');

  numberMask: MaskitoOptions = numberMaskitoMask();

  isMobile = input(false);

  editedCrop = model<CropDetailsFieldModel>(this.getDefaultCrop());

  cropTypeTouched = signal(false);
  numberOfAcresTouched = signal(false);
  expectedLandValueTouched = signal(false);
  expectedYieldValueTouched = signal(false);
  expectedYieldUnitTouched = signal(false);
  expectedYieldUnitOtherTouched = signal(false);
  revenueInsuranceDetailsTouched = signal(false);
  percentageIrrigatedTouched = signal(false);

  // TODO: This should be an enum.
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
    'Other',
  ].map(item => {
    return { label: formatEnumValue(item), value: item };
  });

  irrigationOptions = [
    { label: 'Irrigated', value: IrrigationTypes.IRRIGATED },
    { label: 'Non-Irrigated', value: IrrigationTypes.NON_IRRIGATED },
    { label: 'Both', value: IrrigationTypes.BOTH },
  ];

  // LIFECYCLE

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
      Array.isArray(value) &&
      value.every(crop => this.isCropDetailsValid(crop));

    if (isValid) {
      return undefined;
    }

    return ValidationErrorKey.MISSING_FIELDS;
  }

  override isValid(): boolean {
    this.touched.set(true);
    this.cropTypeTouched.set(true);
    this.numberOfAcresTouched.set(true);
    this.expectedLandValueTouched.set(true);
    this.expectedYieldValueTouched.set(true);
    this.expectedYieldUnitTouched.set(true);
    this.expectedYieldUnitOtherTouched.set(true);
    this.revenueInsuranceDetailsTouched.set(true);
    this.percentageIrrigatedTouched.set(true);

    return this.getErrorKey() === undefined;
  }

  isEdited(): boolean {
    const { value } = this.field();
    return (
      Array.isArray(value) && value.some(c => c.id === this.editedCrop().id)
    );
  }

  isCurrentlyEditedCrop(crop: CropDetailsFieldModel): boolean {
    return crop.id === this.editedCrop().id;
  }

  getDefaultCrop(): CropDetailsFieldModel {
    return {
      cropType: '',
      irrigation: IrrigationTypes.NON_IRRIGATED,
      percentageIrrigated: 0,
      numberOfAcres: 0,
      expectedLandValue: 0,
      expectedYieldValue: 0,
      expectedYieldUnit: 'Acres',
      expectedYieldUnitOther: '',
      revenueInsuranceDetails: '',
    };
  }

  isOtherUnitSelected(unit: string): boolean {
    return unit === 'Other';
  }

  getExpectedYieldUnitDisplayValue(crop: CropDetailsFieldModel): string {
    if (this.isOtherUnitSelected(crop.expectedYieldUnit)) {
      return (crop.expectedYieldUnitOther ?? '').trim() || 'other';
    }
    return crop.expectedYieldUnit;
  }

  handleCropTypeChange(value: string) {
    const model = this.editedCrop();

    if (model.cropType !== value) {
      model.cropType = value;
      this.editedCrop.set(structuredClone(model));
      this.cropTypeTouched.set(true);
    }
  }

  handleIrrigationChange(value: IrrigationTypes) {
    const model = this.editedCrop();

    if (model.irrigation !== value) {
      model.irrigation = value;
      this.editedCrop.set(structuredClone(model));
    }
  }

  handleIrrigationPercentageChange(value: string | number) {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    const number = Number.isNaN(value)
      ? undefined
      : (parseFloat(stripNonNumberCharacters(`${value}`)) as number);

    const model = this.editedCrop();

    if (model.percentageIrrigated !== number) {
      model.percentageIrrigated = number as number;
      this.editedCrop.set(structuredClone(model));

      this.percentageIrrigatedTouched.set(true);
    }
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
    const yieldUnit = this.getExpectedYieldUnitDisplayValue(crop).toLowerCase();
    return `A ${this.formatNumber(crop.numberOfAcres)} acres land, for an average price of ${this.formatMoney(crop.expectedLandValue)}, with an expected yield of ${this.formatNumber(crop.expectedYieldValue)} ${yieldUnit}`;
  }

  formatRevenueInsuranceDetailsMessage(crop: CropDetailsFieldModel): string {
    if (crop.revenueInsuranceDetails.trim() === '') {
      return 'Revenue insurance and type not provided';
    }

    return crop.revenueInsuranceDetails;
  }

  handleNumberOfAcresChange(value: number | string) {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    const number = Number.isNaN(value)
      ? undefined
      : (parseFloat(stripNonNumberCharacters(`${value}`)) as number);

    const model = this.editedCrop();

    if (model.numberOfAcres !== number) {
      model.numberOfAcres = number as number;
      this.editedCrop.set(structuredClone(model));

      this.numberOfAcresTouched.set(true);
    }
  }

  handleExpectedLandValueChange(value: number | string) {
    if (value === '' || value === null || value === undefined) {
      return;
    }

    const number = Number.isNaN(value)
      ? undefined
      : (parseFloat(stripNonNumberCharacters(`${value}`)) as number);

    const model = this.editedCrop();

    if (model.expectedLandValue !== number) {
      model.expectedLandValue = number as number;
      this.editedCrop.set(structuredClone(model));
      this.expectedLandValueTouched.set(true);
    }
  }

  handleExpectedYieldValueChange(value: number | string) {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    const number = Number.isNaN(value)
      ? undefined
      : (parseFloat(stripNonNumberCharacters(`${value}`)) as number);

    const model = this.editedCrop();

    if (model.expectedYieldValue !== number) {
      model.expectedYieldValue = number as number;
      this.editedCrop.set(structuredClone(model));
      this.expectedYieldValueTouched.set(true);
    }
  }

  handleExpectedYieldUnitChange(value: string) {
    const model = this.editedCrop();
    if (model.expectedYieldUnit !== value) {
      model.expectedYieldUnit = value;
      if (!this.isOtherUnitSelected(value)) {
        model.expectedYieldUnitOther = '';
      }
      this.editedCrop.set(structuredClone(model));
      this.expectedYieldUnitTouched.set(true);
    }
  }

  handleExpectedYieldUnitOtherChange(value: string) {
    const model = this.editedCrop();
    if (model.expectedYieldUnitOther !== value) {
      model.expectedYieldUnitOther = value;
      this.editedCrop.set(structuredClone(model));
      this.expectedYieldUnitOtherTouched.set(true);
    }
  }

  handleRevenueInsuranceDetailsChange(value: string) {
    const model = this.editedCrop();
    if (model.revenueInsuranceDetails !== value) {
      model.revenueInsuranceDetails = value;
      this.editedCrop.set(structuredClone(model));
      this.revenueInsuranceDetailsTouched.set(true);
    }
  }

  getCropTypeError(crop: CropDetailsFieldModel): string | undefined {
    if (!crop.cropType || crop.cropType === '') {
      return 'Crop type is mandatory';
    }

    return undefined;
  }

  getNumberOfAcresError(crop: CropDetailsFieldModel): string | undefined {
    if (crop.numberOfAcres === 0 || isNaN(crop.numberOfAcres)) {
      return 'Number of acres is a mandatory field';
    }

    return undefined;
  }

  getExpectedLandValueError(crop: CropDetailsFieldModel): string | undefined {
    if (crop.expectedLandValue === 0 || isNaN(crop.expectedLandValue)) {
      return 'Average price is a mandatory field';
    }

    return undefined;
  }

  getExpectedYieldValueError(crop: CropDetailsFieldModel): string | undefined {
    if (crop.expectedYieldValue === 0 || isNaN(crop.expectedYieldValue)) {
      return 'Yield is a mandatory field';
    }

    return undefined;
  }

  getExpectedYieldUnitError(crop: CropDetailsFieldModel): string | undefined {
    if (!crop.expectedYieldUnit || crop.expectedYieldUnit === '') {
      return 'Unit is a mandatory field';
    }

    return undefined;
  }

  getExpectedYieldUnitOtherError(
    crop: CropDetailsFieldModel
  ): string | undefined {
    if (
      this.isOtherUnitSelected(crop.expectedYieldUnit) &&
      !(crop.expectedYieldUnitOther ?? '').trim()
    ) {
      return 'Please specify the unit';
    }
    return undefined;
  }

  getRevenueInsuranceDetailsError(
    crop: CropDetailsFieldModel
  ): string | undefined {
    if (!crop.revenueInsuranceDetails || crop.revenueInsuranceDetails === '') {
      return 'Revenue insurance details is mandatory';
    }

    return undefined;
  }

  getPercentageIrrigatedError(crop: CropDetailsFieldModel): string | undefined {
    if (crop.percentageIrrigated === 0 || isNaN(crop.percentageIrrigated)) {
      return 'Percentage irrigated is a mandatory field';
    }

    if (!isNaN(crop.percentageIrrigated) && crop.percentageIrrigated > 100) {
      return 'Percentage cannot be greater than 100';
    }

    return undefined;
  }

  isCropDetailsValid(crop: CropDetailsFieldModel): boolean {
    if (this.getCropTypeError(crop)) {
      return false;
    }

    if (this.getNumberOfAcresError(crop)) {
      return false;
    }
    if (this.getExpectedLandValueError(crop)) {
      return false;
    }
    if (this.getExpectedYieldValueError(crop)) {
      return false;
    }
    if (this.getExpectedYieldUnitError(crop)) {
      return false;
    }
    if (this.getExpectedYieldUnitOtherError(crop)) {
      return false;
    }
    if (this.getRevenueInsuranceDetailsError(crop)) {
      return false;
    }
    if (
      crop.irrigation === IrrigationTypes.BOTH &&
      this.getPercentageIrrigatedError(crop)
    ) {
      return false;
    }
    return true;
  }

  saveCrop() {
    const field = this.field();
    const crop = this.editedCrop();

    this.cropTypeTouched.set(true);
    this.numberOfAcresTouched.set(true);
    this.expectedLandValueTouched.set(true);
    this.expectedYieldValueTouched.set(true);
    this.expectedYieldUnitTouched.set(true);
    this.expectedYieldUnitOtherTouched.set(true);
    this.revenueInsuranceDetailsTouched.set(true);
    this.percentageIrrigatedTouched.set(true);

    if (!this.isCropDetailsValid(crop)) {
      return;
    }

    if (!field.value) {
      return;
    }

    field.value = field.value.map(c => {
      if (c.id === crop.id) {
        if (!crop.id) {
          crop.id = getUUID4();
        }

        return crop;
      }

      return c;
    });

    this.editedCrop.set(structuredClone(this.getDefaultCrop()));
    this.dataChange.emit(field);
    this.cancelEdit();
  }

  cancelEdit() {
    const editedCrop = this.editedCrop();
    this.editedCrop.set(this.getDefaultCrop());

    this.cropTypeTouched.set(false);
    this.numberOfAcresTouched.set(false);
    this.expectedLandValueTouched.set(false);
    this.expectedYieldValueTouched.set(false);
    this.expectedYieldUnitTouched.set(false);
    this.expectedYieldUnitOtherTouched.set(false);
    this.revenueInsuranceDetailsTouched.set(false);
    this.percentageIrrigatedTouched.set(false);

    if (editedCrop.id) {
      return;
    }

    const field = this.field();

    if (!field.value) {
      return;
    }

    field.value = field.value.filter(c => Boolean(c.id));
  }

  addNewCrop() {
    const field = this.field();
    const crop = this.getDefaultCrop();

    this.cropTypeTouched.set(false);
    this.numberOfAcresTouched.set(false);
    this.expectedLandValueTouched.set(false);
    this.expectedYieldValueTouched.set(false);
    this.expectedYieldUnitTouched.set(false);
    this.expectedYieldUnitOtherTouched.set(false);
    this.revenueInsuranceDetailsTouched.set(false);
    this.percentageIrrigatedTouched.set(false);

    if (!field.value) {
      return;
    }

    field.value.push(crop);
    this.editedCrop.set(structuredClone(crop));
  }

  removeCrop(crop: CropDetailsFieldModel) {
    const field = this.field();
    field.value = Array.isArray(field.value)
      ? field.value.filter(c => c.id !== crop.id)
      : field.value;
    this.field.set(field);
  }

  getCrops() {
    if (this.mode() === 'locked') {
      return (this.field().value ?? []).filter(crop => {
        return this.isCropDetailsValid(crop);
      });
    }

    return this.field().value ?? [];
  }
}
