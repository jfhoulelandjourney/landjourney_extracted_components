import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatDialogActions,
  MatDialogConfig,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import { LjButton2Component } from '../../../button2/button.component';
import { BaseDialogComponent } from '../../../dialogs/base-dialog/base-dialog.component';
import { LjTextareaFieldComponent } from '../../../form/textarea-field/textarea-field.component';

@Component({
  selector: 'lj-decline-offer-modal',
  standalone: true,
  imports: [
    ActivateDirective,
    FormsModule,
    LjButton2Component,
    LjTextareaFieldComponent,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
  ],
  templateUrl: './decline-offer-modal.component.html',
  styleUrl: './decline-offer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeclineOfferModalComponent extends BaseDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DeclineOfferModalComponent>);

  reason = signal<string>('');

  isValid = computed(() => {
    const text = this.reason().trim();
    return text.length >= 10; // Minimum 10 characters
  });

  static config(): MatDialogConfig {
    return {
      panelClass: 'decline-offer-modal',
      width: '500px',
    };
  }

  onReasonChange(value: string | Event): void {
    const text = typeof value === 'string' ? value : '';
    this.reason.set(text);
  }

  handleCancel(): void {
    this.dialogRef.close();
  }

  handleConfirm(): void {
    if (this.isValid()) {
      this.dialogRef.close(this.reason());
    }
  }
}
