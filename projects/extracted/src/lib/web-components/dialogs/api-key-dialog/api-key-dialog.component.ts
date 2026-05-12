import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { LjButtonComponent } from '../../button/button.component';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

@Component({
  selector: 'lj-api-key-dialog',
  imports: [
    ActivateDirective,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    LjButtonComponent,
  ],
  templateUrl: './api-key-dialog.component.html',
  styleUrl: './api-key-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyDialogComponent extends BaseDialogComponent {
  dialogRef = inject<MatDialogRef<ApiKeyDialogComponent>>(MatDialogRef);
  data = inject<{ keyId: string; key: string }>(MAT_DIALOG_DATA);
  private uiNotification = inject(UiNotificationService);

  keyId = signal('');
  key = signal('');

  constructor() {
    super();

    this.keyId.set(this.data.keyId);
    this.key.set(this.data.key);
  }

  copyTextToClipboard(input: string) {
    navigator.clipboard.writeText(input);

    this.uiNotification.showSnackbar(
      'The information was copied to the clipboard!',
      'green'
    );
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
