import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type ChipVariant = 'danger' | 'info' | 'muted' | 'success' | 'warning';
export type ChipSize = 'default' | 'small';

@Component({
  selector: 'lj-chip, *[lj-chip]',
  imports: [],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
})
export class ChipComponent {
  variant = input.required<ChipVariant>();
  size = input<ChipSize>('default');
  text = input<string>();
  hostClass = computed(() => {
    const classes = `chip-${this.variant()}`;
    return this.size() === 'small' ? `${classes} chip-small` : classes;
  });
}
