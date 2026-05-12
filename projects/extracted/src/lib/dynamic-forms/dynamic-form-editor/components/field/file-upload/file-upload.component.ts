
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import type { FileUploadFieldModel } from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import { QuickRequiredConfigurationComponent } from '../../configuration/quick-required-configuration/quick-required-configuration.component';

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
    LjInputFieldComponent,
    MatButtonModule,
    MatTooltipModule,
    EditableInputComponent,
    QuickRequiredConfigurationComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: FileUploadComponent }],
})
export class FileUploadComponent extends AbstractFieldComponent<FileUploadFieldModel> {
  supportedFileTypes = SUPPORTED_FILE_TYPES;

  handleInternalValueChange(value: Partial<FileUploadFieldModel>) {
    const field = this.field();

    if (!field || !field.value) return;

    const nextValue: FileUploadFieldModel = {
      ...field.value,
      ...value,
    };

    field.value = nextValue;
    this.field.set(field);
    this.handleValueChange(nextValue);
  }
}
