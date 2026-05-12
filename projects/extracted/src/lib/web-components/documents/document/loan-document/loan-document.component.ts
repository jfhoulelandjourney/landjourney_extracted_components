import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { LendAttachmentService } from '../../../../services/lending/lend-attachment.service';
import {
  LendAttachmentHistoryActions,
  type LendAttachment,
  type LendAttachmentHistory,
} from '../../../../services/lending/models/lend.models';
import { LendTypes } from '../../../../services/lending/models/lending.enums';
import type { DetailedLoanCompoundSchema } from '../../../../services/lending/models/loans.models';
import { TimeUtil } from '../../../../utils/timeUtil';
import { DocumentComponent } from '../document/document.component';
import { OrganizationService } from '../../../../services/organization/organization.service';

@Component({
  selector: 'lj-loan-document',
  imports: [DocumentComponent],
  templateUrl: './loan-document.component.html',
  styleUrl: './loan-document.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanDocumentComponent {
  private organizationService = inject(OrganizationService);
  private lendAttachmentService = inject(LendAttachmentService);

  loan = input.required<DetailedLoanCompoundSchema>();
  attachment = input.required<LendAttachment>();

  documentViewed() {
    const history: LendAttachmentHistory = {
      organizationUserId: this.organizationService.getOrganizationUserId(),
      action: LendAttachmentHistoryActions.VIEWED,
      details: 'The attachment was viewed',
      timestamp: TimeUtil.getTimestampSeconds(),
    };

    this.lendAttachmentService
      .addAttachmentHistory(
        history,
        LendTypes.LOAN,
        this.loan().id,
        this.attachment().id ?? ''
      )
      .subscribe({});
  }

  documentDownloaded() {
    const history: LendAttachmentHistory = {
      organizationUserId: this.organizationService.getOrganizationUserId(),
      action: LendAttachmentHistoryActions.DOWNLOADED,
      details: 'The attachment was downloaded',
      timestamp: TimeUtil.getTimestampSeconds(),
    };

    this.lendAttachmentService
      .addAttachmentHistory(
        history,
        LendTypes.LOAN,
        this.loan().id,
        this.attachment().id ?? ''
      )
      .subscribe({});
  }
}
