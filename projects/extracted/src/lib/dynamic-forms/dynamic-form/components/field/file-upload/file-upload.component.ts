import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';

import { MatDialog } from '@angular/material/dialog';
import { FieldDirective } from '../../../../../directives/field.directive';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { SystemGroups } from '../../../../../models/authModels';
import { FileMetadata } from '../../../../../models/documents/fileModels';
import { Actions, Resources } from '../../../../../models/organizationModels';
import {
  Attachment,
  AttachmentTypes,
  SenderTypes,
  TaskStatuses,
} from '../../../../../models/sectionModels';
import { DocumentService } from '../../../../../services/documents/document.service';
import { IAMService } from '../../../../../services/identity/iam.service';
import { OrganizationService } from '../../../../../services/organization/organization.service';
import { PermissionUtil } from '../../../../../utils/permissionUtil';
import { getUUID4 } from '../../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { ViewDocumentModalComponent } from '../../../../../web-components/documents/view-document-modal/view-document-modal.component';
import { FileUploaderComponent } from '../../../../../web-components/form/file-uploader/file-uploader.component';
import { DynamicFormFieldTypes } from '../../../../models/dynamic-forms.models';
import type {
  FileUploadAttachment,
  FileUploadFieldModel,
} from '../../../../models/fields.models';

const SUPPORTED_FILE_TYPES =
  'application/msword,application/vnd.ms-excel,application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet,text/csv,text/richtext,text/html,text/txt,text/rtf,application/pdf,image/*';

@Component({
  selector: 'lj-df-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
    MatCheckboxModule,
    LjButtonComponent,
    ActivateDirective,
    FileUploaderComponent,
    MatButtonModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: FileUploadComponent }],
})
export class FileUploadComponent
  extends AbstractFieldComponent<FileUploadFieldModel>
  implements OnInit
{
  private dialog = inject(MatDialog);
  private documentService = inject(DocumentService);
  private iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);

  supportedFileTypes = SUPPORTED_FILE_TYPES;

  constructor() {
    super();
    this.authenticatedOnly.set(true);
  }

  ngOnInit() {
    const field = this.field();
    if (field && (!field.value || !Array.isArray(field.value.files))) {
      field.value = {
        allowMultipleUploads: false,
        files: [],
      };

      this.field.set(field);
      this.addNewFile();
    }

    if (field.value?.files?.length === 0) {
      this.addNewFile();
    }
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const { value, required } = this.field();

    if (required && !value) {
      return ValidationErrorKey.REQUIRED;
    }

    if (
      required &&
      !(value?.files ?? []).some(value => value?.documentId && value?.digest)
    ) {
      return ValidationErrorKey.REQUIRED;
    }

    return undefined;
  }

  attachmentsArePresent(): boolean {
    return (this.field().value?.files ?? []).some(file => file.documentId);
  }

  showExport(): boolean {
    return (
      window.location.pathname.toLowerCase().includes('/requests/') &&
      PermissionUtil.isInGroup(
        this.iamService.getUserGroups(
          this.organizationService.getOrganizationId()
        ),
        SystemGroups.EMPLOYEES
      ) &&
      PermissionUtil.isAuthorized(
        this.iamService.getUserPermissions(
          this.organizationService.getOrganizationId()
        ),
        Resources.REQUESTS,
        Actions.UPDATE
      )
    );
  }

  handleOnBlur() {
    this.touched.set(true);
  }

  convertToAttachmentArray(file: FileUploadAttachment): Attachment[] {
    return [
      {
        ...file,
        type: AttachmentTypes.FILE,
        status: TaskStatuses.PROVIDED,
        senderType: SenderTypes.CLIENT,
        writable: true,
      },
    ];
  }

  viewFile(file: FileUploadAttachment) {
    this.documentService
      .getFileMetadata(file.documentId ?? '', file.digest ?? '')
      .subscribe({
        next: response => {
          this.dialog.open(
            ViewDocumentModalComponent,
            ViewDocumentModalComponent.config({
              title: file.name,
              file: response,
            })
          );
        },
      });
  }

  addNewFile() {
    const field = this.field();
    if (field.value?.files) {
      const fieldValue = field.value;

      fieldValue.files.push({
        id: getUUID4(),
        name: '',
      });

      this.handleValueChange(fieldValue);
    }
  }

  downloadFile(file: FileUploadAttachment) {
    this.documentService
      .getFileMetadata(file.documentId ?? '', file.digest ?? '')
      .subscribe({
        next: response => {
          const objectUrl = response.originalUrl ?? '';
          const a = document.createElement('a');
          a.href = objectUrl;
          a.style.display = 'none';
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(objectUrl);
          document.body.removeChild(a);
        },
      });
  }

  exportFile(file: FileUploadAttachment) {
    this.customAction.emit({
      action: 'export',
      fieldType: DynamicFormFieldTypes.FILE_UPLOAD,
      fieldValue: file,
    });
  }

  exportAll() {
    this.customAction.emit({
      action: 'export_all',
      fieldType: DynamicFormFieldTypes.FILE_UPLOAD,
      fieldValue: this.field().value,
    });
  }

  removeFile(file: FileUploadAttachment) {
    this.handleOnBlur();
    const field = this.field();

    if (field.value?.files) {
      const fieldValue = structuredClone(field.value);
      const fieldValuefiles = fieldValue.files.filter(
        item => item.id !== file.id
      );
      fieldValue.files = fieldValuefiles;
      this.handleValueChange(fieldValue);
    }
  }

  saveDocument(file: FileUploadAttachment, metadata: FileMetadata) {
    this.handleOnBlur();
    const field = this.field();

    if (field.value?.files) {
      const fieldValue = structuredClone(field.value);
      const existingFile = fieldValue.files.find(item => item.id === file.id);

      if (existingFile) {
        existingFile.digest = metadata.digest;
        existingFile.documentId = metadata.documentId;
        existingFile.name = metadata.originalName ?? '';
        existingFile.exported = false;
        this.handleValueChange(fieldValue);
      }
    }
  }
}
