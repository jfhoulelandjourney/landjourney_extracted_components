
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  TabDirective,
  TabsComponent,
} from '../../../design-system/molecules/tabs/tabs.component';
import { Actions, Resources } from '../../../models/organizationModels';
import { EnvironmentService } from '../../../services/environment/environment.service';
import { IAMService } from '../../../services/identity/iam.service';
import { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { PermissionUtil } from '../../../utils/permissionUtil';
import { LoanPaymentComponent } from '../loan-payment/loan-payment.component';
import { LoanRegisterPaymentComponent } from '../loan-register-payment/loan-register-payment.component';
import { LoanRequestPaydownComponent } from '../loan-request-paydown/loan-request-paydown.component';
import { LoanRequestPayoffComponent } from '../loan-request-payoff/loan-request-payoff.component';
import { LoanUpdateBankAccountComponent } from '../loan-update-bank-account/loan-update-bank-account.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-actions',
  templateUrl: './loan-actions.component.html',
  styleUrls: ['./loan-actions.component.scss'],
  imports: [
    TabDirective,
    TabsComponent,
    LoanPaymentComponent,
    LoanRequestPaydownComponent,
    LoanRequestPayoffComponent,
    LoanRegisterPaymentComponent,
    MatExpansionModule,
    LoanUpdateBankAccountComponent
],
})
export class LoanActionsComponent implements OnChanges {
  private environmentService = inject(EnvironmentService);
  private iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);

  mobile = input<boolean>(false);
  loan = input<DetailedLoanCompoundSchema | undefined>();
  forceShowPayment = input<boolean>(false);

  readonly paymentRegistered = output<void>();

  paymentOpen = signal(false);
  paydownOpen = signal(false);
  payoffOpen = signal(false);
  registerPaymentOpen = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    if (
      !changes.forceShowPayment?.firstChange &&
      changes.forceShowPayment?.previousValue !==
        changes.forceShowPayment?.currentValue
    ) {
      this.paymentOpen.set(true);
    }

    if (this.forceShowPayment()) {
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

  canRegisterPayment(): boolean {
    // In client portal, check for LOANS:UPDATE permission
    return (
      this.isDemoMode() &&
      PermissionUtil.isAuthorized(
        this.iamService.getUserPermissions(
          this.organizationService.getOrganizationId()
        ),
        Resources.LOANS,
        Actions.UPDATE
      )
    );
  }

  isDemoMode(): boolean {
    return this.organizationService.isFeatureFlagActivated('DEMO_MODE');
  }
}
