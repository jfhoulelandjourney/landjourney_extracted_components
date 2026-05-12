import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { RequestAttachmentHistory } from '../../../models/requestAttachmentModels';
import type { SharedViewUserProfile } from '../../../models/userModels';
import type { LendAttachmentHistory } from '../../../services/lending/models/lend.models';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';
import { ChipComponent } from '../../chip/chip.component';
import { OrganizationService } from '../../../services/organization/organization.service';

@Component({
  selector: 'lj-document-audit-trail',
  imports: [MatIconModule, ChipComponent],
  templateUrl: './document-audit-trail.component.html',
  styleUrl: './document-audit-trail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentAuditTrailComponent {
  formatDate = readableDateFromTimestamp;
  private organizationService = inject(OrganizationService);

  mobile = input<boolean>(false);
  history = input.required<
    RequestAttachmentHistory[] | LendAttachmentHistory[]
  >();
  users = input.required<SharedViewUserProfile[]>();

  sortedHistory = computed(() => {
    return this.history().sort((a, b) => {
      return (b.timestamp ?? 0) - (a.timestamp ?? 0);
    });
  });

  getUserName(userId: string): string {
    if (userId === this.organizationService.getOrganizationUserId()) {
      return 'You';
    }

    for (const user of this.users()) {
      if (user.userId === userId) {
        return `${user.firstName} ${user.lastName}`;
      }
    }

    return 'SYSTEM';
  }

  getActionColorPrimary(action: string): string {
    switch (action) {
      case 'VIEWED':
        return '#155a03';
      case 'DOWNLOADED':
        return '#90784f';
      case 'CREATED':
        return '#2c4568';
      case 'SIGNED':
        return 'grey';
      case 'SIGNATURE_DELETED':
        return 'grey';
      default:
        return 'grey';
    }
  }

  getActionColorSecondary(action: string): string {
    switch (action) {
      case 'VIEWED':
        return '#daedd5';
      case 'DOWNLOADED':
        return '#f4f2e7';
      case 'CREATED':
        return '#d0dceb';
      case 'SIGNED':
        return 'grey';
      case 'SIGNATURE_DELETED':
        return 'grey';
      default:
        return 'grey';
    }
  }
}
