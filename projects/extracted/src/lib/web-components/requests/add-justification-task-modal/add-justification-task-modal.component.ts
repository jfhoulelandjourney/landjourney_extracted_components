import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ChangeDetectionStrategy, Component, model, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LjButtonComponent } from '../../button/button.component';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { BaseDialogComponent } from '../../dialogs/base-dialog/base-dialog.component';
import { TaskStatuses } from '../../../models/sectionModels';

export interface DialogData {
  justification?: string;
  taskName?: string;
  futureStatus?: TaskStatuses;
}

@Component({
  selector: 'lj-add-justification-task-modal',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    FormsModule,
    CdkTextareaAutosize,
    LjButtonComponent,
    ActivateDirective,
  ],
  templateUrl: './add-justification-task-modal.component.html',
  styleUrl: './add-justification-task-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddJustificationTaskModalComponent extends BaseDialogComponent {
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject<MatDialogRef<AddJustificationTaskModalComponent>>(MatDialogRef);

  justification = model<string | undefined>(undefined);
  futureStatus = signal<TaskStatuses | undefined>(undefined);
  TaskStatuses = TaskStatuses;

  constructor() {
    super();

    this.justification.set(this.data.justification);
    this.futureStatus.set(this.data.futureStatus);
  }

  isValid(): boolean {
    return this.justification()?.trim() !== '';
  }

  closeDialog(proceed: boolean) {
    this.dialogRef.close({
      proceed: proceed,
      justification: this.justification(),
    });
  }
}
