import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  ExistingFileMetadata,
  FileTypes,
} from '../../../models/documents/fileModels';
import {
  RequestAttachment,
  RequestAttachmentHistoryActions,
} from '../../../models/requestAttachmentModels';
import type { RequestUser } from '../../../models/requestModels';
import { ClientDocumentsService } from '../../../services/client/documents/client-documents.service';
import { getFileIcon } from '../../../utils/fileUtil';
import { TimeUtil } from '../../../utils/timeUtil';
import { LjImageComponent } from '../../image/image.component';
import { OrganizationService } from '../../../services/organization/organization.service';

@Component({
  selector: 'lj-request-document-preview',
  templateUrl: './document-preview.component.html',
  styleUrls: ['./document-preview.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    LjImageComponent,
    NgxSkeletonLoaderModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPreviewComponent implements AfterViewInit {
  private router = inject(Router);
  private organizationService = inject(OrganizationService);
  private clientDocumentsService = inject(ClientDocumentsService);

  requestId = input.required<string>();
  requestUsers = input.required<RequestUser[]>();
  attachment = input.required<RequestAttachment>();
  isMobile = input(false);

  documentLoading = signal(false);
  document = signal<ExistingFileMetadata | undefined>(undefined);

  ngAfterViewInit() {
    if (!this.documentLoading()) {
      this.documentLoading.set(true);

      if (this.attachment()) {
        const fileId = this.attachment().documentId;
        const digest = this.attachment().digest;

        this.clientDocumentsService
          .fetchDocument(fileId, digest ?? '')
          .subscribe({
            next: response => {
              this.document.set(response);
              this.documentLoading.set(false);
            },
          });
      } else {
        this.documentLoading.set(false);
      }
    }
  }

  getFileIcon() {
    return getFileIcon(this.document()?.fileType ?? FileTypes.ANY);
  }

  goToDocument() {
    this.router.navigateByUrl(
      `/requests/${this.requestId()}/documents/${this.attachment()?.id}`
    );
  }

  getUploadMessage() {
    for (const event of this.attachment()?.history ?? []) {
      if (event.action === RequestAttachmentHistoryActions.CREATED) {
        return TimeUtil.convertSecondTimestampToLocaleDateString(
          event.timestamp
        );
      }
    }

    return 'UNKNOWN';
  }

  getUserName() {
    for (const event of this.attachment()?.history ?? []) {
      if (event.action === RequestAttachmentHistoryActions.CREATED) {
        if (
          event.organizationUserId ===
          this.organizationService.getOrganizationUserId()
        ) {
          return 'You';
        }

        for (const user of this.requestUsers()) {
          if (user.userId === event.organizationUserId) {
            if (
              user.profile &&
              'firstName' in user.profile &&
              'lastName' in user.profile
            ) {
              return `${user.profile?.firstName} ${user.profile?.lastName}`;
            } else {
              return `${user.firstName} ${user.lastName}`;
            }
          }
        }
      }
    }

    return 'SYSTEM';
  }
}
