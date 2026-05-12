import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { LendAttachmentService } from '../../../../services/lending/lend-attachment.service';
import type { DetailedCreditLineCompoundSchema } from '../../../../services/lending/models/credit-lines.models';
import {
  LendAttachmentHistoryActions,
  type LendAttachment,
  type LendAttachmentHistory,
} from '../../../../services/lending/models/lend.models';
import { LendTypes } from '../../../../services/lending/models/lending.enums';
import { TimeUtil } from '../../../../utils/timeUtil';
import { DocumentComponent } from '../document/document.component';
import { OrganizationService } from '../../../../services/organization/organization.service';

@Component({
  selector: 'lj-credit-line-document',
  imports: [DocumentComponent],
  templateUrl: './credit-line-document.component.html',
  styleUrl: './credit-line-document.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditLineDocumentComponent {
  private organizationService = inject(OrganizationService);
  private lendAttachmentService = inject(LendAttachmentService);

  creditLine = input.required<DetailedCreditLineCompoundSchema>();
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
        LendTypes.CREDIT_LINE,
        this.creditLine().id,
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
        LendTypes.CREDIT_LINE,
        this.creditLine().id,
        this.attachment().id ?? ''
      )
      .subscribe({});
  }
}
