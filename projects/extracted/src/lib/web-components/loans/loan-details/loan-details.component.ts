
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { InterestAttributes } from '../../../services/lending/models/lending.enums';
import {
  DetailedLoanCompoundSchema,
  LoanStatementBaseSchema,
  YearLoanHistoryOverviewSchema,
} from '../../../services/lending/models/loans.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import {
  formatAmountFromCents,
  formatPercent,
} from '../../../utils/numberUtil';
import { getFormattedEnumValue } from '../../../utils/stringUtil';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';
import { TableColumnDefWithMeta } from '../../data-table/data-table.model';
import { DataTableService } from '../../data-table/service/data-table.service';
import { DataTableComponent } from '../../data-table/table/data-table.component';
import { LoanHistoryComponent } from '../loan-history/loan-history.component';
import { LoanStatementsComponent } from '../loan-statements/loan-statements.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-details',
  templateUrl: './loan-details.component.html',
  styleUrls: ['./loan-details.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    LoanHistoryComponent,
    LoanStatementsComponent,
    MatExpansionModule,
    DataTableComponent
],
  providers: [DataTableService],
})
export class LoanDetailsComponent {
  private organizationService = inject(OrganizationService);
  formatDate = readableDateFromTimestamp;
  formatPercent = formatPercent;
  getFormattedEnumValue = getFormattedEnumValue;
  mobile = input<boolean>(false);
  loan = input<DetailedLoanCompoundSchema | undefined>();
  // Render only the top details table (no history/statements/transactions)
  onlyDetails = input<boolean>(false);
  // Optional heading shown above the details table (e.g., "Master Loan")
  detailsTitle = input<string | undefined>(undefined);
  histories = input<YearLoanHistoryOverviewSchema[]>([]);
  statements = input<LoanStatementBaseSchema[]>([]);
  payments = input<
    Array<{ date: string; amountCents: number; method: 'wired' | 'manual' }>
  >([]);

  isDemoMode = computed(() => {
    return this.organizationService.isFeatureFlagActivated('DEMO_MODE');
  });

  paymentColumns: TableColumnDefWithMeta<{
    date: string;
    amountCents: number;
    method: 'wired' | 'manual';
  }>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: info => String(info.getValue()),
      meta: { fractionSize: 1 },
    },
    {
      accessorKey: 'amountCents',
      header: 'Amount',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell: info => this.formatAmount(info.getValue() as any),
      meta: { fractionSize: 1 },
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: info => {
        const value = String(info.getValue());
        return value.charAt(0).toUpperCase() + value.slice(1);
      },
      meta: { fractionSize: 1 },
    },
  ];

  isLoanHistoryOpen = signal(false);
  isLoanStatementOpen = signal(false);
  isLoanDetailsOpen = signal(false);
  isPaymentTransactionsOpen = signal(false);

  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }

  shouldDisplayRateAdjustmentFrequency() {
    return (
      this.loan()?.interestRateAttributes.includes(
        InterestAttributes.VARIABLE
      ) ||
      this.loan()?.interestRateAttributes.includes(
        InterestAttributes.ADJUSTABLE
      )
    );
  }

  toggleLoanHistory() {
    this.isLoanStatementOpen.set(false);
    this.isLoanDetailsOpen.set(false);
    this.isPaymentTransactionsOpen.set(false);
    this.isLoanHistoryOpen.set(!this.isLoanHistoryOpen());
  }

  toggleLoanStatement() {
    this.isLoanHistoryOpen.set(false);
    this.isLoanDetailsOpen.set(false);
    this.isPaymentTransactionsOpen.set(false);
    this.isLoanStatementOpen.set(!this.isLoanStatementOpen());
  }

  toggleLoanDetails() {
    this.isLoanStatementOpen.set(false);
    this.isLoanHistoryOpen.set(false);
    this.isPaymentTransactionsOpen.set(false);
    this.isLoanDetailsOpen.set(!this.isLoanDetailsOpen());
  }

  togglePaymentTransactions() {
    this.isLoanStatementOpen.set(false);
    this.isLoanHistoryOpen.set(false);
    this.isLoanDetailsOpen.set(false);
    this.isPaymentTransactionsOpen.set(!this.isPaymentTransactionsOpen());
  }
}
