import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  FileTypes,
  type ExistingFileMetadata,
} from '../../../../models/documents/fileModels';
import { RequestAttachment } from '../../../../models/requestAttachmentModels';
import { ClientDocumentsService } from '../../../../services/client/documents/client-documents.service';
import type { LendAttachment } from '../../../../services/lending/models/lend.models';
import { getFileIcon } from '../../../../utils/fileUtil';
import { PdfViewerComponent } from '../../pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'lj-document',
  imports: [
    NgxSkeletonLoaderModule,
    RouterModule,
    MatIconModule,
    PdfViewerComponent,
  ],
  templateUrl: './document.component.html',
  styleUrl: './document.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentComponent implements AfterViewInit {
  private clientDocumentsService = inject(ClientDocumentsService);

  readonly onDocumentViewed = output<void>();
  readonly onDocumentDownloaded = output<void>();

  attachment = input.required<RequestAttachment | LendAttachment>();

  document = signal<ExistingFileMetadata | undefined>(undefined);
  documentLoaded = signal(false);

  ngAfterViewInit() {
    if (this.attachment().documentId && this.attachment().digest) {
      this.clientDocumentsService
        .fetchDocument(this.attachment().documentId, this.attachment().digest)
        .subscribe({
          next: response => {
            this.document.set(response);
            this.documentLoaded.set(true);

            this.onDocumentViewed.emit();
          },
        });
    }
  }

  documentDownloaded() {
    this.onDocumentDownloaded.emit();
  }

  getFileIcon(file: ExistingFileMetadata) {
    return getFileIcon(file.fileType ?? FileTypes.ANY);
  }

  isImage(): boolean {
    const file = this.document();

    if (!file) {
      return false;
    }

    if (file.pdfGenerated) {
      return false;
    }

    return file.fileType === FileTypes.IMAGE;
  }

  isPdf(): boolean {
    const file = this.document();

    if (!file) {
      return false;
    }

    if (file.pdfGenerated) {
      return true;
    }

    return this.document()?.fileType === FileTypes.PDF;
  }
}
