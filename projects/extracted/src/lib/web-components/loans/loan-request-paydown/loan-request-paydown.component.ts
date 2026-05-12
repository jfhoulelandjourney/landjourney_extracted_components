
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { formatDate, readableDateFromTimestamp } from '../../../utils/timeUtil';
import { LjMoneyInputFieldComponent } from '../../form/money-input-field/money-input-field.component';
// import { LjSelectFieldComponent } from '../../form/select-field/select-field.component';
import { IAMService } from '../../../services/identity/iam.service';
import { ServicingService } from '../../../services/lending/servicing/servicing.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { LjButtonComponent } from '../../button/button.component';
import { LoanHeaderComponent } from '../loan-header/loan-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-request-paydown',
  templateUrl: './loan-request-paydown.component.html',
  styleUrls: ['./loan-request-paydown.component.scss'],
  imports: [
    MatIconModule,
    LoanHeaderComponent,
    ActivateDirective,
    LjButtonComponent,
    LjMoneyInputFieldComponent,
    FormsModule,
    MatDatepickerModule,
    MatExpansionModule
],
})
export class LoanRequestPaydownComponent {
  readonly servicingService = inject(ServicingService);
  readonly iamService = inject(IAMService);
  readonly uiNotificationService = inject(UiNotificationService);

  mobile = input<boolean>(false);
  loan = input<DetailedLoanCompoundSchema | undefined>();
  panelOpen = model(true);
  currentStep = signal(0);

  // TODO get from the api
  accounts = signal([
    {
      id: '1',
      name: 'GP Morgan',
      accountNumber: '35-33223-002',
    },
    {
      id: '2',
      name: 'GP Lorgan',
      accountNumber: '35-33223-005',
    },
    {
      id: '3',
      name: 'GP Forgan',
      accountNumber: '35-33223-009',
    },
    {
      id: '4',
      name: 'GP Norgan',
      accountNumber: '35-33223-000',
    },
  ]);

  amount: number | null = null;
  account: string | null = null;
  date: Date | undefined = undefined;

  getAccounts() {
    return this.accounts().map(account => ({
      value: account.id,
      label: `${account.name} - ${account.accountNumber}`,
    }));
  }

  getSelectedAccount() {
    return this.accounts().find(account => account.id === this.account);
  }

  updateSelectEvent(account: string) {
    this.account = account;
  }

  handleDateChanged(date: Date | null) {
    this.date = date ?? undefined;
  }

  isFirstStepValid() {
    const number = Number.isNaN(this.amount)
      ? undefined
      : parseFloat(`${this.amount}`.replaceAll(',', '').replaceAll('$', ''));
    // return Boolean(number && number > 0 && this.account);
    return Boolean(number && number);
  }

  isSecondStepValid() {
    return Boolean(this.date);
  }

  formatDate(date: Date | number | undefined): string {
    if (!date) {
      return '-';
    }

    if (typeof date === 'number') {
      return readableDateFromTimestamp(date);
    }

    return formatDate(date, 'short');
  }

  confirmPaydown() {
    this.servicingService
      .sendPayDownRequest(
        `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`,
        this.loan()?.accountNumber ?? '',
        this.amount ?? 0,
        this.formatDate(this.date ?? new Date())
      )
      .subscribe({
        next: () => {
          this.currentStep.set(this.currentStep() + 1);
          this.panelOpen.set(false);
        },
        error: () => {
          this.uiNotificationService.showSnackbar(
            'Error sending paydown request',
            'red',
            10000,
            'Close'
          );
        },
      });
  }

  reset() {
    this.account = null;
    this.amount = null;
    this.date = undefined;
    this.currentStep.set(0);
    return true;
  }
}
