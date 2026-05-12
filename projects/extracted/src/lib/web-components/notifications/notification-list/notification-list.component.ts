import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ListNotificationsResponse, Notification } from '@novu/js';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Subject, takeUntil } from 'rxjs';
import { AvatarComponent } from '../../../design-system';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { OrganizationService } from '../../../services/organization/organization.service';
import { diffTime } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';

@Component({
  selector: 'lj-notification-list',
  imports: [
    ActivateDirective,
    AvatarComponent,
    LjButtonComponent,
    NgxSkeletonLoaderModule,
    MatIconModule,
  ],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListComponent implements OnDestroy {
  private router = inject(Router);
  private readonly organizationService = inject(OrganizationService);

  selectedTab = signal<'ALL' | 'READ' | 'UNREAD'>('ALL');

  allNotificationItems = signal<Notification[]>([]);
  unreadNotificationItems = signal<Notification[]>([]);
  readNotificationItems = signal<Notification[]>([]);
  allNotificationHasMore = signal<boolean>(false);
  unreadNotificationHasMore = signal<boolean>(false);
  readNotificationHasMore = signal<boolean>(false);

  loaded = input<boolean>(true);
  allNotifications = input.required<ListNotificationsResponse>();
  allNotificationCount = input.required<number>();
  unreadNotifications = input.required<ListNotificationsResponse>();
  unreadNotificationCount = input.required<number>();
  readNotifications = input.required<ListNotificationsResponse>();

  readonly notificationChange = output<Notification>();
  readonly moreNotification = output<'ALL' | 'READ' | 'UNREAD'>();

  destroy$ = new Subject<void>();

  constructor() {
    toObservable(this.allNotifications)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: value => {
          this.allNotificationItems.set(value.notifications);
          this.allNotificationHasMore.set(value.hasMore);
        },
        error: _error => {
          // Nothing to do
        },
      });

    toObservable(this.unreadNotifications)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: value => {
          this.unreadNotificationItems.set(value.notifications);
          this.unreadNotificationHasMore.set(value.hasMore);
        },
        error: _error => {
          // Nothing to do
        },
      });

    toObservable(this.readNotifications)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: value => {
          this.readNotificationItems.set(value.notifications);
          this.readNotificationHasMore.set(value.hasMore);
        },
        error: _error => {
          // Nothing to do
        },
      });
  }

  loadMore(filter: 'ALL' | 'READ' | 'UNREAD') {
    this.moreNotification.emit(filter);
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  getAvatarUrl(_notification: Notification): string {
    return '/assets/misc/system-avatar.svg';
  }

  getActorName(_notification: Notification): string {
    return 'System';
  }

  markNotificationAsRead(notification: Notification) {
    if (notification.isRead) {
      return;
    }

    notification.read().then(_ => {
      this.notificationChange.emit(notification);
    });
  }

  formatDate(date: string) {
    const parsedDate = Date.parse(date);
    const diff = diffTime(parsedDate, Date.now());
    const roundedValue = Math.round(diff.value);
    const s = roundedValue > 1 ? 's' : '';
    return `${roundedValue} ${diff.unit}${s} ago`;
  }

  redirectIfRequired(notification: Notification) {
    if (notification.redirect) {
      const url = notification.redirect.url;
      const lowerCaseUrl = url.toLowerCase();

      if (!url) {
        return;
      }

      if (url.startsWith('/')) {
        this.router.navigateByUrl(url);
      } else {
        const defaultNonExistString = '&&*&?*&&*?%?%$?%$?';

        let hostName: string | undefined;

        if (
          lowerCaseUrl.includes(
            this.organizationService.uiConfiguration.backofficeFQDN?.toLowerCase() ??
              defaultNonExistString
          )
        ) {
          hostName = this.organizationService.uiConfiguration.backofficeFQDN;
        }

        if (
          lowerCaseUrl.includes(
            this.organizationService.uiConfiguration.webappFQDN?.toLowerCase() ??
              defaultNonExistString
          )
        ) {
          hostName = this.organizationService.uiConfiguration.webappFQDN;
        }

        if (
          lowerCaseUrl.includes(
            this.organizationService.uiConfiguration.mobileappFQDN?.toLowerCase() ??
              defaultNonExistString
          )
        ) {
          hostName = this.organizationService.uiConfiguration.mobileappFQDN;
        }

        if (lowerCaseUrl.includes('landjourney.ai')) {
          hostName = window.location.hostname;
        }

        if (hostName) {
          const splittedParts = url.split(hostName).reverse();
          const redirectUrl = splittedParts.at(0);

          if (!redirectUrl) {
            return;
          }
          this.router.navigateByUrl(redirectUrl);
        } else {
          window.location.href = notification.redirect.url;
        }
      }
    }
  }
}
