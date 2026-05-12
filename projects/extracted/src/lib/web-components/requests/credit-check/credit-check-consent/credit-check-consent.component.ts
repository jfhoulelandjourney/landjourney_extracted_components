
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import { OrganizationService } from '../../../../services/organization/organization.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-check-consent',
  templateUrl: './credit-check-consent.component.html',
  styleUrls: ['./credit-check-consent.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    MatCheckboxModule,
    FormsModule,
    MatTooltipModule
],
})
export class CreditCheckConsentComponent {
  readonly dialog = inject(MatDialog);
  isMobile = input(false);

  readonly onBack = output();
  readonly onConsentGiven = output<void>();

  consentGiven = false;

  openTermsAndConditionsModal = () => {
    this.dialog.open(TermsAndConditionsModalComponent);
  };
}

@Component({
  template: `
    <div class="dialog">
      <h2 mat-dialog-title>Credit Check Terms and Conditions</h2>
      <div mat-dialog-content class="content">
        <p class="body-s">
          Completing this credit check process online is not required to obtain
          credit. If you do not wish to complete credit check online, please
          contact our support team to provide the required information to
          manually check your credit score.
        </p>

        <p class="body-s">
          Pursuant to the federal Fair Credit Reporting Act ("FCRA"), I hereby
          authorize {{ getTenantName() }} and its designated agents and
          representatives to check my credit score. I understand that the credit
          score may be used as a factor in establishing my eligibility for
          credit, insurance or for any other purpose in the FCRA.
        </p>

        <p class="body-s">
          I authorize the complete release of my personal information to check
          my credit score. I further understand that by checking the consent box
          I am signing this authorization electronically.
        </p>
      </div>
      <mat-dialog-actions align="center">
        <button class="lj-button" (activate)="close()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog {
        width: 800px;
        padding: var(--padding-comfortable);
      }

      @media (max-width: 480px) {
        .dialog {
          width: 100%;
        }
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: var(--gap-spacious);
      }
    `,
  ],
  imports: [MatDialogModule, ActivateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndConditionsModalComponent {
  readonly organizationService = inject(OrganizationService);
  readonly dialogRef = inject(MatDialogRef<TermsAndConditionsModalComponent>);

  getTenantName() {
    return this.organizationService.getTenantName();
  }

  close() {
    this.dialogRef.close();
  }
}
