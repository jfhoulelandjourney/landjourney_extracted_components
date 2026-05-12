import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

@Component({
  selector: 'lj-general-message-dialog',
  imports: [ActivateDirective, MatDialogModule, MatButtonModule],
  templateUrl: './general-message-dialog.component.html',
  styleUrl: './general-message-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralMessageDialogComponent extends BaseDialogComponent {
  dialogRef = inject<MatDialogRef<GeneralMessageDialogComponent>>(MatDialogRef);
  data = inject<{
    message: string;
}>(MAT_DIALOG_DATA);

  message = signal('');

  constructor() {
    super();

    this.message.set(this.data.message);
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
