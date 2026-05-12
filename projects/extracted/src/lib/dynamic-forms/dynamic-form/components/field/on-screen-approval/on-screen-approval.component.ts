import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FieldDirective } from '../../../../../directives/field.directive';

import { maskitoTransform } from '@maskito/core';
import { getMoneyMaskitoOptions } from '../../../../../constants/masks';
import { stripNonNumberCharacters } from '../../../../../utils/stringUtil';
import type { OnScreenApprovalFieldModel } from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-on-screen-approval',
  templateUrl: './on-screen-approval.component.html',
  styleUrls: ['./on-screen-approval.component.scss'],
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: OnScreenApprovalComponent },
  ],
})
export class OnScreenApprovalComponent
  extends AbstractFieldComponent<OnScreenApprovalFieldModel>
  implements OnInit
{
  moneyMask = getMoneyMaskitoOptions(this.field().id);

  ngOnInit() {
    // Try to get loan amount from formData if not already set
    const loanAmount =
      this.field().value?.loanAmount ?? this.getLoanAmountFromFormData();

    if (this.field() && !this.field().value) {
      this.field().value = {
        currentStatus: 'CALCULATING',
        endStatus: 'APPROVED',
        loanAmount,
      };
    } else {
      this.field().value = {
        currentStatus: 'CALCULATING',
        endStatus: this.field().value?.endStatus ?? 'APPROVED',
        loanAmount,
      };
    }
    setTimeout(() => {
      this.field().value = {
        currentStatus: this.field().value?.endStatus ?? 'APPROVED',
        endStatus: this.field().value?.endStatus ?? 'APPROVED',
        loanAmount: this.field().value?.loanAmount,
      };
      this.dataChange.emit(this.field());
    }, 5000);
  }

  private getLoanAmountFromFormData(): number | undefined {
    // Try to find loan amount in formData
    const formData = this.formData();
    const value =
      formData?.['loanAmount'] ??
      formData?.['loan_amount'] ??
      formData?.['amount'];
    return typeof value === 'number' ? value : undefined;
  }

  override isValid(): boolean {
    return true;
  }

  getStatusTitle(status?: string): string {
    switch (status) {
      case 'CALCULATING':
        return 'Processing Application';
      case 'APPROVED':
      case 'MANUAL_APPROVAL':
      case 'PENDING':
        return 'Application has been processed';
      default:
        return 'Application Status';
    }
  }

  getStatusDescription(status?: string): string {
    switch (status) {
      case 'CALCULATING':
        return 'Our system is reviewing your application...';
      case 'APPROVED':
      case 'MANUAL_APPROVAL':
        return 'Underwriting is complete.';
      case 'PENDING':
        return 'We need your co-applicants to complete their loan application to proceed.';
      default:
        return '';
    }
  }

  formatMoney(number: number | undefined): string {
    if (number === undefined || number === null) {
      return '';
    }

    const response = maskitoTransform(
      stripNonNumberCharacters(`${number}`),
      this.moneyMask
    );
    return response;
  }
}
