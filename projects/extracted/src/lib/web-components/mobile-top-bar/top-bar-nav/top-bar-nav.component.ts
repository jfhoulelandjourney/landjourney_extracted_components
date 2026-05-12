import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { CenterMode } from '../mobile-top-bar.model';
import { TopBarAvatarComponent } from '../top-bar-avatar/top-bar-avatar.component';

@Component({
  selector: 'lj-top-bar-nav',
  imports: [MatIconModule, TopBarAvatarComponent],
  templateUrl: './top-bar-nav.component.html',
  styleUrl: './top-bar-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'top-bar-nav',
  },
})
export class TopBarNavComponent {
  readonly centerMode = input<CenterMode>('logo');
  readonly logoUrl = input<string>('');
  readonly avatarUrl = input<string | null>(null);
  readonly avatarName = input<string>('');
  readonly progressLabel = input<string>('');
  readonly showBackButton = input<boolean>(true);
  readonly progressSteps = input<number>(0);
  readonly activeStep = input<number>(0);
  readonly menuOpen = input<boolean>(false);

  readonly avatarClick = output<void>();
  readonly backClick = output<void>();
  readonly logoClick = output<void>();

  readonly steps = computed(() =>
    Array.from({ length: this.progressSteps() }, (_, i) => i + 1)
  );
}
