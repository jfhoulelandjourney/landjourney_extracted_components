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
import { ClientDocumentsService } from '../../../services/client/documents/client-documents.service';
import {
  LendAttachmentHistoryActions,
  type LendAttachment,
} from '../../../services/lending/models/lend.models';
import type { LoanUserBaseSchema } from '../../../services/lending/models/loans.models';
import { getFileIcon } from '../../../utils/fileUtil';
import { TimeUtil } from '../../../utils/timeUtil';
import { LjImageComponent } from '../../image/image.component';
import { OrganizationService } from '../../../services/organization/organization.service';

@Component({
  selector: 'lj-loan-document-preview',
  templateUrl: './loan-document-preview.component.html',
  styleUrls: ['./loan-document-preview.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    LjImageComponent,
    NgxSkeletonLoaderModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanDocumentPreviewComponent implements AfterViewInit {
  private router = inject(Router);
  private organizationService = inject(OrganizationService);
  private clientDocumentsService = inject(ClientDocumentsService);

  loanId = input.required<string>();
  loanUsers = input.required<LoanUserBaseSchema[]>();
  attachment = input.required<LendAttachment>();
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
    if (this.isMobile()) {
      this.router.navigateByUrl(
        `/tabs/loans/loan/${this.loanId()}/documents/${this.attachment()?.id}`
      );
    } else {
      this.router.navigateByUrl(
        `/loans/loan/${this.loanId()}/documents/${this.attachment()?.id}`
      );
    }
  }

  getUploadMessage() {
    for (const event of this.attachment()?.history ?? []) {
      if (event.action === LendAttachmentHistoryActions.CREATED) {
        return TimeUtil.convertSecondTimestampToLocaleDateString(
          event.timestamp
        );
      }
    }

    return 'UNKNOWN';
  }

  getUserName() {
    for (const event of this.attachment()?.history ?? []) {
      if (event.action === LendAttachmentHistoryActions.CREATED) {
        if (
          event.organizationUserId ===
          this.organizationService.getOrganizationUserId()
        ) {
          return 'You';
        }

        for (const user of this.loanUsers()) {
          if (user.userId === event.organizationUserId) {
            if (
              user.profile &&
              'firstName' in user.profile &&
              'lastName' in user.profile
            ) {
              return `${user.profile?.firstName} ${user.profile?.lastName}`;
            }
          }
        }
      }
    }

    return 'SYSTEM'; // THIS SHOULD RETURN THE LOAN OFFICER NAME BUT THE LOAN OFFICER IS NOT PART OF USERS ON LOAN
  }
}
