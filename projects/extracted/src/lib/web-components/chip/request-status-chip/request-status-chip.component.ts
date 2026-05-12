import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionStatuses } from '../../../models/sectionModels';
import { getChipVariant } from './constants';

@Component({
  selector: 'lj-request-status-chip',
  imports: [CommonModule],
  templateUrl: './request-status-chip.component.html',
  styleUrl: '../chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'chipVariant()',
  },
})
export class RequestStatusChipComponent {
  status = input.required<SectionStatuses>();
  closed = input<boolean>(false);

  chipVariant = computed(() => {
    if (this.closed()) {
      return 'chip-danger';
    }
    return `chip-${getChipVariant(this.status())}`;
  });

  displayText = computed(() => {
    if (this.closed()) {
      return 'CLOSED';
    }
    return this.status();
  });
}
