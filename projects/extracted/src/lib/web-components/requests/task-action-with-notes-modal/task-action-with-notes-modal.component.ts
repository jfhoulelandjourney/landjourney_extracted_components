import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { LjButtonComponent } from '../../button/button.component';
import { BaseDialogComponent } from '../../dialogs/base-dialog/base-dialog.component';

export interface TaskActionWithNotesDialogData {
  taskName?: string;
  message?: string;
  confirmButtonText?: string;
  title?: string;
  notesLabel?: string;
  notesPlaceholder?: string;
}

@Component({
  selector: 'lj-task-action-with-notes-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    FormsModule,
    CdkTextareaAutosize,
    LjButtonComponent,
    ActivateDirective,
  ],
  templateUrl: './task-action-with-notes-modal.component.html',
  styleUrl: './task-action-with-notes-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskActionWithNotesModalComponent extends BaseDialogComponent {
  data = inject<TaskActionWithNotesDialogData>(MAT_DIALOG_DATA);
  private dialogRef =
    inject<MatDialogRef<TaskActionWithNotesModalComponent>>(MatDialogRef);

  notes = model<string>('');

  closeDialog(proceed: boolean) {
    this.dialogRef.close({
      proceed: proceed,
      notes: this.notes()?.trim() || undefined,
    });
  }
}
