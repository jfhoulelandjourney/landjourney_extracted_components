import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AvatarComponent } from '../../../design-system/molecules/avatar/avatar.component';

@Component({
  selector: 'lj-top-bar-avatar',
  imports: [AvatarComponent],
  templateUrl: './top-bar-avatar.component.html',
  styleUrl: './top-bar-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarAvatarComponent {
  readonly avatarUrl = input<string | null>(null);
  readonly name = input<string>('');
}
