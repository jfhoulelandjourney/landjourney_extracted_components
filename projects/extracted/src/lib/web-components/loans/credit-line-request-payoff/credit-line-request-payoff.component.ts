
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
import { IAMService } from '../../../services/identity/iam.service';
import { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';

import { ServicingService } from '../../../services/lending/servicing/servicing.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { formatAmountFromCents } from '../../../utils/numberUtil';
import { formatDate, readableDateFromTimestamp } from '../../../utils/timeUtil';
import { LjSelectFieldComponent } from '../../form/select-field/select-field.component';
import { LjTextareaFieldComponent } from '../../form/textarea-field/textarea-field.component';

import { LjButtonComponent } from '../../button/button.component';
import { LjRoundHeaderChipComponent } from '../../chip/lj-round-header-chip/lj-round-header-chip.component';
import { CreditLineHeaderComponent } from '../credit-line-header/credit-line-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-request-payoff',
  templateUrl: './credit-line-request-payoff.component.html',
  styleUrls: ['./credit-line-request-payoff.component.scss'],
  imports: [
    MatIconModule,
    CreditLineHeaderComponent,
    ActivateDirective,
    LjButtonComponent,
    LjSelectFieldComponent,
    FormsModule,
    MatExpansionModule,
    MatDatepickerModule,
    LjTextareaFieldComponent,
    LjRoundHeaderChipComponent
],
})
export class CreditLineRequestPayoffComponent {
  readonly servicingService = inject(ServicingService);
  readonly iamService = inject(IAMService);
  readonly uiNotificationService = inject(UiNotificationService);
  currentStep = signal(0);

  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  mobile = input<boolean>(false);
  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();
  panelOpen = model(true);

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

  reasons = signal([
    'Sale of Collateral',
    'Excess Cash',
    'Refinance to Other Lender',
    'Deceased Borrower',
    'Liquidated at Maturity',
    'Other (please specify)',
  ]);

  account: string | null = null;
  reason: string | null = null;
  date: Date | undefined = undefined;
  now: Date = new Date();
  otherReason: string | null = null;
  payoffDestination: string | null = null;
  otherPayoffDestination: string | null = null;

  useOtherReason() {
    return this.reason === 'Other (please specify)';
  }

  useOtherPayoffDestination() {
    return this.payoffDestination === 'Someone else (if so, add contact info)';
  }

  getAccounts() {
    return this.accounts().map(account => ({
      value: account.id,
      label: `${account.name} - ${account.accountNumber}`,
    }));
  }

  getReasons() {
    return this.reasons().map(reason => ({
      value: reason,
      label: reason,
    }));
  }

  getDestinationChoices() {
    return [
      { value: 'Me', label: 'Me' },
      {
        value: 'Someone else (if so, add contact info)',
        label: 'Someone else (if so, add contact info)',
      },
    ];
  }

  getSelectedAccount() {
    return this.accounts().find(account => account.id === this.account);
  }

  updateSelectEvent(account: string) {
    this.account = account;
  }

  updateReasonEvent(reason: string) {
    this.reason = reason;
  }

  updateDestinationChoiceEvent(destination: string) {
    this.payoffDestination = destination;
  }

  isFirstStepValid() {
    // return Boolean(this.account);
    return this.useOtherReason()
      ? Boolean(this.otherReason)
      : Boolean(this.reason);
  }

  isSecondStepValid() {
    return this.useOtherPayoffDestination()
      ? Boolean(this.otherPayoffDestination)
      : Boolean(this.payoffDestination);
  }

  isThirdStepValid() {
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

  confirmPayoff() {
    this.servicingService
      .sendPayOffRequest(
        `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`,
        this.creditLine()?.accountNumber ?? '',
        this.creditLine()?.usageCents ?? 0,
        (this.useOtherReason() ? this.otherReason : this.reason) ?? '',
        this.formatDate(this.date ?? new Date()),
        (this.useOtherPayoffDestination()
          ? this.otherPayoffDestination
          : this.payoffDestination) ?? '',
        'Line of Credit'
      )
      .subscribe({
        next: () => {
          this.currentStep.set(this.currentStep() + 1);
        },
        error: () => {
          this.uiNotificationService.showSnackbar(
            'Error sending payoff request',
            'red',
            10000,
            'Close'
          );
        },
      });
  }

  reset() {
    this.account = null;
    return true;
  }
}
