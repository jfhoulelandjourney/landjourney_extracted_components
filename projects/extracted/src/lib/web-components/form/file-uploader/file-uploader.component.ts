import { HttpEventType } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DeviceDetectorService } from 'ngx-device-detector';
import { catchError, concatMap, firstValueFrom, of } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  FileMetadata,
  UploadConfiguration,
} from '../../../models/documents/fileModels';
import { Attachment } from '../../../models/sectionModels';
import { ApiMessage } from '../../../services/api/api.service';
import { DocumentService } from '../../../services/documents/document.service';
import { formatBytes, getFileType } from '../../../utils/fileUtil';
import { getRandomString } from '../../../utils/stringUtil';

@Component({
  selector: 'lj-file-uploader',
  imports: [ActivateDirective, MatIcon, MatProgressSpinner],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dragover)': 'handleDragOver($event)',
    '(dragleave)': 'handleDragLeave($event)',
    '(drop)': 'handleDragDrop($event)',
  },
})
export class FileUploaderComponent {
  private documentService = inject(DocumentService);
  protected deviceDetector = inject(DeviceDetectorService);

  id = signal<string>(getRandomString(12));

  fileDropRef = viewChild.required<ElementRef>('fileDropRef');

  name = input<string>('file-drop');
  horizontal = input(true);
  vertical = input(false);
  small = input(false);
  allowDrag = input(true);
  style = input<string>('');
  templates = input<Attachment[]>([]);
  single = input(false);
  allowUpload = input(true);
  isTemplate = input<boolean>(false);
  isClient = input<boolean>(false);
  files = input<Attachment[]>([]);
  required = input<boolean>(false);
  minimumFileSizeInBytes = input<number | null>(null);

  supportedFileTypes = input<string>('');

  acceptedFileTypes = [];
  uploading = signal<boolean>(false);
  dragging = signal<boolean>(false);
  displayFileSizeError = signal<boolean>(false);
  displayFileSizeEmptyError = signal<boolean>(false);
  useSpinnerWhenLoading = input<boolean>(false);

  fileUploaded:
    | {
        file: File;
        uploadStatus: number;
        digest: string | undefined;
        metadata: FileMetadata;
      }
    | undefined = undefined;

