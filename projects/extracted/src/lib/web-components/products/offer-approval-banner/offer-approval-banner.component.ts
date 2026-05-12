
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { Offer, OfferStatus } from '../../../services/products/offers.service';
import { DeclineOfferModalComponent } from './decline-offer-modal/decline-offer-modal.component';

@Component({
  selector: 'lj-offer-approval-banner',
  standalone: true,
  imports: [ActivateDirective, MatDialogModule, MatIconModule],
  templateUrl: './offer-approval-banner.component.html',
  styleUrl: './offer-approval-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferApprovalBannerComponent {
  OfferStatus = OfferStatus;
  private dialog = inject(MatDialog);
  private organizationService = inject(OrganizationService);
  private uiNotification = inject(UiNotificationService);

  offer = input.required<Offer>();
  isClient = input<boolean>(false);
  readonly onOfferApproved = output<Offer>();
  readonly onOfferDeclined = output<Offer>();

  shouldShowBanner(): boolean {
    const offer = this.offer();
    const isDemoMode = this.organizationService.isDemoModeActivated();
    if (!isDemoMode) {
      return false;
    }
    return (
      offer.status === OfferStatus.AGENT ||
      offer.status === OfferStatus.RETAILER ||
      offer.status === OfferStatus.APPLICANT
    );
  }

  shouldShowActions(): boolean {
    const offer = this.offer();
    if (this.isClient()) {
      return offer.status === OfferStatus.APPLICANT;
    } else {
      return offer.status !== OfferStatus.APPLICANT;
    }
  }

  handleApprove(): void {
    const offer = this.offer();
    const userId = this.organizationService.getOrganizationUserId();
    const now = new Date();
    if (
      offer.status === OfferStatus.AGENT ||
      offer.status === OfferStatus.RETAILER
    ) {
      let updatedOffer: Offer = {
        ...offer,
        status: OfferStatus.APPLICANT,
      };

      if (offer.status === OfferStatus.AGENT) {
        updatedOffer = {
          ...updatedOffer,
          agentApprovedBy: userId,
          agentApprovedAt: now,
          sentToApplicantAt: now,
          sentToApplicantBy: userId,
        };
      } else if (offer.status === OfferStatus.RETAILER) {
        updatedOffer = {
          ...updatedOffer,
          retailerApprovedBy: userId,
          retailerApprovedAt: now,
          sentToApplicantAt: now,
          sentToApplicantBy: userId,
        };
      }

      this.onOfferApproved.emit(updatedOffer);
      this.uiNotification.showSnackbar(
        'Offer sent to the main borrower for approval.',
        'green'
      );
    }

    if (this.isClient() && offer.status === OfferStatus.APPLICANT) {
      this.onOfferApproved.emit({
        ...offer,
        status: OfferStatus.APPROVED,
        clientApprovedBy: userId,
        clientApprovedAt: now,
      });
      this.uiNotification.showSnackbar(
        'You have approved this offer.',
        'green'
      );
    }
  }

  handleDecline(): void {
    const offer = this.offer();
    const dialogRef = this.dialog.open(
      DeclineOfferModalComponent,
      DeclineOfferModalComponent.config()
    );

    dialogRef.afterClosed().subscribe((reason: string | undefined) => {
      // If user cancelled the modal, don't decline the offer
      if (!reason) {
        return;
      }

      const previousStatus = offer.status;
      const newStatus =
        previousStatus === OfferStatus.AGENT
          ? OfferStatus.REJECTED_BY_AGENT
          : previousStatus === OfferStatus.RETAILER
            ? OfferStatus.REJECTED_BY_RETAILER
            : OfferStatus.REJECTED_BY_CLIENT;

      const updatedOffer: Offer = {
        ...offer,
        status: newStatus,
        rejectedBy: this.organizationService.getOrganizationUserId(),
        rejectedAt: new Date(),
        rejectedReason: reason,
      };

      this.onOfferDeclined.emit(updatedOffer);
      this.uiNotification.showSnackbar('Offer declined.', 'red');
    });
  }
}
