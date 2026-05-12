
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';
import { formatAmountFromCents } from '../../../utils/numberUtil';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-header',
  templateUrl: './credit-line-header.component.html',
  styleUrls: ['./credit-line-header.component.scss'],
  imports: [],
})
export class CreditLineHeaderComponent {
  formatDate = readableDateFromTimestamp;
  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  mobile = input<boolean>(false);
  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();

  /**
   * Calculate total used credit:
   * - If sublines exist, sum the usageCents from all sublines
   * - Otherwise, use the usageCents from the credit line
   */
  usedCreditCents = computed(() => {
    const line = this.creditLine();
    if (!line) return 0;

    // If credit line has sublines, sum their usage
    if (line.sublines && line.sublines.length > 0) {
      return line.sublines.reduce(
        (total, subline) => total + (subline.usageCents ?? 0),
        0
      );
    }

    // Otherwise use the credit line's usage
    return line.usageCents ?? 0;
  });

  /**
   * Calculate available credit:
   * - Use creditLimitCents from the API
   * - Subtract the total used credit
   */
  availableCreditCents = computed(() => {
    const line = this.creditLine();
    if (!line) return 0;

    const limit: number =
      line.currentCommitmentCents ?? line.creditLimitCents ?? 0;

    return limit - this.usedCreditCents();
  });

  isOverdue() {
    if (this.creditLine()?.nextPaymentDueDate) {
      const currentDate = new Date();
      const nextPaymentDueTimestamp =
        this.creditLine()?.nextPaymentDueDate ?? 0;
      const dueDate = new Date(nextPaymentDueTimestamp * 1000);

      return currentDate > dueDate;
    }

    return false;
  }
}
