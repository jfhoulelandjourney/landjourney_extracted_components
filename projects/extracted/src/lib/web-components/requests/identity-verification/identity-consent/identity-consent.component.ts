
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
  selector: 'lj-identity-consent',
  templateUrl: './identity-consent.component.html',
  styleUrls: ['./identity-consent.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    MatCheckboxModule,
    FormsModule,
    MatTooltipModule
],
})
export class IdentityConsentComponent {
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
      <h2 mat-dialog-title>ID Verification Terms and Conditions</h2>
      <div mat-dialog-content class="content">
        <p class="body-s">
          Completing this ID verification process online is not required to
          obtain credit. If you do not wish to complete identity verification
          online, please contact our support team to provide the required
          information to manually verify your identity.
        </p>

        <p class="body-s">
          Pursuant to the federal Fair Credit Reporting Act ("FCRA"), I hereby
          authorize {{ getTenantName() }} and its designated agents and
          representatives to conduct a comprehensive review of my background
          through a consumer report and/or an investigative consumer report that
          may be used as a factor in establishing my eligibility for credit,
          insurance or for any other purpose in the FCRA. I understand that the
          scope of the consumer report/investigative consumer report may
          include, but is not limited to, the following areas: verification of
          Social Security number; current and previous residences; and other
          public records.
        </p>

        <p class="body-s">
          I authorize the complete release of these records or data pertaining
          to me that an individual, company, firm, corporation or public agency
          may have. I am authorizing that a photocopy of this authorization be
          accepted with the same authority as the original. I understand that,
          pursuant to the federal Fair Credit Reporting Act, if any adverse
          action is to be taken based upon the consumer report, a copy of the
          report and a summary of the consumer's rights will be provided to me.
          I further understand that by checking the consent box I am signing
          this authorization electronically.
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
