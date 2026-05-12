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
import { SafeHtmlPipe } from '../../../pipes/safe-html/safe-html.pipe';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

@Component({
  selector: 'lj-contact-details-dialog',
  imports: [
    ActivateDirective,
    MatDialogModule,
    MatButtonModule,
    SafeHtmlPipe,
    MatIconModule,
  ],
  templateUrl: './contact-details-dialog.component.html',
  styleUrl: './contact-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactDetailsDialogComponent extends BaseDialogComponent {
  dialogRef = inject<MatDialogRef<ContactDetailsDialogComponent>>(MatDialogRef);
  data = inject<{ contactDetails: string }>(MAT_DIALOG_DATA);

  contactDetails = signal('');

  constructor() {
    super();

    this.contactDetails.set(this.data.contactDetails);
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
