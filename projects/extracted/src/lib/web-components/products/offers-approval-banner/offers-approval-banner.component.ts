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
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { Offer, OfferStatus } from '../../../services/products/offers.service';

@Component({
  selector: 'lj-offers-approval-banner',
  standalone: true,
  imports: [MatIconModule, ActivateDirective],
  templateUrl: './offers-approval-banner.component.html',
  styleUrl: './offers-approval-banner.component.scss',
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
export class OffersApprovalBannerComponent {
  private router = inject(Router);
  isMobile = input<boolean>(false);
  offers = input<Offer[]>([]);
  showDetails = input<boolean>(false);
  offersForApproval = computed(() => {
    return this.offers().filter(
      offer => offer.status === OfferStatus.APPLICANT
    );
  });

  acceptedOffers = computed(() => {
    return this.offers().filter(offer => offer.status === OfferStatus.APPROVED);
  });

  rejectedOffers = computed(() => {
    return this.offers().filter(
      offer => offer.status === OfferStatus.REJECTED_BY_CLIENT
    );
  });

  loanCreatedOffers = computed(() => {
    return this.offers().filter(
      offer => offer.status === OfferStatus.LOAN_CREATED
    );
  });

  isExpanded = signal(false);
  getMessage = computed(() => {
    const count = this.offersForApproval().length;

    if (count === 1) {
      return 'An offer is awaiting your approval.';
    }
    return `${count} offers are awaiting your approval.`;
  });

  toggleExpanded() {
    this.isExpanded.set(!this.isExpanded());
  }

  getOfferName(offer: Offer): string {
    return offer.name || `Offer for Request ${offer.requestId}`;
  }

  goToRequest(offer: Offer) {
    if (this.isMobile()) {
      this.router.navigateByUrl(`/tabs/requests/${offer.requestId}/offers`);
    } else {
      this.router.navigateByUrl(`/requests/${offer.requestId}/offers`);
    }
  }

  toToLoan(offer: Offer) {
    if (this.isMobile()) {
      this.router.navigateByUrl(`/tabs/loans/credit/${offer.loanId}`);
    } else {
      this.router.navigateByUrl(`/loans/credit/${offer.loanId}`);
    }
  }
}
