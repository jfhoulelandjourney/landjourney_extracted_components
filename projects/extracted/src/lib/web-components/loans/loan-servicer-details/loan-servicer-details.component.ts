
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-servicer-details',
  templateUrl: './loan-servicer-details.component.html',
  styleUrls: ['./loan-servicer-details.component.scss'],
  imports: [],
})
export class LoanServicerDetailsComponent {
  loan = input<DetailedLoanCompoundSchema | undefined>();
}
