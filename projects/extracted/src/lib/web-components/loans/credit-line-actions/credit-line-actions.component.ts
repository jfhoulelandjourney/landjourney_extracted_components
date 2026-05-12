
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  TabDirective,
  TabsComponent,
} from '../../../design-system/molecules/tabs/tabs.component';
import { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { CreditLineDrawFundsComponent } from '../credit-line-draw-funds/credit-line-draw-funds.component';
import { CreditLinePaymentComponent } from '../credit-line-payment/credit-line-payment.component';
import { CreditLineRequestPaydownComponent } from '../credit-line-request-paydown/credit-line-request-paydown.component';
import { CreditLineRequestPayoffComponent } from '../credit-line-request-payoff/credit-line-request-payoff.component';
import { CreditLineUpdateBankAccountComponent } from '../credit-line-update-bank-account/credit-line-update-bank-account.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-actions',
  templateUrl: './credit-line-actions.component.html',
  styleUrls: ['./credit-line-actions.component.scss'],
  imports: [
    TabDirective,
    TabsComponent,
    CreditLinePaymentComponent,
    CreditLineRequestPaydownComponent,
    CreditLineDrawFundsComponent,
    MatExpansionModule,
    CreditLineRequestPayoffComponent,
    CreditLineUpdateBankAccountComponent
],
})
export class CreditLineActionsComponent implements OnChanges {
  private organizationService = inject(OrganizationService);
  mobile = input<boolean>(false);
  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();

  forceShowPayment = input<boolean>(false);
  forceShowDrawFunds = input<boolean>(false);

  paymentOpen = signal(false);
  paydownOpen = signal(false);
  payoffOpen = signal(false);
  drawFundsOpen = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    if (
      !changes.forceShowPayment?.firstChange &&
      changes.forceShowPayment?.previousValue !==
        changes.forceShowPayment?.currentValue
    ) {
      this.paymentOpen.set(true);
      this.drawFundsOpen.set(false);
    }
    if (
      !changes.forceShowDrawFunds?.firstChange &&
      changes.forceShowDrawFunds?.previousValue !==
        changes.forceShowDrawFunds?.currentValue
    ) {
      this.drawFundsOpen.set(true);
      this.paymentOpen.set(false);
    }

    if (this.forceShowPayment()) {
      setTimeout(() => this.scrollTo('end-of-page'), 200);
    }

    if (this.forceShowDrawFunds()) {
      setTimeout(() => this.scrollTo('end-of-page'), 200);
    }
  }

  async scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }

  isDemoMode(): boolean {
    return this.organizationService.isFeatureFlagActivated('DEMO_MODE');
  }
}
