import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SafeHtmlPipe } from '../../../pipes/safe-html/safe-html.pipe';
import { Condition } from '../../../services/organization/conditions.models';

export interface ConditionsReviewDialogData {
  condition: Condition;
}

@Component({
  selector: 'lj-conditions-review-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    SafeHtmlPipe,
  ],
  templateUrl: './conditions-review-dialog.component.html',
  styleUrl: './conditions-review-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionsReviewDialogComponent {
  private dialogRef = inject(MatDialogRef<ConditionsReviewDialogComponent>);
  data = inject<ConditionsReviewDialogData>(MAT_DIALOG_DATA);
  confirmationCheck = signal(false);

  close(): void {
    this.dialogRef.close();
  }
}
