
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-closed-banner',
  templateUrl: './loan-closed-banner.component.html',
  styleUrls: ['./loan-closed-banner.component.scss'],
  imports: [MatIconModule],
})
export class LoanClosedBannerComponent {
  formatDate = readableDateFromTimestamp;
  mobile = input<boolean>(false);
  loan = input<DetailedLoanCompoundSchema | undefined>();
}
