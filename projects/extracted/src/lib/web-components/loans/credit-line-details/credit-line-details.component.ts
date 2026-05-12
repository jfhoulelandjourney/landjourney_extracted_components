
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
import {
  CreditLineStatementBaseSchema,
  DetailedCreditLineCompoundSchema,
  isMainlineCreditLine,
  isStandaloneCreditLine,
  YearCreditLineHistoryOverviewSchema,
} from '../../../services/lending/models/credit-lines.models';
import {
  LendingAccountStatuses as AccountStatuses,
  CreditLineTypes,
  InterestAttributes,
} from '../../../services/lending/models/lending.enums';
import { OrganizationService } from '../../../services/organization/organization.service';
import {
  formatAmountFromCents,
  formatPercent,
} from '../../../utils/numberUtil';
import {
  formatEnumValue,
  getFormattedEnumValue,
} from '../../../utils/stringUtil';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';
import { TableColumnDefWithMeta } from '../../data-table/data-table.model';
import { CreditLineHistoryComponent } from '../credit-line-history/credit-line-history.component';
import { LoanStatementsComponent } from '../loan-statements/loan-statements.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-details',
  templateUrl: './credit-line-details.component.html',
  styleUrls: ['./credit-line-details.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    CreditLineHistoryComponent,
    LoanStatementsComponent,
    MatExpansionModule
],
})
export class CreditLineDetailsComponent {
  AccountStatuses = AccountStatuses;
  private organizationService = inject(OrganizationService);
  formatDate = readableDateFromTimestamp;
  formatPercent = formatPercent;
  getFormattedEnumValue = getFormattedEnumValue;
  mobile = input<boolean>(false);
  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();
  histories = input<YearCreditLineHistoryOverviewSchema[]>([]);
  statements = input<CreditLineStatementBaseSchema[]>([]);
  payments = input<
    Array<{ date: string; amountCents: number; method: 'wired' | 'manual' }>
  >([]);

  isCreditLineHistoryOpen = signal(false);
  isCreditLineStatementOpen = signal(false);
  isCreditLineDetailsOpen = signal(false);
  isPaymentTransactionsOpen = signal(false);

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

  isMainlineCreditLine = isMainlineCreditLine;
  isStandaloneCreditLine = isStandaloneCreditLine;

  hasSublines = computed(() => {
    const _creditLine = this.creditLine();
    return (
      !this.isStandaloneCreditLine(_creditLine) &&
      (_creditLine?.sublines?.length ?? 0) > 0
    );
  });

  sublineNames = computed(() => {
    const _creditLine = this.creditLine();
    if (this.isStandaloneCreditLine(_creditLine) || !_creditLine?.sublines) {
      return [];
    }
    return _creditLine.sublines.map(
      subline => subline.name ?? 'Unnamed Subline'
    );
  });

  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }

  getLongNameForCreditLineType(type: CreditLineTypes | undefined): string {
    if (!type) {
      return 'Unknown Type of Credit Line';
    }

    switch (type) {
      case CreditLineTypes.RLOC:
        return 'Revolving Line of Credit';
      case CreditLineTypes.NLOC:
        return 'Non-Revolving Line of Credit';
      case CreditLineTypes.UNKNOWN:
        return 'Unknown Type of Credit Line';
      case CreditLineTypes.NLOC_FIXED_TO_VAR_SINGLE_PAYMENT:
        return 'Non-Revolving Line of Credit (Fixed to Variable, Single Payment)';
      case CreditLineTypes.NLOC_FIXED_TO_VAR_MULTIPLE_PAYMENTS:
        return 'Non-Revolving Line of Credit (Fixed to Variable, Multiple Payments)';
      case CreditLineTypes.NLOC_MASTERLINE:
        return 'Non-Revolving Line of Credit (Masterline)';
      default:
        return formatEnumValue(type);
    }
  }

  shouldDisplayRateAdjustmentFrequency() {
    const creditLine = this.creditLine();

    if (!creditLine) {
      return false;
    }

    if (creditLine.sublines && creditLine.sublines.length > 0) {
      return false;
    }

    const interestRateAttributes = creditLine.interestRateAttributes;

    if (!interestRateAttributes) {
      return false;
    }

    return (
      interestRateAttributes.includes(InterestAttributes.VARIABLE) ||
      interestRateAttributes.includes(InterestAttributes.ADJUSTABLE)
    );
  }

  toggleCreditLineHistory() {
    this.isCreditLineStatementOpen.set(false);
    this.isCreditLineDetailsOpen.set(false);
    this.isPaymentTransactionsOpen.set(false);
    this.isCreditLineHistoryOpen.set(!this.isCreditLineHistoryOpen());
  }

  toggleCreditLineStatement() {
    this.isCreditLineHistoryOpen.set(false);
    this.isCreditLineDetailsOpen.set(false);
    this.isPaymentTransactionsOpen.set(false);
    this.isCreditLineStatementOpen.set(!this.isCreditLineStatementOpen());
  }

  toggleCreditLineDetails() {
    this.isCreditLineHistoryOpen.set(false);
    this.isCreditLineStatementOpen.set(false);
    this.isPaymentTransactionsOpen.set(false);
    this.isCreditLineDetailsOpen.set(!this.isCreditLineDetailsOpen());
  }

  togglePaymentTransactions() {
    this.isCreditLineHistoryOpen.set(false);
    this.isCreditLineStatementOpen.set(false);
    this.isCreditLineDetailsOpen.set(false);
    this.isPaymentTransactionsOpen.set(!this.isPaymentTransactionsOpen());
  }

  showPaymentTransactions() {
    let usedCreditCents = 0;
    const line = this.creditLine();
    if (!line) return false;

    // If credit line has sublines, sum their usage
    if (line.sublines && line.sublines.length > 0) {
      usedCreditCents = line.sublines.reduce(
        (total, subline) => total + (subline.usageCents ?? 0),
        0
      );
    } else {
      // Otherwise use the credit line's usage
      usedCreditCents = line.usageCents ?? 0;
    }

    // if nothing is used, let's assume the credit line is brand new aka no transactions have been made
    return usedCreditCents > 0;
  }
}
