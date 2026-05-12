import {
  ChannelPreference,
  ListNotificationsResponse,
  Novu,
  NovuError,
  Preference,
} from '@novu/js';

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { PostAdHocNotificationSchema } from './notifications.models';

type Result<D = undefined, E = NovuError> = Promise<{
  data?: D;
  error?: E;
}>;

const REFRESH_INTERVAL_IN_SECOND = 30;
const PAGE_SIZE = 5;
export const EMPTY_NOTIFICATIONS = {
  notifications: [],
  hasMore: false,
  filter: {},
};

type BasePreferenceArgs = {
  workflowId: string;
  channels: ChannelPreference;
};
type InstancePreferenceArgs = {
  preference: Preference;
  channels: ChannelPreference;
};

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiService = inject(ApiService);
  private environmentService = inject(EnvironmentService);

  private novuInstance: Novu | null;
  private notificationRefresh: Subscription | undefined;

  private readonly allNotificationsSubject =
    new BehaviorSubject<ListNotificationsResponse>(EMPTY_NOTIFICATIONS);
  readonly allNotifications$ = this.allNotificationsSubject.asObservable();
  private allNumberOfPage = 1;

  private readonly readNotificationsSubject =
    new BehaviorSubject<ListNotificationsResponse>(EMPTY_NOTIFICATIONS);
  readonly readNotifications$ = this.readNotificationsSubject.asObservable();
  private readNumberOfPage = 1;

  private readonly unreadNotificationsSubject =
    new BehaviorSubject<ListNotificationsResponse>(EMPTY_NOTIFICATIONS);
  readonly unreadNotifications$ =
    this.unreadNotificationsSubject.asObservable();
  private unreadNumberOfPage = 1;

  private readonly allNotificationCountSubject = new BehaviorSubject<number>(0);
  readonly allNotificationCount$ =
    this.allNotificationCountSubject.asObservable();

  private readonly unreadNotificationCountSubject = new BehaviorSubject<number>(
    0
  );
  readonly unreadNotificationCount$ =
    this.unreadNotificationCountSubject.asObservable();

  private readonly serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Discussion;
    this.novuInstance = null;
  }

  // NOVU

  initializeNovu(subscriberId: string, subscriberHash: string) {
    if (this.novuInstance) {
      return;
    }

    this.novuInstance = new Novu({
      subscriberId: subscriberId,
      applicationIdentifier:
        this.environmentService.getNovuApplicationIdentifier(),
      subscriberHash: subscriberHash,
    });

    this.checkNotifications();
    this.notificationRefresh = interval(
      REFRESH_INTERVAL_IN_SECOND * 1000
    ).subscribe(() => this.checkNotifications());
  }

  destroyNovu() {
    this.novuInstance = null;

    if (this.notificationRefresh) {
      this.notificationRefresh.unsubscribe();
    }
  }

  checkNotifications() {
    if (!this.novuInstance) {
      this.allNotificationsSubject.next(EMPTY_NOTIFICATIONS);
    }

    this.novuInstance?.notifications
      .list({ limit: PAGE_SIZE * this.allNumberOfPage })
      .then(response => {
        this.allNotificationsSubject.next(response.data ?? EMPTY_NOTIFICATIONS);
      });

    this.novuInstance?.notifications
      .list({ limit: PAGE_SIZE * this.readNumberOfPage, read: true })
      .then(response => {
        this.readNotificationsSubject.next(
          response.data ?? EMPTY_NOTIFICATIONS
        );
      });

    this.novuInstance?.notifications
      .list({ limit: PAGE_SIZE * this.unreadNumberOfPage, read: false })
      .then(response => {
        this.unreadNotificationsSubject.next(
          response.data ?? EMPTY_NOTIFICATIONS
        );
      });

    this.novuInstance?.notifications.count().then(value => {
      this.allNotificationCountSubject.next(value.data?.count ?? 0);
    });

    this.novuInstance?.notifications.count({ read: false }).then(value => {
      this.unreadNotificationCountSubject.next(value.data?.count ?? 0);
    });
  }

  loadMore(filter: 'ALL' | 'READ' | 'UNREAD') {
    if (!this.novuInstance) {
      return;
    }

    switch (filter) {
      case 'ALL':
        this.allNumberOfPage += 1;
        break;
      case 'READ':
        this.readNumberOfPage += 1;
        break;
      case 'UNREAD':
        this.unreadNumberOfPage += 1;
        break;
    }

    this.checkNotifications();
  }

  // EMAIL / SMS NOTIFICATIONS

  public sendAdHocNotification(payload: PostAdHocNotificationSchema) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/notifications`,
      payload
    );
  }

  // PREFERENCES

  getUserProfile() {
    if (!this.novuInstance) {
      return undefined;
    }

    return null;
  }

  public getUserPreferences(): undefined | Result<Preference[] | NovuError> {
    if (!this.novuInstance) {
      return undefined;
    }

    return this.novuInstance.preferences.list();
  }

  public updateUserCommunicationPreferences(
    args: BasePreferenceArgs
  ): undefined | Result<Preference> {
    if (!this.novuInstance) {
      return undefined;
    }

    return this.novuInstance.preferences.update(args);
  }

  public updateUserGlobalCommunicationPreferences(
    args: InstancePreferenceArgs
  ): undefined | Result<Preference> {
    if (!this.novuInstance) {
      return undefined;
    }

    return this.novuInstance.preferences.update(args);
  }
}
