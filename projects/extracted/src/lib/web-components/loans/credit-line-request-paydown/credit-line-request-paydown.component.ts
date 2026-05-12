
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';
import { formatDate, readableDateFromTimestamp } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';
import { LjMoneyInputFieldComponent } from '../../form/money-input-field/money-input-field.component';
import { CreditLineHeaderComponent } from '../credit-line-header/credit-line-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-request-paydown',
  templateUrl: './credit-line-request-paydown.component.html',
  styleUrls: ['./credit-line-request-paydown.component.scss'],
  imports: [
    MatIconModule,
    CreditLineHeaderComponent,
    ActivateDirective,
    LjButtonComponent,
    LjMoneyInputFieldComponent,
    FormsModule,
    MatDatepickerModule,
    MatExpansionModule
],
})
export class CreditLineRequestPaydownComponent {
  mobile = input<boolean>(false);
  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();
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
    return Boolean(number && number > 0 && this.account);
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
    // TODO make paydown

    return true; // return false to prevent going to the next step if the paydown fails
  }

  reset() {
    this.account = null;
    this.amount = null;
    this.date = undefined;
    return true;
  }
}
