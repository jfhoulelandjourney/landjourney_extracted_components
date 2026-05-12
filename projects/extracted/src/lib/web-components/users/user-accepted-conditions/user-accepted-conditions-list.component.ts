import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Condition } from '../../../services/organization/conditions.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SafeHtmlPipe } from '../../../pipes/safe-html/safe-html.pipe';
import { AcceptConditionsComponent } from '../../conditions/accept-conditions/accept-conditions.component';
import {
  ConditionsReviewDialogComponent,
  ConditionsReviewDialogData,
} from '../../conditions/conditions-review-dialog/conditions-review-dialog.component';

@Component({
  selector: 'lj-user-accepted-conditions-list',
  imports: [
    ActivateDirective,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    SafeHtmlPipe,
    AcceptConditionsComponent,
  ],
  templateUrl: './user-accepted-conditions-list.component.html',
  styleUrl: './user-accepted-conditions-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAcceptedConditionsListComponent implements OnInit {
  private readonly organizationService = inject(OrganizationService);
  private readonly dialog = inject(MatDialog);
  private readonly deviceDetector = inject(DeviceDetectorService);

  mobile = input(false);

  loading = signal<boolean>(true);
  conditionsToReview = signal<Condition[]>([]);
  acceptedConditions = signal<Condition[]>([]);

  ngOnInit() {
    this.organizationService.getAllConditionsForUser().subscribe({
      next: conditions => {
        this.acceptedConditions.set(conditions);
        this.loading.set(false);
      },
      error: _ => {
        // Already handled
      },
    });
  }

  viewCondition(condition: Condition) {
    if (this.deviceDetector.isMobile()) {
      this.dialog.open(ConditionsReviewDialogComponent, {
        data: { condition } as ConditionsReviewDialogData,
      });
    } else {
      this.conditionsToReview.set([condition]);
    }
  }

  formatTitle(conditionTitle: string) {
    if (conditionTitle.trim() === '') {
      return 'Alas! A title lost to the winds of oblivion, forever shrouded in the mists of mystery and unknown to mankind for eternity.';
    }

    return conditionTitle;
  }

  closeCondition() {
    this.conditionsToReview.set([]);
  }
}
