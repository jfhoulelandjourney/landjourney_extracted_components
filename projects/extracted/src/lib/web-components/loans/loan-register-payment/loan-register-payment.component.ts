
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { ClientLoansMockService } from '../../../services/client/loans/client-loans.mock.service';
import { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { formatAmountFromCents } from '../../../utils/numberUtil';
import { formatDate } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';
import { LjRoundHeaderChipComponent } from '../../chip/lj-round-header-chip/lj-round-header-chip.component';
import { LjInputFieldComponent } from '../../form/input-field/input-field.component';
import { LjMoneyInputFieldComponent } from '../../form/money-input-field/money-input-field.component';
import { LjSelectFieldComponent } from '../../form/select-field/select-field.component';
import { LoanHeaderComponent } from '../loan-header/loan-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-register-payment',
  templateUrl: './loan-register-payment.component.html',
  styleUrls: ['./loan-register-payment.component.scss'],
  imports: [
    MatIconModule,
    LoanHeaderComponent,
    ActivateDirective,
    LjButtonComponent,
    LjSelectFieldComponent,
    FormsModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatSelectModule,
    LjRoundHeaderChipComponent,
    LjMoneyInputFieldComponent,
    LjInputFieldComponent
],
})
export class LoanRegisterPaymentComponent {
  readonly organizationService = inject(OrganizationService);
  readonly clientLoansMockService = inject(ClientLoansMockService);
  readonly uiNotificationService = inject(UiNotificationService);

  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  mobile = input<boolean>(false);
  loan = input<DetailedLoanCompoundSchema | undefined>();
  panelOpen = model(true);

  readonly paymentRegistered = output<void>();

  paymentMethods = signal([
    { value: 'wired', label: 'Wire Transfer' },
    { value: 'manual', label: 'Check/Manual' },
  ]);

  date = signal<Date | undefined>(undefined);
  maxDate: Date = new Date();
  amount: number | null = null;
  method: 'wired' | 'manual' | null = null;
  chequeNumber: string | null = null;

  currentStep = signal(0);

  getPaymentMethods() {
    return this.paymentMethods();
  }

  updateMethodEvent(method: string) {
    this.method = method as 'wired' | 'manual';
  }

  isFirstStepValid() {
    return Boolean(this.date());
  }

  isSecondStepValid() {
    const number = Number.isNaN(this.amount)
      ? undefined
      : parseFloat(`${this.amount}`.replaceAll(',', '').replaceAll('$', ''));
    return Boolean(number && number > 0);
  }

  isThirdStepValid() {
    return Boolean(this.method);
  }

  formatDate(date: Date | number | undefined): string {
    if (!date) {
      return '-';
    }

    if (typeof date === 'number') {
      return formatDate(new Date(date * 1000), 'short');
    }

    return formatDate(date, 'short');
  }

  confirmPayment() {
    const selectedDate = this.date();
    const selectedAmount = Number.isNaN(this.amount)
      ? undefined
      : parseFloat(`${this.amount}`.replaceAll(',', '').replaceAll('$', ''));

    if (!selectedDate || !selectedAmount || !this.method) {
      return;
    }

    // Format date as YYYY-MM-DD
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const loanId = this.loan()?.id ?? '';
    // Convert dollars to cents
    const amountCents = Math.round(selectedAmount * 100);

    this.clientLoansMockService
      .registerPayment(loanId, {
        date: dateStr,
        amountCents,
        method: this.method,
        chequeNumber: this.chequeNumber,
      })
      .pipe(
        catchError(error => {
          if (this.isDemoMode()) {
            // In demo mode, simulate success
            return of(null);
          } else {
            // Rethrow error for non-demo mode
            throw error;
          }
        })
      )
      .subscribe({
        next: () => {
          this.currentStep.set(this.currentStep() + 1);
          this.uiNotificationService.showSnackbar(
            'Payment registered successfully',
            'green',
            5000,
            'Close'
          );
          // Emit event to notify parent to reload payments
          this.paymentRegistered.emit();
        },
        error: () => {
          this.uiNotificationService.showSnackbar(
            'Error registering payment',
            'red',
            10000,
            'Close'
          );
        },
      });
  }

  reset() {
    this.date.set(undefined);
    this.amount = null;
    this.method = null;
    this.chequeNumber = null;
    this.currentStep.set(0);
    return true;
  }

  isDemoMode() {
    return this.organizationService.isDemoModeActivated();
  }
}
