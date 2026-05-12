import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../directives/activate/activate.directive';

@Component({
  selector: 'lj-side-panel',
  imports: [MatIconModule, ActivateDirective],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidePanelComponent {
  isOpen = input<boolean>(false);
  closeButtonText = input<string>('Close');
  panelWidth = input<string>('400px');

  readonly closePanel = output<void>();

  isPanelVisible = signal<boolean>(false);
  isOverlayInDom = signal<boolean>(false);

  private closingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        if (this.closingTimeout !== null) {
          clearTimeout(this.closingTimeout);
          this.closingTimeout = null;
        }
        this.isOverlayInDom.set(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.isPanelVisible.set(true);
          });
        });
      } else {
        this.isPanelVisible.set(false);
        this.closingTimeout = setTimeout(() => {
          this.isOverlayInDom.set(false);
          this.closingTimeout = null;
        }, 300);
      }
    });
  }

  onClose() {
    this.closePanel.emit();
  }

  onOverlayClick(event: Event) {
    if (
      (event.target as HTMLElement).classList.contains('side-panel-overlay')
    ) {
      this.onClose();
    }
  }
}
