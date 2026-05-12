import {
  ChangeDetectionStrategy,
  Component,
  input,
  AfterViewInit,
  inject,
  signal,
} from '@angular/core';
import { Request } from '../../../models/requestModels';
import { RequestAttachment } from '../../../models/requestAttachmentModels';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { Router } from '@angular/router';

@Component({
  selector: 'lj-request-documents-tile',
  templateUrl: './documents-tile.component.html',
  styleUrls: ['./documents-tile.component.scss'],
  imports: [MatIconModule, ActivateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsTileComponent implements AfterViewInit {
  private router = inject(Router);

  request = input<Request | undefined>();
  isMobile = input(false);
  attachments = signal<RequestAttachment[]>([]);

  ngAfterViewInit() {
    const attachments = this.request()?.attachments ?? [];
    this.attachments.set(
      attachments.slice(
        Math.max(attachments.length - (this.isMobile() ? 2 : 3), 0)
      )
    );
  }

  goToDocuments(documentId?: string) {
    if (this.isMobile()) {
      this.router.navigateByUrl(
        `/tabs/requests/${this.request()?.id}/documents${documentId ? `/${documentId}` : ''}`
      );
    } else {
      this.router.navigateByUrl(
        `/requests/${this.request()?.id}/documents${documentId ? `/${documentId}` : ''}`
      );
    }
  }
}
