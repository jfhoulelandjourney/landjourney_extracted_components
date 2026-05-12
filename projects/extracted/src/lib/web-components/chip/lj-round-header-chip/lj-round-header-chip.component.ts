import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'lj-round-header-chip',
  imports: [],
  templateUrl: './lj-round-header-chip.component.html',
  styleUrl: './lj-round-header-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LjRoundHeaderChipComponent {
  number = input.required<number>();
  text = input<string>('');
  color = input<'brand' | 'gray' | 'white'>('gray');
  size = input<'small' | 'medium' | 'large'>('medium');
}
