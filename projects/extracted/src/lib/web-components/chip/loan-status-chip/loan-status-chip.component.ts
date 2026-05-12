import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { LendingAccountStatuses as AccountStatuses } from '../../../services/lending/models/lending.enums';
import { getChipVariant } from './constants';

@Component({
  selector: 'lj-loan-status-chip',
  imports: [CommonModule],
  templateUrl: './loan-status-chip.component.html',
  styleUrl: '../chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'chipVariant()',
  },
})
export class LoanStatusChipComponent {
  status = input.required<AccountStatuses>();
  chipVariant = computed(() => `chip-${getChipVariant(this.status())}`);
}
