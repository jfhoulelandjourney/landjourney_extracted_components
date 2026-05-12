
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  type AfterViewChecked,
} from '@angular/core';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { YearCreditLineHistoryOverviewSchema } from '../../../services/lending/models/credit-lines.models';
import { formatAmountFromCents } from '../../../utils/numberUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-history',
  templateUrl: './credit-line-history.component.html',
  styleUrls: ['./credit-line-history.component.scss'],
  imports: [ActivateDirective],
})
export class CreditLineHistoryComponent implements AfterViewChecked {
  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  histories = input<YearCreditLineHistoryOverviewSchema[]>([]);
  selectedHistory = signal<YearCreditLineHistoryOverviewSchema | undefined>(
    undefined
  );

  ngAfterViewChecked() {
    if (!this.selectedHistory()) {
      this.selectedHistory.set(this.histories().at(0));
    }
  }

  handleHistoryClicked(history: YearCreditLineHistoryOverviewSchema) {
    this.selectedHistory.set(history);
  }
}
