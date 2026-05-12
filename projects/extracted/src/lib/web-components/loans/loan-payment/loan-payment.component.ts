
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { formatAmountFromCents } from '../../../utils/numberUtil';
// import { LjSelectFieldComponent } from '../../form/select-field/select-field.component';
import { SafeHtmlPipe } from '../../../pipes/safe-html/safe-html.pipe';
import { IAMService } from '../../../services/identity/iam.service';
import type { ExistingFundingEntitySchema } from '../../../services/lending/models/funding-entities.models';
import { ServicingService } from '../../../services/lending/servicing/servicing.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { LjButtonComponent } from '../../button/button.component';
import { LoanHeaderComponent } from '../loan-header/loan-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-payment',
  templateUrl: './loan-payment.component.html',
  styleUrls: ['./loan-payment.component.scss'],
  imports: [
    MatIconModule,
    LoanHeaderComponent,
    ActivateDirective,
    LjButtonComponent,
    FormsModule,
    MatExpansionModule,
    SafeHtmlPipe
],
})
export class LoanPaymentComponent {
  readonly servicingService = inject(ServicingService);
  readonly iamService = inject(IAMService);
  readonly organizationService = inject(OrganizationService);
  readonly uiNotificationService = inject(UiNotificationService);

  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  mobile = input<boolean>(false);
  loan = input<DetailedLoanCompoundSchema | undefined>();
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

  amount: number | null = null;
  account: string | null = null;

  getAccounts() {
    return this.accounts().map(account => ({
      value: account.id,
      label: `${account.name} - ${account.accountNumber}`,
    }));
  }

  getSelectedAccount() {
    return this.accounts().find(account => account.id === this.account);
  }

  getNewPrincipalBalance() {
    const currentBalance = this.loan()?.principalBalanceCents;
    const paymentAmount = Number.isNaN(this.amount)
      ? undefined
      : parseFloat(`${this.amount}`.replaceAll(',', '').replaceAll('$', ''));

    if (!currentBalance || !paymentAmount) {
      return 0;
    }
    if (currentBalance < paymentAmount) {
      return 0;
    }

    return currentBalance - paymentAmount * 100;
  }

  showPaymentPanel(): boolean {
    return this.showPortalUrl() || this.showWireInstructions();
  }

  showPortalUrl(): boolean {
    const fundingEntity = this.loan()?.fundingEntities.at(0);
    const parsedFundingEntity = this.parseFundingEntity(fundingEntity);

    const portalUrl = parsedFundingEntity?.paymentPortalUrl;

    return Boolean(portalUrl && portalUrl.trim() !== '');
  }

  showWireInstructions(): boolean {
    const fundingEntity = this.loan()?.fundingEntities.at(0);
    const parsedFundingEntity = this.parseFundingEntity(fundingEntity);

    const wireInstructions = parsedFundingEntity?.wireInstructions;

    return Boolean(wireInstructions && wireInstructions.trim() !== '');
  }

  parseFundingEntity(fundingEntity: unknown): ExistingFundingEntitySchema {
    return fundingEntity as ExistingFundingEntitySchema;
  }

  updateSelectEvent(account: string) {
    this.account = account;
  }

  isFormValid() {
    const number = Number.isNaN(this.amount)
      ? undefined
      : parseFloat(`${this.amount}`.replaceAll(',', '').replaceAll('$', ''));
    // return Boolean(number && number > 0 && this.account);
    return Boolean(number && number > 0);
  }

  confirmPayment() {
    this.servicingService
      .sendPaymentRequest(
        `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`,
        this.loan()?.accountNumber ?? '',
        'Loan',
        this.amount ?? 0
      )
      .subscribe({
        next: () => {
          this.uiNotificationService.showSnackbar(
            'Payment request sent successfully',
            'green',
            10000,
            'Close'
          );
          this.panelOpen.set(false);
        },
        error: () => {
          this.uiNotificationService.showSnackbar(
            'Error sending payment request',
            'red',
            10000,
            'Close'
          );
        },
      });
  }

  goToPaymentPortal() {
    const fundingEntities = this.loan()?.fundingEntities ?? [];
    if (fundingEntities.length === 0) {
      return;
    }

    const fundingEntity = fundingEntities.at(0);

    if (!fundingEntity) {
      return;
    }

    const parsedFundingEntity = this.parseFundingEntity(fundingEntity);

    window.open(parsedFundingEntity.paymentPortalUrl ?? 'about:blank');
  }

  reset() {
    this.account = null;
    this.amount = null;
    return true;
  }

  getTenantName() {
    return this.organizationService.getTenantName();
  }
}
