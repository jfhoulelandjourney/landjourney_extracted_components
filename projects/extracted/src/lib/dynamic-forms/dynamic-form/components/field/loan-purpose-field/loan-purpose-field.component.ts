import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import type { LoanPurposeFieldModel } from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-loan-purpose-field',
  templateUrl: './loan-purpose-field.component.html',
  styleUrls: ['./loan-purpose-field.component.scss'],
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    ActivateDirective,
    LjInputFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: LoanPurposeFieldComponent },
  ],
})
export class LoanPurposeFieldComponent
  extends AbstractFieldComponent<LoanPurposeFieldModel[]>
  implements OnInit
{
  isMobile = input(false);

  ngOnInit() {
    if (
      this.field() &&
      (!this.field().value || !Array.isArray(this.field().value))
    ) {
      this.field().value = [
        {
          purpose: '',
          percentage: 100,
        },
      ];
    }
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const { value } = this.field();
    if (!value) {
      return ValidationErrorKey.REQUIRED;
    }

    for (const loanPurpose of value) {
      if (loanPurpose) {
        if (loanPurpose.purpose.trim() === '') {
          return ValidationErrorKey.MISSING_PURPOSE;
        }
        if (`${loanPurpose.percentage}` === '') {
          return ValidationErrorKey.MISSING_PERCENTAGE;
        }
      }
    }

    if (this.getTotal() !== 100) {
      return ValidationErrorKey.TOTAL_PERCENTAGE_NOT_100;
    }

    return undefined;
  }

  override isValid(): boolean {
    this.touched.set(true);
    return this.getErrorKey() === undefined;
  }

  getPercentageErrorMessage(percentage: number): string | undefined {
    const { required } = this.field();
    if (required && !percentage) {
      return 'This field is required';
    }

    if (percentage === undefined || percentage === null) {
      return undefined;
    }

    if (percentage > 100) {
      return `Percentage must be at most 100`;
    }

    if (percentage < 0) {
      return `Percentage must be at least 0`;
    }

    return undefined;
  }

  addRow(): void {
    const field = this.field();
    const actualTotal = this.getTotal();
    const percentage = actualTotal >= 100 ? 0 : 100 - actualTotal;

    if (field && field.value) {
      field.value.push({
        purpose: '',
        percentage: percentage,
      });
      this.dataChange.emit(field);
    }
  }

  removeRow(index: number): void {
    const field = this.field();
    if (field && field.value) {
      field.value.splice(index, 1);
      this.dataChange.emit(field);
    }
  }

  getTotal(): number {
    const field = this.field();
    if (field && field.value) {
      return field.value.reduce(
        (accumulator: number, element: LoanPurposeFieldModel) =>
          accumulator + Number(element.percentage),
        0
      );
    } else {
      return 0;
    }
  }

  updateElementPurpose(value: string, index: number) {
    const field = this.field();

    const oldValue = field.value ? field.value[index] : undefined;

    if (!field.value || !oldValue) {
      return;
    }

    field.value[index] = {
      purpose: value,
      percentage: oldValue.percentage ?? 0,
    };

    if (value !== oldValue.purpose) {
      this.touched.set(true);
      this.dataChange.emit(field);
    }
  }

  updateElementPercentage(value: number, index: number) {
    const field = this.field();

    const oldValue = field.value ? field.value[index] : undefined;

    if (!field.value || !oldValue) {
      return;
    }

    field.value[index] = {
      purpose: oldValue.purpose ?? '',
      percentage: value,
    };

    if (value !== oldValue.percentage) {
      this.touched.set(true);
      this.dataChange.emit(field);
    }
  }
}
