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
import type { CreditLineOverviewSchema } from '../../../services/lending/models/credit-lines.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { getFormattedCreditLineTitle } from '../../../utils/loanUtil';
import { formatAmountFromCents } from '../../../utils/numberUtil';
import { formatEnumValue } from '../../../utils/stringUtil';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';
import { BoxRowComponent } from '../../box/box-row/box-row.component';

@Component({
  selector: 'lj-credit-line-tile',
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
  templateUrl: './credit-line-tile.component.html',
  styleUrl: './credit-line-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditLineTileComponent {
  protected organizationService = inject(OrganizationService);
  private clientLoansService = inject(ClientLoansService);
  formatDate = readableDateFromTimestamp;

  creditLine = input.required<CreditLineOverviewSchema>();
  isMobile = input<boolean>(false);

  formatAmount(value?: number): string {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }

  formatEnumValue(value: string) {
    return formatEnumValue(value);
  }

  showCollaboratorTag(product: CreditLineOverviewSchema): boolean {
    // We will need to review that logic when we support the GLBA law for hobby farm,
    // as the ability to share won't be linked to the collaborator status anymore.
    // When it happens, we will need to return the users in the overview (without profile,
    // just the id and role)
    return product.userIsCollaborator;
  }

  async optOutAsCollaborator(product: CreditLineOverviewSchema) {
    const organisationUserId = this.organizationService.getOrganizationUserId();

    if (!organisationUserId) {
      return;
    }

    if ('creditLimitCents' in product) {
      await this.clientLoansService.removeDelegateFromCreditLines(
        [product],
        organisationUserId
      );
    }

    this.clientLoansService.loadLoans();
  }

  getFormattedCreditLineTitle(creditLine: CreditLineOverviewSchema): string {
    return getFormattedCreditLineTitle(creditLine);
  }

  openPortal(id: string) {
    const link = document.getElementById(id);
    if (link) {
      link.click();
    }
  }

  getRouterLink(creditLine: CreditLineOverviewSchema): string {
    return this.isMobile()
      ? `/tabs/loans/credit/${creditLine.id}`
      : `/loans/credit/${creditLine.id}`;
  }

  isNsfStateEnabled(): boolean {
    return this.organizationService.isFeatureFlagActivated('SHOW_NSF_STATE');
  }
}
