
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { formatAmountFromCents } from '../../../utils/numberUtil';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-header',
  templateUrl: './loan-header.component.html',
  styleUrls: ['./loan-header.component.scss'],
  imports: [],
})
export class LoanHeaderComponent {
  formatDate = readableDateFromTimestamp;
  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  mobile = input<boolean>(false);
  loan = input<DetailedLoanCompoundSchema | undefined>();

  isOverdue() {
    if (this.loan()?.nextPaymentDueDate) {
      const currentDate = new Date();
      const dueDate = new Date(this.loan()?.nextPaymentDueDate ?? 0);

      return currentDate > dueDate;
    }

    return false;
  }
}
