/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DeviceDetectorService } from 'ngx-device-detector';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import type { Request } from '../../../../models/requestModels';
import {
  AttachmentTypes,
  SenderTypes,
  TaskStatuses,
  type Attachment,
  type Section,
} from '../../../../models/sectionModels';
import { AttachmentsService } from '../../../../services/attachments/attachments.service';
import { ClientRequestsService } from '../../../../services/client/requests/client-requests.service';
import type { IdDocumentType } from '../../../../services/data/enums/identity-verification.enums';
import { UiNotificationService } from '../../../../services/notifications/ui-notification.service';
import { getUUID4 } from '../../../../utils/stringUtil';
import { FileUploaderComponent } from '../../../form/file-uploader/file-uploader.component';

const STEP = {
  FRONT_ATTACHMENT: 'FRONT_ATTACHMENT',
  BACK_ATTACHEMENT: 'BACK_ATTACHMENT',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-identity-upload',
  templateUrl: './identity-upload.component.html',
  styleUrls: ['./identity-upload.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    FileUploaderComponent,
    MatProgressSpinner,
  ],
})
export class IdentityUploadComponent implements OnInit {
  readonly attachmentsService = inject(AttachmentsService);
  readonly clientRequestsService = inject(ClientRequestsService);
  readonly uiNotificationService = inject(UiNotificationService);
  protected readonly deviceDetector = inject(DeviceDetectorService);
  request = input.required<Request>();
  section = input.required<Section>();
  name = input.required<string>();
  idDocumentType = input<IdDocumentType | undefined>(undefined);

  readonly onIdentityFilesUploaded = output<{
    idFrontDocumentId: string;
    idBackDocumentId: string | undefined;
  }>();
  readonly onBack = output();

  step = signal(STEP.FRONT_ATTACHMENT);
  frontAttachment = signal<Attachment | undefined>(undefined);
  backAttachment = signal<Attachment | undefined>(undefined);
  frontFilePreview = signal<string | undefined>(undefined);
  backFilePreview = signal<string | undefined>(undefined);
  uploading = signal(false);
  uploadingFile = signal(false);
  showUploader = signal(false);

  ngOnInit() {
    const attachments = this.section().tasks[0]?.attachments ?? [];
    this.frontAttachment.set(attachments[0]);
    this.backAttachment.set(attachments[1]);
    this.step.set(STEP.FRONT_ATTACHMENT);

    if (this.frontAttachment()?.documentId && this.frontAttachment()?.digest) {
      this.clientRequestsService
        .getAttachmentFile(this.frontAttachment()!)
        .subscribe({
          next: file => {
            this.frontFilePreview.set(file?.originalUrl ?? undefined);
            if (file?.originalUrl) {
              this.showUploader.set(false);
            } else {
              this.showUploader.set(true);
            }
          },
        });
    } else {
      this.showUploader.set(true);
    }
  }

  getTitleSentence(): string {
    if (this.idDocumentType() === 'PASSPORT') {
      return `Upload a photo of ${this.name()}'s passport`;
    } else {
      return `Upload a photo of the ${this.isFirstStep() ? 'the front' : 'the back'} side of ${this.name()}'s ID `;
    }
  }

  isFirstStep() {
    return this.step() === STEP.FRONT_ATTACHMENT;
  }

  previous() {
    if (this.isFirstStep()) {
      this.onBack.emit();
    } else {
      this.step.set(STEP.FRONT_ATTACHMENT);
    }
  }

  onFileSelected(newFiles: FileList) {
    if (!newFiles || newFiles.length === 0) return;
    const file = newFiles[0];
    if (!file) return;
    this.uploadFileAndSetPreview(file);
  }

  private uploadFileAndSetPreview(file: File) {
    if (
      !['image/png', 'image/jpeg', 'image/jpg'].includes(
        file.type.toLowerCase()
      )
    ) {
      this.uiNotificationService.showSnackbar(
        'Only PNG, JPEG, and JPG files are allowed. Please try again.',
        'red'
      );
      return;
    }

    const isFront = this.isFirstStep();
    const att = isFront ? this.frontAttachment()! : this.backAttachment()!;
    const metadata = {
      id: getUUID4(),
      name: att?.name ?? '',
      type: att?.type ?? AttachmentTypes.FILE,
      writable: att?.writable ?? true,
      senderType: att?.senderType ?? SenderTypes.CLIENT,
      status: att?.status ?? TaskStatuses.PROVIDED,
    };

    this.uploadingFile.set(true);
    this.attachmentsService
      .createAttachmentWithFile(file, metadata)
      .pipe(
        filter(
          (r): r is { type: 'attachment'; value: Attachment } =>
            r.type === 'attachment'
        ),
        take(1),
        tap(({ value }) => {
          const updated = { ...value, status: TaskStatuses.PROVIDED };
          if (isFront) {
            this.frontAttachment.set({
              ...this.frontAttachment()!,
              ...updated,
            });
            if (this.idDocumentType() === 'PASSPORT') {
              this.backAttachment.set({
                ...this.backAttachment()!,
                status: TaskStatuses.PROVIDED,
              });
            }
          } else {
            this.backAttachment.set({ ...this.backAttachment()!, ...updated });
          }
        }),
        switchMap(({ value }) =>
          this.clientRequestsService.getAttachmentFile(value)
        ),
        tap(f => {
          const url = f?.originalUrl ?? undefined;
          if (isFront) this.frontFilePreview.set(url);
          else this.backFilePreview.set(url);
        }),
        switchMap(() =>
          this.clientRequestsService.uploadFilesToSectionBypassStatus(
            this.request(),
            this.section(),
            this.section().tasks[0]!,
            [this.frontAttachment()!, this.backAttachment()!]
          )
        ),
        tap(() => {
          this.showUploader.set(false);
          this.uploadingFile.set(false);
        })
      )
      .subscribe({
        error: () => this.uploadingFile.set(false),
      });
  }

  resetFileUpload() {
    if (this.isFirstStep()) {
      this.frontFilePreview.set(undefined);
    } else {
      this.backFilePreview.set(undefined);
    }
    this.showUploader.set(true);
  }

  next() {
    if (this.idDocumentType() === 'OTHER_GOVERNMENT_ID') {
      this.step.set(STEP.BACK_ATTACHEMENT);
      if (this.backAttachment()?.documentId && this.backAttachment()?.digest) {
        this.clientRequestsService
          .getAttachmentFile(this.backAttachment()!)
          .subscribe({
            next: file => {
              this.backFilePreview.set(file?.originalUrl ?? undefined);
              this.showUploader.set(!file?.originalUrl);
            },
          });
      } else {
        this.showUploader.set(true);
      }
    } else if (this.idDocumentType() === 'PASSPORT') {
      this.onIdentityFilesUploaded.emit({
        idFrontDocumentId: this.frontAttachment()?.documentId ?? '',
        idBackDocumentId: this.backAttachment()?.documentId ?? undefined,
      });
    }
  }

  submit() {
    this.showUploader.set(false);
    this.onIdentityFilesUploaded.emit({
      idFrontDocumentId: this.frontAttachment()?.documentId ?? '',
      idBackDocumentId: this.backAttachment()?.documentId ?? undefined,
    });
  }
}
