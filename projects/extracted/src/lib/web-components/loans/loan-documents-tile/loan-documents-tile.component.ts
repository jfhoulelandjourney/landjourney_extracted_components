import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

import { LendAttachmentService } from '../../../services/lending/lend-attachment.service';
import type { LendAttachment } from '../../../services/lending/models/lend.models';
import { LendTypes } from '../../../services/lending/models/lending.enums';
import type { DetailedLoanCompoundSchema } from '../../../services/lending/models/loans.models';

@Component({
  selector: 'lj-loan-documents-tile',
  templateUrl: './loan-documents-tile.component.html',
  styleUrls: ['./loan-documents-tile.component.scss'],
  imports: [MatIconModule, ActivateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanDocumentsTileComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private lendAttachmentService = inject(LendAttachmentService);
  private destroy$ = new Subject<void>();

  loan = input<DetailedLoanCompoundSchema | undefined>();
  isMobile = input(false);
  attachments = signal<LendAttachment[]>([]);

  ngAfterViewInit() {
    const loanId = this.loan()?.id;

    if (!loanId) {
      this.attachments.set([]);
      return;
    }

    this.lendAttachmentService
      .getAllAttachments(LendTypes.LOAN, loanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.attachments.set(
            response.slice(
              Math.max(response.length - (this.isMobile() ? 2 : 3), 0)
            )
          );
        },
        error: error => {
          console.error(error);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToDocuments(attachmentId?: string) {
    if (this.isMobile()) {
      this.router.navigateByUrl(
        `/tabs/loans/loan/${this.loan()?.id}/documents${attachmentId ? `/${attachmentId}` : ''}`
      );
    } else {
      this.router.navigateByUrl(
        `/loans/loan/${this.loan()?.id}/documents${attachmentId ? `/${attachmentId}` : ''}`
      );
    }
  }
}
