
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  type AfterViewChecked,
} from '@angular/core';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { YearLoanHistoryOverviewSchema } from '../../../services/lending/models/loans.models';
import { formatAmountFromCents } from '../../../utils/numberUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-history',
  templateUrl: './loan-history.component.html',
  styleUrls: ['./loan-history.component.scss'],
  imports: [ActivateDirective],
})
export class LoanHistoryComponent implements AfterViewChecked {
  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  histories = input<YearLoanHistoryOverviewSchema[]>([]);
  selectedHistory = signal<YearLoanHistoryOverviewSchema | undefined>(
    undefined
  );

  ngAfterViewChecked() {
    if (!this.selectedHistory()) {
      this.selectedHistory.set(this.histories().at(0));
    }
  }

  handleHistoryClicked(history: YearLoanHistoryOverviewSchema) {
    this.selectedHistory.set(history);
  }
}
