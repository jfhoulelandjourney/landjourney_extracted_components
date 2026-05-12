import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../directives/activate/activate.directive';
import { UiNotificationService } from '../../services/notifications/ui-notification.service';

@Component({
  selector: 'lj-copy-to-clipboard-button',
  imports: [MatIconModule, ActivateDirective],
  templateUrl: './copy-to-clipboard-button.component.html',
  styleUrl: './copy-to-clipboard-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyToClipboardButtonComponent {
  private readonly uiNotification = inject(UiNotificationService);

  /** The value to copy to clipboard */
  value = input<string | number | null | undefined>();

  /** Optional custom success message */
  successMessage = input<string>('Copied to clipboard.');

  copyToClipboard(): void {
    const valueToCopy = this.value();

    if (valueToCopy === null || valueToCopy === undefined || valueToCopy === '') {
      return;
    }

    navigator.clipboard.writeText(String(valueToCopy));
    this.uiNotification.showSnackbar(this.successMessage(), 'green');
  }
}
