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
  LivestockDetailsFieldModel,
  LivestockTypes,
} from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';

@Component({
  selector: 'lj-df-livestock-details',
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
  templateUrl: './livestock-details.component.html',
  styleUrl: './livestock-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: LivestockDetailsComponent },
  ],
})
export class LivestockDetailsComponent
  extends AbstractFieldComponent<LivestockDetailsFieldModel[]>
  implements OnInit
{
  moneyMask: MaskitoOptions = getMoneyMaskitoOptions('livestock-details');

  numberMask: MaskitoOptions = numberMaskitoMask();

  isMobile = input(false);

  editedLivestock = model<LivestockDetailsFieldModel>(
    this.getDefaultLiveStock()
  );

  liveStockTypes = Object.values(LivestockTypes).map(item => {
    return { label: formatEnumValue(item as string), value: item };
  });

  otherDetailsTouched = signal(false);
  herdSizeTouched = signal(false);
  typeOfOperationTouched = signal(false);
  averageSaleQuantityTouched = signal(false);
  averageSalePricePerHeadTouched = signal(false);
  averageHeadSoldPerYearTouched = signal(false);

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
      value.every(livestock => this.isLivestockValid(livestock));

    if (isValid) {
      return undefined;
    }

    return ValidationErrorKey.MISSING_FIELDS;
  }

  override isValid(): boolean {
    this.touched.set(true);
    this.otherDetailsTouched.set(true);
    this.herdSizeTouched.set(true);
    this.typeOfOperationTouched.set(true);
    this.averageSaleQuantityTouched.set(true);
    this.averageSalePricePerHeadTouched.set(true);
    this.averageHeadSoldPerYearTouched.set(true);

    return this.getErrorKey() === undefined;
  }

  isEdited(): boolean {
    const { value } = this.field();

    return (
      Array.isArray(value) &&
      value.some(c => c.id === this.editedLivestock().id)
    );
  }

  isCurrentlyEditedLivestock(livestock: LivestockDetailsFieldModel): boolean {
    return livestock.id === this.editedLivestock().id;
  }

  isOtherTypeOfLivestock(livestock: LivestockDetailsFieldModel): boolean {
    return livestock.typeOfLiveStock === LivestockTypes.OTHER;
  }

  getDefaultLiveStock(): LivestockDetailsFieldModel {
    return {
      typeOfLiveStock: LivestockTypes.BEEF_CATTLE,
      typeOfOperation: '',
      otherDetails: '',
      herdSize: 0,
      averageSaleQuantity: '',
      averageSalePricePerHead: 0,
      averageHeadSoldPerYear: 0,
      integratorOrMarketerName: '',
      comments: '',
    };
  }

  handleTypeOfLivestockChange(value: LivestockTypes) {
    const model = this.editedLivestock();
    model.typeOfLiveStock = value;
    this.editedLivestock.set(structuredClone(model));
  }

  handleTypeOfOperationChange(value: string) {
    const model = this.editedLivestock();

    if (model.typeOfOperation !== value) {
      model.typeOfOperation = value;
      this.editedLivestock.set(structuredClone(model));
      this.typeOfOperationTouched.set(true);
    }
  }

  getTypeOfOperationError(
    livestock: LivestockDetailsFieldModel
  ): string | undefined {
    if (!livestock.typeOfOperation || livestock.typeOfOperation === '') {
      return 'Type of Operation is mandatory';
    }

    return undefined;
  }

  handleOtherDetailsChange(value: string) {
    const model = this.editedLivestock();

    if (model.otherDetails !== value) {
      model.otherDetails = value;
      this.editedLivestock.set(structuredClone(model));
      this.otherDetailsTouched.set(true);
    }
  }

  getOtherDetailsError(
    livestock: LivestockDetailsFieldModel
  ): string | undefined {
    if (!livestock.otherDetails || livestock.otherDetails === '') {
      return 'Type of Livestock is mandatory';
    }

    return undefined;
  }

  handleHerdSizeChange(value: number | string) {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    const number = Number.isNaN(value)
      ? undefined
      : (parseFloat(stripNonNumberCharacters(`${value}`)) as number);

    const model = this.editedLivestock();

    if (model.herdSize !== number) {
      model.herdSize = number as number;
      this.editedLivestock.set(structuredClone(model));
      this.herdSizeTouched.set(true);
    }
  }

  getHerdSizeError(livestock: LivestockDetailsFieldModel): string | undefined {
    if (livestock.herdSize === 0 || isNaN(livestock.herdSize)) {
      return 'Number of Heads is mandatory';
    }

    return undefined;
  }

  handleAverageSaleQuantityChange(value: string) {
    const model = this.editedLivestock();

    if (model.averageSaleQuantity !== value) {
      model.averageSaleQuantity = value;
      this.editedLivestock.set(structuredClone(model));
      this.averageSaleQuantityTouched.set(true);
    }
  }

  getAverageSaleQuantityError(
    livestock: LivestockDetailsFieldModel
  ): string | undefined {
    if (
      !livestock.averageSaleQuantity ||
      livestock.averageSaleQuantity.trim() === ''
    ) {
      return 'Average Sale Weight or Yield is mandatory';
    }

    return undefined;
  }

  handleAveragePricePerHeadChange(value: number | string) {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    const number = Number.isNaN(value)
      ? undefined
      : (parseFloat(stripNonNumberCharacters(`${value}`)) as number);

    const model = this.editedLivestock();
    if (model.averageSalePricePerHead !== number) {
      model.averageSalePricePerHead = number as number;
      this.editedLivestock.set(structuredClone(model));
      this.averageSalePricePerHeadTouched.set(true);
    }
  }

  getAverageSalePricePerHeadError(
    livestock: LivestockDetailsFieldModel
  ): string | undefined {
    if (
      livestock.averageSalePricePerHead === 0 ||
      isNaN(livestock.averageSalePricePerHead)
    ) {
      return 'Average sale price per head is mandatory';
    }

    return undefined;
  }

  handleHeadSoldPerYearChange(value: number | string) {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    const number = Number.isNaN(value)
      ? undefined
      : (parseFloat(stripNonNumberCharacters(`${value}`)) as number);

    const model = this.editedLivestock();
    if (model.averageHeadSoldPerYear !== number) {
      model.averageHeadSoldPerYear = number as number;
      this.editedLivestock.set(structuredClone(model));
      this.averageHeadSoldPerYearTouched.set(true);
    }
  }

  getAverageHeadSoldPerYearError(
    livestock: LivestockDetailsFieldModel
  ): string | undefined {
    if (
      livestock.averageHeadSoldPerYear === 0 ||
      isNaN(livestock.averageHeadSoldPerYear)
    ) {
      return 'Average livestock sold per year is mandatory';
    }

    return undefined;
  }

  handleIntegratorMarketerNameChange(value: string) {
    const model = this.editedLivestock();
    model.integratorOrMarketerName = value;
    this.editedLivestock.set(structuredClone(model));
  }

  handleCommentChange(value: string) {
    const model = this.editedLivestock();
    model.comments = value;
    this.editedLivestock.set(structuredClone(model));
  }

  formatMoney(number: number): string {
    if (number === 0) {
      return '';
    }
    return maskitoTransform(`${number}`, this.moneyMask);
  }

  formatNumber(number: number): string {
    if (number === 0) {
      return '';
    }
    return maskitoTransform(`${number}`, this.numberMask);
  }

  formatEnumValue(value: string) {
    return formatEnumValue(value);
  }

  isLivestockValid(livestock: LivestockDetailsFieldModel): boolean {
    if (this.isOtherTypeOfLivestock(livestock)) {
      if (this.getOtherDetailsError(livestock)) {
        return false;
      }
    }

    if (this.getHerdSizeError(livestock)) {
      return false;
    }

    if (this.getTypeOfOperationError(livestock)) {
      return false;
    }

    if (this.getAverageSaleQuantityError(livestock)) {
      return false;
    }

    if (this.getAverageSalePricePerHeadError(livestock)) {
      return false;
    }

    if (this.getAverageHeadSoldPerYearError(livestock)) {
      return false;
    }

    return true;
  }

  saveLivestock() {
    const field = this.field();
    const livestock = this.editedLivestock();

    this.otherDetailsTouched.set(true);
    this.herdSizeTouched.set(true);
    this.typeOfOperationTouched.set(true);
    this.averageSaleQuantityTouched.set(true);
    this.averageSalePricePerHeadTouched.set(true);
    this.averageHeadSoldPerYearTouched.set(true);

    if (!this.isLivestockValid(livestock)) {
      return;
    }

    if (livestock.typeOfLiveStock !== LivestockTypes.OTHER) {
      livestock.otherDetails = '';
    }

    if (!field.value) {
      return;
    }

    field.value = field.value.map(c => {
      if (c.id === livestock.id) {
        if (!livestock.id) {
          livestock.id = getUUID4();
        }

        return livestock;
      }

      return c;
    });

    this.editedLivestock.set(structuredClone(this.getDefaultLiveStock()));
    this.dataChange.emit(field);
    this.cancelEdit();
  }

  cancelEdit() {
    const editedLivestock = this.editedLivestock();
    this.editedLivestock.set(this.getDefaultLiveStock());

    this.otherDetailsTouched.set(false);
    this.herdSizeTouched.set(false);
    this.typeOfOperationTouched.set(false);
    this.averageSaleQuantityTouched.set(false);
    this.averageSalePricePerHeadTouched.set(false);
    this.averageHeadSoldPerYearTouched.set(false);

    if (editedLivestock.id) {
      return;
    }

    const field = this.field();

    if (!field.value) {
      return;
    }

    field.value = field.value.filter(c => Boolean(c.id));
  }

  addNewLivestock() {
    const field = this.field();
    const livestock = this.getDefaultLiveStock();

    this.otherDetailsTouched.set(false);
    this.herdSizeTouched.set(false);
    this.typeOfOperationTouched.set(false);
    this.averageSaleQuantityTouched.set(false);
    this.averageSalePricePerHeadTouched.set(false);
    this.averageHeadSoldPerYearTouched.set(false);

    if (!field.value) {
      return;
    }

    field.value.push(livestock);
    this.editedLivestock.set(structuredClone(livestock));
  }

  removeLivestock(livestock: LivestockDetailsFieldModel) {
    const field = this.field();
    field.value = Array.isArray(field.value)
      ? field.value.filter(c => c.id !== livestock.id)
      : field.value;
    this.field.set(field);
  }

  getLivestock() {
    if (this.mode() === 'locked') {
      return (this.field().value ?? []).filter(livestock => {
        return this.isLivestockValid(livestock);
      });
    }

    return this.field().value ?? [];
  }
}
