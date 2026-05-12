import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { IAMService } from '../../../services/identity/iam.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { Offer, OfferStatus } from '../../../services/products/offers.service';
import { getUserName } from '../../../utils/entityUtil';
import { formatDate } from '../../../utils/timeUtil';

@Component({
  selector: 'lj-offer-status-banner',
  standalone: true,
  imports: [MatIconModule, ActivateDirective],
  templateUrl: './offer-status-banner.component.html',
  styleUrl: './offer-status-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferStatusBannerComponent {
  OfferStatus = OfferStatus;
  private router = inject(Router);
  private iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);

  isClient = input<boolean>(false);
  readonly createLoan = output<void>();
  offer = input.required<Offer>();
  noLinkButton = input<boolean>(false);
  isMobile = input<boolean>(false);
  // Cache for user names
  private userNameCache = signal<Map<string, string>>(new Map());

  getStatusMessage(): string {
    const offer = this.offer();
    const status = offer.status;

    switch (status) {
      case OfferStatus.DRAFT:
        return 'An offer has been saved';
      case OfferStatus.UNDERWRITING:
        return 'An offer has been sent to underwriting';
      case OfferStatus.APPLICANT:
        return 'An offer has been approved and has been sent to the main borrower for approval';
      case OfferStatus.RETAILER:
        return 'An offer has been approved by underwriting and needs your approval';
      case OfferStatus.AGENT:
        return 'An offer has been approved by underwriting and needs your approval';
      case OfferStatus.APPROVED:
        return 'An offer has been accepted';
      case OfferStatus.REJECTED_BY_UNDERWRITING:
        return 'An offer has been rejected by underwriting';
      case OfferStatus.REJECTED_BY_CLIENT:
        return 'An offer has been rejected by the main borrower';
      case OfferStatus.REJECTED_BY_RETAILER:
        return 'An offer has been rejected by the retailer';
      case OfferStatus.REJECTED_BY_AGENT:
        return 'An offer has been rejected by the agent';
      case OfferStatus.LOAN_CREATED:
        return `Loan created`;
      default:
        return 'An offer has been updated';
    }
  }

  getSeeOfferText(): string {
    const offer = this.offer();
    const status = offer.status;

    switch (status) {
      case OfferStatus.AGENT:
      case OfferStatus.RETAILER:
        return 'Approve Offer';
      default:
        return 'View Offer';
    }
  }

  constructor() {
    // Load user names when offer changes
    effect(() => {
      const offer = this.offer();
      if (!offer) return;

      // Get all user IDs that need to be loaded
      const userIds = [
        offer.createdBy,
        offer.updatedBy,
        offer.clientApprovedBy,
        offer.retailerApprovedBy,
        offer.agentApprovedBy,
        offer.rejectedBy,
        offer.underwritingApprovedBy,
        offer.sentToUnderwritingBy,
        offer.sentToApplicantBy,
        offer.loanCreatedBy,
      ].filter((id): id is string => Boolean(id));

      // Load each user name
      userIds.forEach(userId => {
        this.loadUserName(userId);
      });
    });
  }

  private loadUserName(userId: string): void {
    // Check cache first
    const cache = this.userNameCache();
    if (cache.has(userId)) {
      return;
    }

    // Check if it's the current user
    const activeUser = this.iamService.getActiveUser();
    if (
      activeUser &&
      this.organizationService.getOrganizationUserId() === userId
    ) {
      const name = `${activeUser.firstName} ${activeUser.lastName}`.trim();
      if (name) {
        const newCache = new Map(cache);
        newCache.set(userId, name);
        this.userNameCache.set(newCache);
        return;
      }
    }

    if (this.isClient()) {
      return;
    } else {
      // Fetch from API
      this.organizationService
        .getUser(userId)
        .pipe(
          catchError(() => {
            // If fetch fails, use userId as fallback
            const newCache = new Map(cache);
            newCache.set(userId, userId);
            this.userNameCache.set(newCache);
            return of(null);
          })
        )
        .subscribe(user => {
          if (user) {
            const name = getUserName(user);
            const newCache = new Map(this.userNameCache());
            newCache.set(userId, name || userId);
            this.userNameCache.set(newCache);
          }
        });
    }
  }

  private getUserName(userId: string | undefined): string {
    if (!userId) return '';
    if (userId === 'system') return 'System';

    const cache = this.userNameCache();
    return cache.get(userId) || userId;
  }

  statusDetails = computed(() => {
    const offer = this.offer();
    // Read cache to make this computed reactive to cache updates
    this.userNameCache();
    const status = offer.status;
    let userId: string | undefined;
    let timestamp: Date | undefined;

    switch (status) {
      case OfferStatus.DRAFT:
        userId = offer.updatedBy;
        timestamp = offer.updatedAt;
        break;
      case OfferStatus.UNDERWRITING:
        userId = offer.sentToUnderwritingBy;
        timestamp = offer.sentToUnderwritingAt;
        break;
      case OfferStatus.APPROVED:
        userId = offer.clientApprovedBy;
        timestamp = offer.clientApprovedAt;
        break;
      case OfferStatus.RETAILER:
        userId = offer.underwritingApprovedBy;
        timestamp = offer.underwritingApprovedAt;
        break;
      case OfferStatus.AGENT:
        userId = offer.underwritingApprovedBy;
        timestamp = offer.underwritingApprovedAt;
        break;
      case OfferStatus.APPLICANT:
        userId = offer.sentToApplicantBy;
        timestamp = offer.sentToApplicantAt;
        break;
      case OfferStatus.REJECTED_BY_UNDERWRITING:
      case OfferStatus.REJECTED_BY_CLIENT:
      case OfferStatus.REJECTED_BY_RETAILER:
      case OfferStatus.REJECTED_BY_AGENT:
        userId = offer.rejectedBy;
        timestamp = offer.rejectedAt;
        break;
      case OfferStatus.LOAN_CREATED:
        userId = offer.loanCreatedBy;
        timestamp = offer.loanCreatedAt;
        break;
      default:
        userId = offer.updatedBy;
        timestamp = offer.updatedAt;
    }

    const userName = userId ? this.getUserName(userId) : undefined;
    const date = timestamp ? formatDate(timestamp, 'long') : undefined;

    if (status === OfferStatus.AGENT || status === OfferStatus.RETAILER) {
      return `(Underwriting approved by ${userName} on ${date})`;
    }

    if (userName && date) return `by ${userName} on ${date}`;
    if (userName) return `by ${userName}`;
    if (date) return `on the ${date}`;
    return '';
  });

  getStatusColor(): string {
    const status = this.offer().status;

    switch (status) {
      case OfferStatus.DRAFT:
        return 'var(--color--accent--info-50, #e0f2fe)'; // Light blue
      case OfferStatus.APPLICANT:
      case OfferStatus.UNDERWRITING:
        return 'var(--color--accent--warning-50, #fef3c7)'; // Light yellow
      case OfferStatus.RETAILER:
      case OfferStatus.AGENT:
        return 'var(--color--accent--info-100, #bae6fd)'; // Light blue
      case OfferStatus.APPROVED:
      case OfferStatus.LOAN_CREATED:
        return 'var(--color--accent--success-50, #d1fae5)'; // Light green (mint)
      case OfferStatus.REJECTED_BY_UNDERWRITING:
      case OfferStatus.REJECTED_BY_CLIENT:
      case OfferStatus.REJECTED_BY_RETAILER:
      case OfferStatus.REJECTED_BY_AGENT:
        return 'var(--color--accent--danger-50, #fee2e2)'; // Light red
      default:
        return 'var(--color--accent--info-50, #e0f2fe)';
    }
  }

  getStatusTextColor(): string {
    const status = this.offer().status;

    switch (status) {
      case OfferStatus.DRAFT:
        return 'var(--color--accent--info-900, #0c4a6e)';
      case OfferStatus.APPLICANT:
      case OfferStatus.UNDERWRITING:
        return 'var(--color--accent--warning-900, #78350f)';
      case OfferStatus.RETAILER:
      case OfferStatus.AGENT:
        return 'var(--color--accent--info-900, #0c4a6e)';
      case OfferStatus.APPROVED:
      case OfferStatus.LOAN_CREATED:
        return 'var(--color--accent--success-900, #064e3b)';
      case OfferStatus.REJECTED_BY_UNDERWRITING:
      case OfferStatus.REJECTED_BY_CLIENT:
      case OfferStatus.REJECTED_BY_RETAILER:
      case OfferStatus.REJECTED_BY_AGENT:
        return 'var(--color--accent--danger-900, #7f1d1d)';
      default:
        return 'var(--color--accent--info-900, #0c4a6e)';
    }
  }

  onSeeOffer(): void {
    const offer = this.offer();
    if (offer?.requestId) {
      if (this.isMobile()) {
        this.router.navigate(['tabs', 'requests', offer.requestId, 'offers']);
      } else {
        this.router.navigate(['requests', offer.requestId, 'offers']);
      }
    }
  }

  onSeeLoan(): void {
    const offer = this.offer();
    if (offer?.loanId) {
      if (this.isClient()) {
        if (this.isMobile()) {
          this.router.navigate(['tabs', 'loans', 'credit', offer.loanId]);
        } else {
          this.router.navigate(['loans', 'credit', offer.loanId]);
        }
      } else {
        this.router.navigate(['loans', 'credit-line', offer.loanId]);
      }
    }
  }

  createLoanFromOffer(): void {
    this.createLoan.emit();
  }
}
