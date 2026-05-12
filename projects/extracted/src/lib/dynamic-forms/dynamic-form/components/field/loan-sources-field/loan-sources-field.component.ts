import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { AbstractFieldComponent } from '../../abstract-field.component';

import { maskitoTransform } from '@maskito/core';
import {
  getMoneyMaskitoOptions,
  MaskitoExtendedOptions,
} from '../../../../../constants/masks';
import { FieldDirective } from '../../../../../directives/field.directive';
import { stripNonNumberCharacters } from '../../../../../utils/stringUtil';
import type {
  LoanSourceFieldModel,
  SourceDetail,
} from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';

@Component({
  selector: 'lj-df-loan-sources-field',
  templateUrl: './loan-sources-field.component.html',
  styleUrls: ['./loan-sources-field.component.scss'],
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    ActivateDirective,
    LjInputFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: LoanSourcesFieldComponent },
  ],
})
export class LoanSourcesFieldComponent
  extends AbstractFieldComponent<LoanSourceFieldModel>
  implements OnInit
{
  isMobile = input(false);

  private moneyMasks: Record<string, MaskitoExtendedOptions> = {};

  getMoneyMask(key: string | number): MaskitoExtendedOptions {
    if (!this.moneyMasks[key]) {
      // Create a new independent instance with a unique ID
      this.moneyMasks[key] = getMoneyMaskitoOptions(
        `${this.field().id}-${key}`
      );
    }
    return this.moneyMasks[key] as MaskitoExtendedOptions;
  }

  purchasedPriceTouched = signal(false);
  dataSource?: MatTableDataSource<LoanSourceFieldModel>;
  displayedColumns: string[] = ['source', 'amount', 'actions'];

  @ViewChild(MatTable) table?: MatTable<LoanSourceFieldModel>;

  ngOnInit() {
    if (
      this.field() &&
      (!this.field().value ||
        !Array.isArray((this.field().value ?? {}).sources ?? []))
    ) {
      this.field().value = {
        purchasePrice: undefined,
        armsLengthTransaction: false,
        sources: [
          {
            source: '',
            amount: undefined,
          },
        ],
      };
    }
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const { value } = this.field();

    if (!value?.purchasePrice) {
      return ValidationErrorKey.MISSING_PURCHASE_PRICE;
    }

    if (!value?.sources || value.sources.length === 0) {
      return ValidationErrorKey.REQUIRED;
    }

    for (const loanSources of value.sources) {
      if (loanSources) {
        if (loanSources.source.trim() === '') {
          return ValidationErrorKey.MISSING_SOURCE;
        }
        if (`${loanSources.amount}` === '') {
          return ValidationErrorKey.MISSING_SOURCE_AMOUNT;
        }
      }
    }

    if (this.getTotal() !== (value.purchasePrice ?? 0)) {
      return ValidationErrorKey.TOTAL_AMOUNT_MISMATCH;
    }

    return undefined;
  }

  override isValid(): boolean {
    this.purchasedPriceTouched.set(true);
    this.touched.set(true);
    return this.getErrorKey() === undefined;
  }

  handleOnBlur() {
    this.purchasedPriceTouched.set(true);
  }

  getPurchagePriceErrorMessage(): string | undefined {
    const { value } = this.field();
    if (!value?.purchasePrice) {
      return 'The Purchase price is a required field';
    }

    return undefined;
  }

  addRow(): void {
    const field = this.field();
    if (field && field.value) {
      field.value.sources.push({
        source: '',
        amount: undefined,
      });
      this.dataChange.emit(field);
    }
  }

  removeRow(index: number): void {
    const field = this.field();
    if (field && field.value) {
      this.touched.set(true);
      field.value.sources.splice(index, 1);
      this.dataChange.emit(field);
    }
  }

  getTotal(): number {
    const field = this.field();

    if (field && field.value) {
      return (
        field.value.sources.reduce(
          (accumulator: number, element: SourceDetail) =>
            accumulator +
            (isNaN(Number(element.amount)) ? 0 : Number(element.amount)),
          0
        ) || 0
      );
    } else {
      return 0;
    }
  }

  handlePurchasePriceChange(value: string) {
    const number = Number.isNaN(value)
      ? undefined
      : parseFloat(`${value}`.replaceAll(',', '').replaceAll('$', ''));

    const oldValue = this.field().value?.purchasePrice;

    this.field().value = {
      purchasePrice: number,
      armsLengthTransaction: this.field().value?.armsLengthTransaction ?? false,
      sources: this.field().value?.sources ?? [
        {
          source: '',
          amount: 0,
        },
      ],
    };

    if (number !== oldValue) {
      this.touched.set(true);
      this.dataChange.emit(this.field());
    }
  }

  handleArmsLengthTransactionChange(value: boolean) {
    const oldValue = this.field().value?.armsLengthTransaction;

    this.field().value = {
      purchasePrice: this.field().value?.purchasePrice ?? 0,
      armsLengthTransaction: value,
      sources: this.field().value?.sources ?? [
        {
          source: '',
          amount: 0,
        },
      ],
    };

    if (value !== oldValue) {
      this.touched.set(true);
      this.dataChange.emit(this.field());
    }
  }

  formatMoney(number: number): string {
    if (number === 0) {
      return '';
    }
    return maskitoTransform(
      stripNonNumberCharacters(`${number}`),
      getMoneyMaskitoOptions('money')
    );
  }

  updateElementSource(value: string, index: number) {
    const field = this.field();

    const oldValue = field.value ? field.value.sources[index] : undefined;

    if (!field.value || !oldValue) {
      return;
    }

    field.value.sources[index] = {
      source: value,
      amount: oldValue.amount,
    };

    if (value !== oldValue.source) {
      this.touched.set(true);
      this.dataChange.emit(field);
    }
  }

  updateElementAmount(value: string, index: number) {
    const field = this.field();

    const oldValue = field.value ? field.value.sources[index] : undefined;

    if (!field.value || !oldValue) {
      return;
    }

    const number = Number.isNaN(value)
      ? undefined
      : parseFloat(`${value}`.replaceAll(',', '').replaceAll('$', ''));

    field.value.sources[index] = {
      source: oldValue.source,
      amount: number,
    };

    if (number !== oldValue.amount) {
      this.touched.set(true);
      this.dataChange.emit(field);
    }
  }
}
