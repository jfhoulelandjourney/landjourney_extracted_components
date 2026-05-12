import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { lastValueFrom } from 'rxjs';
import { ExistingFileMetadata } from '../../models/documents/fileModels';
import { Attachment, AttachmentTypes } from '../../models/sectionModels';
import { DocumentService } from '../../services/documents/document.service';
import { getAttachmentIcon } from '../../utils/fileUtil';

@Component({
  selector: 'lj-attachments-list',
  imports: [MatIcon, MatButtonModule],
  templateUrl: './attachments-list.component.html',
  styleUrl: './attachments-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'list',
  },
})
export class LjAttachmentsListComponent {
  private documentService = inject(DocumentService);
  private attachmentsMetadata = signal<
    Record<string, Partial<ExistingFileMetadata>>
  >({});

  attachments = input<Attachment[]>([]);
  isTemplate = input<boolean>(false);

  constructor() {
    effect(async () => {
      for (const attachment of this.attachments()) {
        const id = attachment.documentId ?? attachment.id;

        if (!id || this.attachmentsMetadata()[id]) {
          return;
        }

        const metadata = await this.getFileMetadata(attachment);
        untracked(() => {
          if (metadata) {
            this.attachmentsMetadata.update(curr => ({
              ...curr,
              [id]: metadata,
            }));
          }
        });
      }
    });
  }

  readonly delete = output<Attachment>();
  readonly download = output<Attachment>();

  getAttachmentIcon(attachmentType: AttachmentTypes) {
    return getAttachmentIcon(attachmentType);
  }

  async getFileMetadata(file: Attachment) {
    if (this.isTemplate() || file.isTemplate) {
      const response = await lastValueFrom(
        this.documentService.getFileTemplateMetadata(
          file.documentId ?? file.id ?? ''
        )
      );
      return response;
    }

    const { digest, documentId } = file;
    const response = await lastValueFrom(
      this.documentService.getFileMetadata(documentId ?? '', digest ?? '')
    );
    return response;
  }
}
