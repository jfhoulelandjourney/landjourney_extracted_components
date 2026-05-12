import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import type {
  CreditLineOverviewSchema,
  DetailedCreditLineCompoundSchema,
} from '../../../services/lending/models/credit-lines.models';
import type { LoanOverviewSchema } from '../../../services/lending/models/loans.models';
import {
  getFormattedCreditLineTitle,
  getFormattedLoanTitle,
} from '../../../utils/loanUtil';
import { formatAmountFromCents } from '../../../utils/numberUtil';

@Component({
  selector: 'lj-nsf-banner',
  standalone: true,
  imports: [MatIconModule, ActivateDirective],
  templateUrl: './nsf-banner.component.html',
  styleUrl: './nsf-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          height: '0',
          opacity: '0',
          overflow: 'hidden',
        })
      ),
      state(
        'expanded',
        style({
          height: '*',
          opacity: '1',
          overflow: 'hidden',
        })
      ),
      transition('collapsed <=> expanded', [animate('300ms ease-in-out')]),
    ]),
  ],
})
export class NsfBannerComponent {
  private router = inject(Router);
  isMobile = input<boolean>(false);
  isDetailsPage = input<boolean>(false);
  nsfItems = input<
    (
      | LoanOverviewSchema
      | CreditLineOverviewSchema
      | DetailedCreditLineCompoundSchema
    )[]
  >([]);

  readonly onPaymentClicked = output();

  isExpanded = signal(false);

  getMessage = computed(() => {
    const count = this.nsfItems().length;
    const item = this.nsfItems()[0];

    if (item && this.isDetailsPage()) {
      if ('outstandingBalanceCents' in item) {
        return 'A recent payment on this loan has been returned due to Non-Sufficient Funds.';
      }
      if ('usedCreditCents' in item) {
        return 'A recent payment on this line of credit has been returned due to Non-Sufficient Funds.';
      }
      return 'A recent payment has been returned due to Non-Sufficient Funds.';
    } else {
      if (count === 1) {
        return 'A recent payment has been returned due to Non-Sufficient Funds.';
      }

      return 'Recent payments have been returned due to Non-Sufficient Funds.';
    }
  });

  toggleExpanded() {
    if (!this.isDetailsPage()) {
      this.isExpanded.set(!this.isExpanded());
    } else {
      this.onPaymentClicked.emit();
    }
  }

  getItemAmount(
    item:
      | LoanOverviewSchema
      | CreditLineOverviewSchema
      | DetailedCreditLineCompoundSchema
  ): string {
    if ('outstandingBalanceCents' in item) {
      return this.formatAmount(item.principalBalanceCents);
    }
    if ('usedCreditCents' in item) {
      return this.formatAmount(item.usedCreditCents);
    }
    return this.formatAmount(0);
  }

  getItemId(
    item:
      | LoanOverviewSchema
      | CreditLineOverviewSchema
      | DetailedCreditLineCompoundSchema
  ): string {
    return item.id;
  }

  getFormattedTitle(
    item:
      | LoanOverviewSchema
      | CreditLineOverviewSchema
      | DetailedCreditLineCompoundSchema
  ): string {
    if ('outstandingBalanceCents' in item) {
      return getFormattedLoanTitle(item);
    }
    if ('usedCreditCents' in item) {
      return getFormattedCreditLineTitle(item);
    }
    return '';
  }

  formatAmount(value?: number): string {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }

  goToItemDetails(
    item:
      | LoanOverviewSchema
      | CreditLineOverviewSchema
      | DetailedCreditLineCompoundSchema
  ) {
    if ('outstandingBalanceCents' in item) {
      if (this.isMobile()) {
        this.router.navigateByUrl('/tabs/loans/loan/' + item.id);
      } else {
        this.router.navigateByUrl('/loans/loan/' + item.id);
      }
    }
    if ('usedCreditCents' in item) {
      if (this.isMobile()) {
        this.router.navigateByUrl('/tabs/loans/credit/' + item.id);
      } else {
        this.router.navigateByUrl('/loans/credit/' + item.id);
      }
    }
  }
}
