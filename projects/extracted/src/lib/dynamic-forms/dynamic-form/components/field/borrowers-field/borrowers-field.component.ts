import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  MatRadioModule,
} from '@angular/material/radio';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import { isPhoneNumber } from '../../../../../models/phoneNumber';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { LabelFieldComponent } from '../../../../../web-components/typography/label-field/label-field.component';

import { SmsComplianceComponent } from '../../../../../web-components/sms-compliance/sms-compliance.component';
import {
  getDefaultBorrower,
  getDefaultBorrowersFieldValue,
  type BorrowerModel,
  type BorrowersFieldModel,
} from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { BorrowerInformationComponent } from './borrower-information/borrower-information.component';

@Component({
  selector: 'lj-df-borrowers-field',
  imports: [
    FormsModule,
    MatCheckboxModule,
    LabelFieldComponent,
    MatIconModule,
    LjButtonComponent,
    BorrowerInformationComponent,
    ActivateDirective,
    MatRadioModule,
    SmsComplianceComponent,
  ],
  templateUrl: './borrowers-field.component.html',
  styleUrl: './borrowers-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: BorrowersFieldComponent },
    { provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' } },
  ],
})
export class BorrowersFieldComponent
  extends AbstractFieldComponent<BorrowersFieldModel>
  implements OnInit
{
  getDefaultBorrower = getDefaultBorrower;

  isMobile = input(false);
  @ViewChildren(BorrowerInformationComponent)
  borrowerInformationComponents!: QueryList<BorrowerInformationComponent>;
  confirmationCheck = model(false);

  ngOnInit() {
    if (
      this.field &&
      (this.field().value === undefined ||
        this.field().value === null ||
        !('mainBorrower' in (this.field().value ?? {})))
    ) {
      this.setFieldDefaults();
      this.field().value = getDefaultBorrowersFieldValue();
    }
  }

  setFieldDefaults() {
    this.field().label = 'Basic Borrowers Information';
    this.field().name = 'borrowers';
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    if (this.isPhoneNumberValid() && !this.confirmationCheck()) {
      return ValidationErrorKey.MISSING_FIELDS;
    }

    const allChildrenValid =
      this.borrowerInformationComponents?.map(c => c.isValid()).every(v => v) ??
      true;

    if (!allChildrenValid) {
      return ValidationErrorKey.MISSING_FIELDS;
    }

    return undefined;
  }

  override isValid(): boolean {
    this.touched.set(true);
    return this.getErrorKey() === undefined;
  }

  isPhoneNumberValid(): boolean {
    const borrower = this.field().value?.mainBorrower;

    if (!borrower) {
      return false;
    }

    if (borrower.phone.trim() === '') {
      return false;
    }

    if (!isPhoneNumber(borrower.phone)) {
      return false;
    }

    return true;
  }

  // FIELD LOGIC

  addCoBorrower() {
    const field = this.field();

    if (field.value?.coBorrowers) {
      field.value.coBorrowers.push(getDefaultBorrower());
      this.dataChange.emit(field);
    }
  }

  removeCoBorrower(coBorrower: BorrowerModel) {
    const field = this.field();

    if (field.value?.coBorrowers) {
      field.value.coBorrowers = field.value.coBorrowers.filter(
        item => item !== coBorrower
      );
      this.dataChange.emit(field);
    }
  }

  updateCoBorrower(index: number, coBorrower: BorrowerModel) {
    const field = this.field();

    if (field.value?.coBorrowers) {
      const oldCoBorrower = field.value.coBorrowers[index];

      const hasChanges =
        oldCoBorrower?.email !== coBorrower.email ||
        oldCoBorrower?.firstName !== coBorrower.firstName ||
        oldCoBorrower?.lastName !== coBorrower.lastName ||
        oldCoBorrower?.phone !== coBorrower.phone;

      field.value.coBorrowers[index] = coBorrower;

      if (hasChanges) {
        this.dataChange.emit(this.field());
      }
    }
  }

  updateBorrower(borrower: BorrowerModel) {
    const field = this.field();

    if (field.value?.mainBorrower) {
      const oldBorrower = field.value.mainBorrower;

      const hasChanges =
        oldBorrower?.email !== borrower.email ||
        oldBorrower?.firstName !== borrower.firstName ||
        oldBorrower?.lastName !== borrower.lastName ||
        oldBorrower?.phone !== borrower.phone;

      field.value.mainBorrower = borrower;

      if (hasChanges) {
        this.dataChange.emit(this.field());
      }
    }
  }
}
