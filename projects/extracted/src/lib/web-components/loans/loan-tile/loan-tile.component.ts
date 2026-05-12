import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { ConfirmationRequiredDirective } from '../../../directives/confirmation-required/confirmation-required.directive';
import { ClientLoansService } from '../../../services/client/loans/client-loans.service';
import type { LoanOverviewSchema } from '../../../services/lending/models/loans.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { getFormattedLoanTitle } from '../../../utils/loanUtil';
import { formatAmountFromCents } from '../../../utils/numberUtil';
import { formatEnumValue } from '../../../utils/stringUtil';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';
import { BoxRowComponent } from '../../box/box-row/box-row.component';

@Component({
  selector: 'lj-loan-tile',
  standalone: true,
  imports: [
    BoxRowComponent,
    NgxSkeletonLoaderModule,
    RouterModule,
    MatIconModule,
    ActivateDirective,
    MatButtonModule,
    ConfirmationRequiredDirective,
  ],
  templateUrl: './loan-tile.component.html',
  styleUrl: './loan-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanTileComponent {
  protected organizationService = inject(OrganizationService);
  private clientLoansService = inject(ClientLoansService);
  formatDate = readableDateFromTimestamp;

  loan = input.required<LoanOverviewSchema>();
  active = input(true);
  isMobile = input<boolean>(false);

  formatAmount(value?: number): string {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }

  formatEnumValue(value: string) {
    return formatEnumValue(value);
  }

  showPastDueTag(loan: LoanOverviewSchema): boolean {
    return loan.outstandingBalanceCents > 0;
  }

  showCollaboratorTag(product: LoanOverviewSchema): boolean {
    // We will need to review that logic when we support the GLBA law for hobby farm,
    // as the ability to share won't be linked to the collaborator status anymore.
    // When it happens, we will need to return the users in the overview (without profile,
    // just the id and role)
    return product.userIsCollaborator;
  }

  async optOutAsCollaborator(product: LoanOverviewSchema) {
    const organisationUserId = this.organizationService.getOrganizationUserId();

    if (!organisationUserId) {
      return;
    }

    if (!('creditLimitCents' in product)) {
      await this.clientLoansService.removeDelegateFromLoans(
        [product],
        organisationUserId
      );
    }

    this.clientLoansService.loadLoans();
  }

  getFormattedLoanTitle(loan: LoanOverviewSchema): string {
    return getFormattedLoanTitle(loan);
  }

  openPortal(id: string) {
    const link = document.getElementById(id);
    if (link) {
      link.click();
    }
  }

  getRouterLink(loan: LoanOverviewSchema): string {
    return this.isMobile()
      ? `/tabs/loans/loan/${loan.id}`
      : `/loans/loan/${loan.id}`;
  }

  isNsfStateEnabled(): boolean {
    return this.organizationService.isFeatureFlagActivated('SHOW_NSF_STATE');
  }
}
