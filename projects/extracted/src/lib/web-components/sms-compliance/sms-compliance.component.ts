import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { OrganizationService } from '../../services/organization/organization.service';

@Component({
  selector: 'lj-sms-compliance',
  imports: [MatCheckboxModule, FormsModule],
  templateUrl: './sms-compliance.component.html',
  styleUrl: './sms-compliance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmsComplianceComponent {
  private organizationService = inject(OrganizationService);

  confirmationCheck = model(false);

  getConditionalString(condition: boolean, value: string): string {
    if (condition) {
      return value;
    }

    return '';
  }

  getTermsOfUse(): string {
    return this.organizationService.uiConfiguration.termsOfUseUrl ?? '';
  }

  getPrivacyPolicy(): string {
    return this.organizationService.uiConfiguration.privacyPolicyUrl ?? '';
  }

  showTermsOfUse(): boolean {
    return (
      Boolean(this.organizationService.uiConfiguration.termsOfUseUrl) &&
      this.organizationService.uiConfiguration.termsOfUseUrl?.trim() !== ''
    );
  }

  showPrivacyPolicy(): boolean {
    return (
      Boolean(this.organizationService.uiConfiguration.privacyPolicyUrl) &&
      this.organizationService.uiConfiguration.privacyPolicyUrl?.trim() !== ''
    );
  }
}
