
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { DocumentService } from '../../../services/documents/document.service';
import { DownloadService } from '../../../services/download.service';
import { CreditLineStatementBaseSchema } from '../../../services/lending/models/credit-lines.models';
import { LoanStatementBaseSchema } from '../../../services/lending/models/loans.models';
import { readableDateFromTimestamp, TimeUtil } from '../../../utils/timeUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-statements',
  templateUrl: './loan-statements.component.html',
  styleUrls: ['./loan-statements.component.scss'],
  imports: [ActivateDirective, MatIconModule],
})
export class LoanStatementsComponent implements AfterViewChecked {
  documentService = inject(DocumentService);
  downloadService = inject(DownloadService);

  downloading = signal<string[]>([]);

  selectedYear = signal<number | undefined>(undefined);
  statementYears = computed(() => {
    const statements = this.statements();

    const years = new Set<number>();

    for (const statement of statements) {
      if (!statement.dateEmitted) {
        continue;
      }

      const date = TimeUtil.convertSecondTimestampToDate(statement.dateEmitted);
      years.add(date.getFullYear());
    }

    return Array.from(years.values());
  });

  filteredStatements = computed(() => {
    const year = this.selectedYear();

    if (!year) {
      return [];
    }

    return this.statements()
      .sort((a, b) => {
        return a.dateEmitted - b.dateEmitted;
      })
      .filter(s => {
        const date = TimeUtil.convertSecondTimestampToDate(s.dateEmitted);
        return s.statementDocumentId && s.digest && date.getFullYear() === year;
      })
      .map(s => ({
        ...s,
        formattedDate: readableDateFromTimestamp(s.dateEmitted),
      }));
  });

  formatDate = readableDateFromTimestamp;
  mobile = input<boolean>(false);
  statements = input<
    (LoanStatementBaseSchema | CreditLineStatementBaseSchema)[]
  >([]);
  show = signal(6);
  more = computed(() => {
    const nb = this.filteredStatements().length - this.show();
    return nb > 0 ? nb : 0;
  });

  handleSeeMoreClicked() {
    this.show.set(this.show() + 6);
  }

  changeSelectedYear(year: number) {
    this.selectedYear.set(year);
    this.show.set(6);
  }

  getFilteredStatements() {
    return this.filteredStatements().slice(0, this.show());
  }

  ngAfterViewChecked() {
    const years = this.statementYears();

    if (!this.selectedYear() && years.length > 0) {
      this.selectedYear.set(Math.max(...years));
    }
  }

  addDownloadingId(id: string) {
    this.downloading.set([...this.downloading(), id]);
  }

  removeDownloadingId(id: string) {
    this.downloading.set(
      (this.downloading() as string[]).filter(_ => _ !== id)
    );
  }

  handleDownloadClicked(
    statement: LoanStatementBaseSchema | CreditLineStatementBaseSchema
  ) {
    if (!statement.statementDocumentId || !statement.digest) {
      return;
    }

    if (this.downloading().includes(statement.id)) {
      return;
    }

    this.addDownloadingId(statement.id);

    this.documentService
      .downloadFile(statement.statementDocumentId, statement.digest)
      .subscribe({
        next: response => {
          this.downloadService
            .downloadFileWithSubscription(response.url, `${statement.id}.pdf`)
            .subscribe({
              next: _ => {
                this.removeDownloadingId(statement.id);
              },
              error: _ => {
                this.removeDownloadingId(statement.id);
              },
            });
        },
        error: _ => {
          this.removeDownloadingId(statement.id);
        },
      });
  }

  dateHasMoreThanOneStatement(
    statement: (LoanStatementBaseSchema | CreditLineStatementBaseSchema) & {
      formattedDate: string;
    }
  ): boolean {
    const statementsInSameDate = this.filteredStatements().filter(
      s => s.formattedDate === statement.formattedDate
    );
    return statementsInSameDate.length > 1;
  }

  getStatementNumber(
    statement: (LoanStatementBaseSchema | CreditLineStatementBaseSchema) & {
      formattedDate: string;
    }
  ): number {
    const statementsInSameDate = this.filteredStatements().filter(
      s => s.formattedDate === statement.formattedDate
    );
    return statementsInSameDate.findIndex(s => s.id === statement.id) + 1;
  }
}
