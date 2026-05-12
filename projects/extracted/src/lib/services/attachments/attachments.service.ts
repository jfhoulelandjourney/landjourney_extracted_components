import { inject, Injectable } from '@angular/core';
import {
  HttpEventType,
  HttpProgressEvent,
  HttpResponse,
} from '@angular/common/http';
import {
  filter,
  map,
  merge,
  Observable,
  of,
  share,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { Attachment, TaskStatuses } from '../../models/sectionModels';
import { getFileType } from '../../utils/fileUtil';
import { getRandomString, getUUID4 } from '../../utils/stringUtil';
import { WorkflowService } from '../workflows-api/workflow.service';
import { ApiMessage } from '../api/api.service';
import { DocumentService } from '../documents/document.service';
import {
  ExistingFileMetadata,
  FileMetadata,
} from '../../models/documents/fileModels';

export type AttachmentMetadata = Pick<
  Attachment,
  'type' | 'writable' | 'senderType' | 'status' | 'id' | 'name' | 'notes'
>;

export type AttachmentFileUploadResponse =
  | {
      type: 'attachment';
      value: Attachment;
    }
  | {
      type: 'progress';
      value: HttpProgressEvent;
    };

@Injectable({
  providedIn: 'root',
})
export class AttachmentsService {
  documentService = inject(DocumentService);
  workflowService = inject(WorkflowService);

  // ATTACHMENTS
  // ==================

  createFileMetadata(
    file: File,
    options: {
      fileName?: string;
      fileMetadata?: Record<string, unknown>;
    } = {}
  ): FileMetadata {
    const metadata: FileMetadata = {
      fileType: getFileType(file.type),
      originalName: options.fileName ?? file.name,
      fileMetadata: options.fileMetadata ?? {},
    };

    return metadata;
  }

  taskStatusIndicatesFileWasProvided(status: TaskStatuses): boolean {
    const validStatuses = [
      TaskStatuses.PROVIDED,
      TaskStatuses.REJECTED,
      TaskStatuses.APPROVED,
    ];
    return validStatuses.includes(status);
  }

  /**
   * Create an attachment as a placeholder for a future upload
   */
  registerAttachmentPlaceholder(
    attachmentMetadata: AttachmentMetadata,
    options: {
      name?: string;
    }
  ): Observable<Attachment> {
    return of({
      id: attachmentMetadata.id ?? getUUID4(),
      name: options.name ?? attachmentMetadata.name ?? getRandomString(12),
      type: attachmentMetadata.type,
      writable: attachmentMetadata.writable,
      senderType: attachmentMetadata.senderType,
      status: attachmentMetadata.status,
    });
  }

  registerAttachment(
    metadata: FileMetadata,
    attachmentMetadata: AttachmentMetadata
  ): Observable<Attachment> {
    return this.documentService.createFileMetadata(metadata).pipe(
      map(response => {
        return {
          id: attachmentMetadata.id,
          documentId: response.id,
          name: metadata.originalName ?? getRandomString(12),
          digest: response.digest,
          type: attachmentMetadata.type,
          writable: attachmentMetadata.writable,
          senderType: attachmentMetadata.senderType,
          status: attachmentMetadata.status,
        };
      })
    );
  }

  /**
   * Upload a file to an existing attachment
   * Update the attachment with the relevant data returned by the API
   */
  uploadFileToAttachmentForClient(
    file: File,
    attachment: Attachment
  ): Observable<AttachmentFileUploadResponse> {
    const { documentId: id, digest } = attachment;
    if (!id) {
      return throwError(
        () =>
          new Error('Could not create the attachment', {
            cause: 'Attachment requires an File ID',
          })
      );
    }

    if (!digest) {
      return throwError(
        () =>
          new Error('Could not create the attachment', {
            cause: 'Attachment requires a digest value',
          })
      );
    }

    return this.documentService.getUploadConfiguration(id, digest).pipe(
      switchMap(uploadConfiguration => {
        const upload$ = this.documentService
          .uploadFile(uploadConfiguration, { file })
          .pipe(
            // Share the upload stream between both subscribers
            share()
          );

        // Handle progress events
        const progress$ = upload$.pipe(
          filter(event => event.type === HttpEventType.UploadProgress),
          map(event => ({
            type: 'progress' as const,
            value: event as HttpProgressEvent,
          }))
        );

        // Handle completion and thumbnail generation
        const complete$ = upload$.pipe(
          filter(event => event.type === HttpEventType.Response),
          take(1),
          map(() => ({
            type: 'attachment' as const,
            value: attachment,
          }))
        );

        return merge(progress$, complete$);
      })
    );
  }

  /**
   * Upload a file to an existing attachment
   * Update the attachment with the relevant data returned by the API
   */
  uploadFileToAttachment(
    file: File,
    attachment: Attachment,
    props: {
      fileName?: string;
      fileMetadata?: Record<string, unknown>;
    } = {}
  ): Observable<AttachmentFileUploadResponse> {
    const { documentId, digest } = attachment ?? {};
    const metadata = this.createFileMetadata(file, {
      ...props,
      fileMetadata: {
        ...props.fileMetadata,
        originalName: file.name,
      },
    });

    const optionalFirstStep$ =
      documentId && digest
        ? of({ documentId, digest })
        : this.documentService.createFileMetadata(metadata).pipe(
            map(response => ({
              documentId: response.id ?? '',
              digest: response.digest ?? '',
            }))
          );

    return optionalFirstStep$.pipe(
      switchMap(({ documentId, digest }) => {
        return this.documentService
          .getUploadConfiguration(documentId, digest)
          .pipe(
            map(uploadConfiguration => ({
              digest,
              documentId,
              uploadConfiguration,
            }))
          );
      }),
      switchMap(({ documentId, digest, uploadConfiguration }) => {
        const upload$ = this.documentService
          .uploadFile(uploadConfiguration, { file })
          .pipe(
            share() // Share the upload stream between both subscribers
          );

        // Handle progress events
        const progress$ = upload$.pipe(
          filter(event => event.type === HttpEventType.UploadProgress),
          map(event => ({
            type: 'progress' as const,
            value: event as HttpProgressEvent,
          }))
        );

        // Handle completion and thumbnail generation
        const complete$ = upload$.pipe(
          filter(event => event.type === HttpEventType.Response),
          map(event => event as HttpResponse<ApiMessage>),
          map(() => ({
            type: 'attachment' as const,
            value: {
              ...attachment,
              documentId,
              digest,
            },
          })),
          take(1)
        );

        return merge(progress$, complete$);
      })
    );
  }

  /**
   * Create a new attachment with the provided file
   */
  createAttachmentWithFile(
    file: File,
    attachmentMetadata: AttachmentMetadata
  ): Observable<AttachmentFileUploadResponse> {
    return this.uploadFileToAttachment(file, attachmentMetadata);
  }

  getAttachmentFileInfo(
    attachment: Attachment
  ): Observable<ExistingFileMetadata> {
    const { documentId, digest } = attachment;

    if (!documentId || !digest) {
      return throwError(() => {
        return new Error('Unable to download file', {
          cause: 'Attachment requires an ID and a digest value',
        });
      });
    }

    return this.documentService.getFileMetadata(documentId, digest);
  }

  // TODO: TEMPLATE ATTACHMENTS
}
