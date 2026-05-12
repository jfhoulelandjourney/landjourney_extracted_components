import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  RequestAttachmentHistoryActions,
  type RequestAttachment,
  type RequestAttachmentHistory,
} from '../../../../models/requestAttachmentModels';
import type { ClientRequest } from '../../../../services/client/requests/client-requests.service';
import { WorkflowService } from '../../../../services/workflows-api/workflow.service';
import { TimeUtil } from '../../../../utils/timeUtil';
import { DocumentComponent } from '../document/document.component';
import { OrganizationService } from '../../../../services/organization/organization.service';

@Component({
  selector: 'lj-request-document',
  imports: [DocumentComponent],
  templateUrl: './request-document.component.html',
  styleUrl: './request-document.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestDocumentComponent {
  private organizationService = inject(OrganizationService);
  private workflowService = inject(WorkflowService);

  request = input.required<ClientRequest>();
  attachment = input.required<RequestAttachment>();

  documentViewed() {
    const history: RequestAttachmentHistory = {
      organizationUserId: this.organizationService.getOrganizationUserId(),
      action: RequestAttachmentHistoryActions.VIEWED,
      details: 'The attachment was viewed',
      timestamp: TimeUtil.getTimestampSeconds(),
    };

    this.workflowService
      .addAttachmentHistory(
        history,
        this.request().id ?? '',
        this.attachment().id ?? ''
      )
      .subscribe({});
  }

  documentDownloaded() {
    const history: RequestAttachmentHistory = {
      organizationUserId: this.organizationService.getOrganizationUserId(),
      action: RequestAttachmentHistoryActions.DOWNLOADED,
      details: 'The attachment was downloaded',
      timestamp: TimeUtil.getTimestampSeconds(),
    };

    this.workflowService
      .addAttachmentHistory(
        history,
        this.request().id ?? '',
        this.attachment().id ?? ''
      )
      .subscribe({});
  }
}
