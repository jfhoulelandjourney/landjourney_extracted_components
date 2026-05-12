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
import {
  WebcamModule,
  type WebcamImage,
  type WebcamInitError,
} from 'ngx-webcam';
import { lastValueFrom, of, Subject, type Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
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
import { getUUID4 } from '../../../../utils/stringUtil';

const STEP = {
  FRONT_ATTACHMENT: 'FRONT_ATTACHMENT',
  BACK_ATTACHEMENT: 'BACK_ATTACHMENT',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-identity-camera',
  templateUrl: './identity-camera.component.html',
  styleUrls: ['./identity-camera.component.scss'],
  imports: [
    WebcamModule,
    MatIconModule,
    ActivateDirective,
    MatProgressSpinner
],
})
export class IdentityCameraComponent implements OnInit {
  readonly attachmentsService = inject(AttachmentsService);
  readonly clientRequestsService = inject(ClientRequestsService);
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
  frontFile = signal<File | undefined>(undefined);
  backFile = signal<File | undefined>(undefined);
  uploading = signal(false);
  hasNewFile = signal(false);
  showCamera = signal(false);

  errors: WebcamInitError[] = [];
  trigger: Subject<void> = new Subject<void>();

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
              this.showCamera.set(false);
            } else {
              this.showCamera.set(true);
            }
          },
        });
    } else {
      this.showCamera.set(true);
    }
  }

  getTitleSentence(): string {
    if (this.idDocumentType() === 'PASSPORT') {
      return `Take a photo of ${this.name()}'s passport`;
    } else {
      return `Take a photo of the ${this.isFirstStep() ? 'the front' : 'the back'} side of ${this.name()}'s ID `;
    }
  }

  public handleImage(webcamImage: WebcamImage): void {
    const arr = webcamImage.imageAsDataUrl.split(',');
    const bstr = atob(arr[1]!);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    if (this.isFirstStep()) {
      const file: File = new File([u8arr], 'front side of ID image', {
        type: 'image/jpeg',
      });

      this.frontFile.set(file);
      this.frontFilePreview.set(webcamImage.imageAsDataUrl);
    } else {
      const file: File = new File([u8arr], 'back side of ID image', {
        type: 'image/jpeg',
      });

      this.backFile.set(file);
      this.backFilePreview.set(webcamImage.imageAsDataUrl);
    }

    this.hasNewFile.set(true);
    this.showCamera.set(false);
  }

  handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  triggerSnapshot(): void {
    this.trigger.next();
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

  resetFileUpload() {
    if (this.isFirstStep()) {
      this.frontFile.set(undefined);
      this.frontFilePreview.set(undefined);
    } else {
      this.backFile.set(undefined);
      this.backFilePreview.set(undefined);
    }
    this.showCamera.set(true);
  }

  async next() {
    if (this.idDocumentType() === 'OTHER_GOVERNMENT_ID') {
      this.step.set(STEP.BACK_ATTACHEMENT);
    }

    if (this.hasNewFile()) {
      const frontAttachmentMetadata = {
        id: getUUID4(),
        name: this.frontAttachment()?.name ?? '',
        type: this.frontAttachment()?.type ?? AttachmentTypes.FILE,
        writable: this.frontAttachment()?.writable ?? true,
        senderType: this.frontAttachment()?.senderType ?? SenderTypes.CLIENT,
        status: this.frontAttachment()?.status ?? TaskStatuses.PROVIDED,
      };

      const frontUpload = await lastValueFrom(
        this.attachmentsService.createAttachmentWithFile(
          this.frontFile()!,
          frontAttachmentMetadata
        )
      );

      this.frontAttachment.set({
        ...this.frontAttachment()!,
        ...(frontUpload.type === 'attachment' ? { ...frontUpload.value } : {}),
        status: TaskStatuses.PROVIDED,
      });

      if (this.idDocumentType() === 'PASSPORT') {
        this.backAttachment.set({
          ...this.backAttachment()!,
          status: TaskStatuses.PROVIDED,
        });
      }

      this.clientRequestsService
        .uploadFilesToSectionBypassStatus(
          this.request(),
          this.section(),
          this.section().tasks[0]!,
          [this.frontAttachment()!, this.backAttachment()!]
        )
        .pipe(
          switchMap(() => {
            if (this.idDocumentType() === 'OTHER_GOVERNMENT_ID') {
              this.hasNewFile.set(false);
            }
            return of(undefined);
          }),
          tap(() => {
            if (this.idDocumentType() !== 'OTHER_GOVERNMENT_ID') {
              this.onIdentityFilesUploaded.emit({
                idFrontDocumentId: this.frontAttachment()?.documentId ?? '',
                idBackDocumentId:
                  this.backAttachment()?.documentId ?? undefined,
              });
            }
          })
        )
        .subscribe();
    } else {
      if (this.idDocumentType() === 'PASSPORT') {
        this.onIdentityFilesUploaded.emit({
          idFrontDocumentId: this.frontAttachment()?.documentId ?? '',
          idBackDocumentId: this.backAttachment()?.documentId ?? undefined,
        });
      }
    }

    if (
      this.idDocumentType() === 'OTHER_GOVERNMENT_ID' &&
      this.backAttachment()?.documentId &&
      this.backAttachment()?.digest
    ) {
      this.clientRequestsService
        .getAttachmentFile(this.backAttachment()!)
        .subscribe({
          next: file => {
            this.backFilePreview.set(file?.originalUrl ?? undefined);
            if (file?.originalUrl) {
              this.showCamera.set(false);
            } else {
              this.showCamera.set(true);
            }
          },
        });
    } else {
      this.showCamera.set(true);
    }
  }

  async submit() {
    this.showCamera.set(false);
    if (this.hasNewFile()) {
      this.uploading.set(true);

      const backAttachmentMetadata = {
        id: getUUID4(),
        name: this.backAttachment()?.name ?? '',
        type: this.backAttachment()?.type ?? AttachmentTypes.FILE,
        writable: this.backAttachment()?.writable ?? true,
        senderType: this.backAttachment()?.senderType ?? SenderTypes.CLIENT,
        status: this.backAttachment()?.status ?? TaskStatuses.PROVIDED,
      };

      const backUpload = await lastValueFrom(
        this.attachmentsService.createAttachmentWithFile(
          this.backFile()!,
          backAttachmentMetadata
        )
      );

      this.backAttachment.set({
        ...this.backAttachment()!,
        ...(backUpload.type === 'attachment' ? { ...backUpload.value } : {}),
        status: TaskStatuses.PROVIDED,
      });

      this.clientRequestsService
        .uploadFilesToSectionBypassStatus(
          this.request(),
          this.section(),
          this.section().tasks[0]!,
          [this.frontAttachment()!, this.backAttachment()!]
        )
        .pipe(
          tap(() =>
            this.onIdentityFilesUploaded.emit({
              idFrontDocumentId: this.frontAttachment()?.documentId ?? '',
              idBackDocumentId: this.backAttachment()?.documentId ?? undefined,
            })
          )
        )
        .subscribe();
    } else {
      this.onIdentityFilesUploaded.emit({
        idFrontDocumentId: this.frontAttachment()?.documentId ?? '',
        idBackDocumentId: this.backAttachment()?.documentId ?? undefined,
      });
    }
  }
}
