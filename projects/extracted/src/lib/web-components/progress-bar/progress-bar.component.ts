import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnInit,
} from '@angular/core';

export type ProgressBarVariant = 'default';

@Component({
  selector: 'lj-progress-bar',
  imports: [],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuetext]': 'value() + "/" + max()',
    '[class]': 'hostClass()',
  },
})
export class ProgressBarComponent implements OnInit {
  max = input.required<number>();
  value = input.required<number>();
  variant = input<ProgressBarVariant>('default');
  startLabel = input<string>('');
  endLabel = input<string>('');

  progress = computed(() => {
    return (this.value() / this.max()) * 100;
  });

  hostClass = computed(() => {
    return `variant-${this.variant()}`;
  });

  ngOnInit() {
    if (this.max() <= 0) {
      throw new Error('Max must be a positive number');
    }

    if (this.value() < 0) {
      throw new Error('Value cannot be less than 0');
    }

    if (this.value() > this.max()) {
      throw new Error('Value cannot be greater than max');
    }
  }
}
