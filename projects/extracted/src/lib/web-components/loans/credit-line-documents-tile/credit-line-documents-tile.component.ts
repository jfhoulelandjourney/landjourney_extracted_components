import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

import { LendAttachmentService } from '../../../services/lending/lend-attachment.service';
import type { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';
import type { LendAttachment } from '../../../services/lending/models/lend.models';
import { LendTypes } from '../../../services/lending/models/lending.enums';

@Component({
  selector: 'lj-credit-line-documents-tile',
  templateUrl: './credit-line-documents-tile.component.html',
  styleUrls: ['./credit-line-documents-tile.component.scss'],
  imports: [MatIconModule, ActivateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditLineDocumentsTileComponent implements AfterViewInit {
  private router = inject(Router);
  private lendAttachmentService = inject(LendAttachmentService);

  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();
  isMobile = input(false);
  attachments = signal<LendAttachment[]>([]);

  ngAfterViewInit() {
    const creditLineId = this.creditLine()?.id;

    if (!creditLineId) {
      this.attachments.set([]);
      return;
    }

    this.lendAttachmentService
      .getAllAttachments(LendTypes.CREDIT_LINE, creditLineId)
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

  goToDocuments(attachmentId?: string) {
    if (this.isMobile()) {
      this.router.navigateByUrl(
        `/tabs/loans/credit/${this.creditLine()?.id}/documents${attachmentId ? `/${attachmentId}` : ''}`
      );
    } else {
      this.router.navigateByUrl(
        `/loans/credit/${this.creditLine()?.id}/documents${attachmentId ? `/${attachmentId}` : ''}`
      );
    }
  }
}
