import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogConfig,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  ExistingFileMetadata,
  FileTypes,
} from '../../../models/documents/fileModels';
import { LjButtonComponent } from '../../button/button.component';
import { BaseDialogComponent } from '../../dialogs/base-dialog/base-dialog.component';
import { LjImageComponent } from '../../image/image.component';
import { LottieWrapperComponent } from '../../lottie-wrapper/lottie-wrapper.component';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';

export interface DialogData {
  file: ExistingFileMetadata;
  title: string;
}

@Component({
  selector: 'lj-view-document-modal',
  imports: [
    ActivateDirective,
    LjImageComponent,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    PdfViewerComponent,
    LottieWrapperComponent,
    LjButtonComponent,
  ],
  templateUrl: './view-document-modal.component.html',
  styleUrl: './view-document-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDocumentModalComponent extends BaseDialogComponent {
  protected FileTypes = FileTypes;
  readonly dialogRef = inject(MatDialogRef<ViewDocumentModalComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly file = input(this.data.file);
  readonly title = input(this.data.title);

  static config(data: DialogData): MatDialogConfig<DialogData> {
    return {
      panelClass: 'df-file-upload-modal',
      width: '800px',
      data: data,
    };
  }

  showPdfViewer(): boolean {
    return (
      this.file().pdfGenerated ||
      this.file().originalName.toLowerCase().endsWith('.pdf')
    );
  }

  showImageViewer(): boolean {
    const fileExtension =
      this.file().originalName.split('.').reverse()[0] ?? '';

    return (
      !this.showPdfViewer() &&
      (this.file().thumbnailGenerated ||
        ['jpg', 'jpeg', 'png'].includes(fileExtension))
    );
  }

  showConversionInProgress(): boolean {
    return !this.showPdfViewer() && !this.showImageViewer();
  }

  close() {
    this.dialogRef.close();
  }
}
