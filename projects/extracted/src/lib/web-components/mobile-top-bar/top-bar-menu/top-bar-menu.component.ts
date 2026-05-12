import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { TopBarAvatarComponent } from '../top-bar-avatar/top-bar-avatar.component';

@Component({
  selector: 'lj-top-bar-menu',
  imports: [MatIconModule, TopBarAvatarComponent],
  templateUrl: './top-bar-menu.component.html',
  styleUrl: './top-bar-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'top-bar-menu',
  },
})
export class TopBarMenuComponent {
  readonly open = input<boolean>(false);
  readonly avatarUrl = input<string | null>(null);
  readonly avatarName = input<string>('');
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }
}