  readonly filesChange = output<Attachment[]>();
  readonly fileCreate = output<FileMetadata>();
  readonly fileSelected = output<FileList>();
  readonly uploadFailed = output<File>();

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.handleFileChange(input.files);
  }

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(true);
  }

  handleDragDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (!this.uploading()) {
      this.handleFileChange(files);
    }
  }

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
  }

  public openFileBrowser() {
    this.fileDropRef().nativeElement.click();
  }

  private fileIsEmpty(file: File) {
    if (file.size === 0) {
      return true;
    }
    return false;
  }

  private async hydrateFile(file: File): Promise<File> {
    // This code is to circumvent the image optimization when dragging is started in a web based desktop app
    // In those cases, on windows machines, it uses virtual files that may have an optimized / low dpi images.
    return new Promise((resolve, _reject) => {
      const reader = new FileReader();

      reader.onload = event => {
        const buffer: ArrayBuffer = event.target?.result as ArrayBuffer;
        const blob = new Blob([buffer], { type: file.type });
        const newFile = new File([blob], file.name, { type: file.type });

        resolve(newFile);
      };

      reader.onerror = () => resolve(file);
      reader.readAsArrayBuffer(file);
    });
  }

  private async handleFileChange(files?: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    let file: File | undefined = files[0];

    if (!file) {
      return;
    }

    this.displayFileSizeError.set(false);
    this.displayFileSizeEmptyError.set(false);

    const minimumFileSize = this.minimumFileSizeInBytes();
    let fileSizeOk = minimumFileSize ? file.size >= minimumFileSize : true;

    if (this.fileIsEmpty(file) || !fileSizeOk) {
      file = await this.hydrateFile(file);
    }

    fileSizeOk = minimumFileSize ? file.size >= minimumFileSize : true;

    if (!fileSizeOk) {
      this.displayFileSizeError.set(true);
      return;
    }

    if (this.fileIsEmpty(file)) {
      this.displayFileSizeEmptyError.set(true);
      return;
    }

    if (this.supportedFileTypes().trim() !== '') {
      const wildcardType = [file.type.split('/')[0], '*'].join('/');

      if (
        !this.supportedFileTypes().toLowerCase().includes(file.type) &&
        !this.supportedFileTypes().toLowerCase().includes(wildcardType)
      ) {
        return;
      }
    }

    this.fileSelected.emit(files);

    if (!this.allowUpload()) {
      return;
    }

    this.fileUploaded = {
      file: file,
      uploadStatus: 0,
      digest: undefined,
      metadata: this.createFileMetadata(file),
    };

    this.uploadFile();
  }

  private createFileMetadata(file: File): FileMetadata {
    const metadata: FileMetadata = {
      fileType: getFileType(file.type),
      originalName: file.name,
      fileMetadata: {
        fileName: file.name,
      },
    };

    return metadata;
  }

  async uploadFile() {
    this.uploading.set(true);

    if (!this.fileUploaded) {
      this.uploading.set(false);
      return;
    }

    let metadataResponse: ApiMessage | undefined;

    if (this.isTemplate()) {
      metadataResponse = await firstValueFrom(
        this.documentService.createFileTemplateMetadata(
          this.fileUploaded.metadata
        )
      );
    } else {
      metadataResponse = await firstValueFrom(
        this.documentService.createFileMetadata(this.fileUploaded.metadata)
      );
    }

    this.fileUploaded.metadata.id = metadataResponse.id ?? '';
    this.fileUploaded.metadata.documentId = metadataResponse.id ?? '';
    this.fileUploaded.metadata.digest = metadataResponse.digest ?? '';

    let uploadConfiguration: UploadConfiguration | undefined;

    if (this.isTemplate()) {
      uploadConfiguration = await firstValueFrom(
        this.documentService.getFileTemplateUploadConfiguration(
          this.fileUploaded.metadata.id
        )
      );
    } else {
      uploadConfiguration = await firstValueFrom(
        this.documentService.getUploadConfiguration(
          this.fileUploaded.metadata.documentId,
          this.fileUploaded.metadata.digest
        )
      );
    }

    this.documentService
      .uploadFile(uploadConfiguration, this.fileUploaded)
      .pipe(
        concatMap(event => of(event)),
        catchError(() => {
          if (this.fileUploaded?.file) {
            console.error('File upload failed', this.fileUploaded.file);
            this.uploadFailed.emit(this.fileUploaded?.file);
          }
          return of(null);
        })
      )
      .subscribe({
        next: event => {
          if (
            event?.type === HttpEventType.UploadProgress &&
            this.fileUploaded
          ) {
            this.fileUploaded.uploadStatus =
              this.documentService.getPercentageUploaded(event);
          }

          if (event?.type === HttpEventType.Response && this.fileUploaded) {
            this.fileCreate.emit({ ...this.fileUploaded.metadata });
            this.fileUploaded = undefined;
            this.uploading.set(false);
          }
        },
        error: () => {
          this.fileUploaded = undefined;
          this.uploading.set(false);
        },
        complete: () => {
          if (this.fileUploaded) {
            this.fileCreate.emit({ ...this.fileUploaded.metadata });
            this.fileUploaded = undefined;
          }
          this.uploading.set(false);
        },
      });
  }

  handleFilesChange() {
    this.filesChange.emit(this.files());
  }

  formatBytes(bytes: number, decimalPlaces = 2) {
    return formatBytes(bytes, decimalPlaces);
  }

  // MOBILE DETECTION

  isMobile(): boolean {
    return this.deviceDetector.isMobile();
  }
}
