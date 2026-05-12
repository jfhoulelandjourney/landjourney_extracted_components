import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'lj-avatar',
  imports: [MatTooltipModule, ActivateDirective],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  name = input<string>('');
  tooltip = input<string | null>(null);
  avatarUrl = input<SafeResourceUrl | string | undefined | null>(null);
  size = input<'tiny' | 'small' | 'medium' | 'large' | 'x-large'>('medium');
  showBorder = input<boolean>(false);
  imagePadding = input<boolean>(false);
  forceText = input<boolean>(false);
  useNameColor = input<boolean>(true);
  textColor = input<string>('white');
  readonly avatarClick = output<void>();

  backgroundColor = computed(() => {
    if (!this.useNameColor()) return null;
    return this.generateBackgroundColor(this.name());
  });

  isMobile = computed(() => {
    const ua = navigator.userAgent;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
      ua
    );
  });

  private generateBackgroundColor(name: string): string {
    if (!name) return 'var(--Gray-500, #64748B)';

    // Convert name to a number with a hash function
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Generate HSL color that is not too dark and not too light
    const h = Math.abs(hash) % 360; // Hue: 0-360
    const s = 65 + (Math.abs(hash) % 25); // Saturation: 65-90%
    const l = 30 + (Math.abs(hash) % 15); // Lightness: 30-45%

    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  getInitials(): string {
    if (this.forceText()) {
      return this.name();
    }

    // Remove any non alphanumeric symbol
    // Replace all multi-spaces to single space
    // Trim and split by space
    const nameParts = this.name()
      .replace(/[^\w\s']|_/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);
    const firstPart = nameParts.at(0)?.charAt(0).toUpperCase() ?? '';
    const lastPart = nameParts.at(-1)?.charAt(0).toUpperCase() ?? '';

    if (nameParts.length === 1) {
      return firstPart;
    }

    return [firstPart, lastPart].join('');
  }
}
