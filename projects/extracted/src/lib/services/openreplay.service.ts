import { Injectable, NgZone, inject } from '@angular/core';

import Tracker from '@openreplay/tracker';
import trackerAssist from '@openreplay/tracker-assist';
import type { RequestResponseData } from '@openreplay/tracker/lib/modules/network';
import { ApiService } from './api/api.service';
import { CookieConsentService } from './cookie-consent/cookie-consent.service';
import { EnvironmentService } from './environment/environment.service';
import { AuthMessages, IAMService } from './identity/iam.service';
import { OrganizationService } from './organization/organization.service';

@Injectable({
  providedIn: 'root',
})
export class OpenReplayService {
  private zone = inject(NgZone);
  private iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);
  private apiService = inject(ApiService);
  private environmentService = inject(EnvironmentService);
  private cookieConsentService = inject(CookieConsentService);

  public tracker: Tracker | null = null;
  private projectKey = 'tIEiaB9KjMGwrjWDH9CQ';

  constructor() {
    const isLocal = this.environmentService.isLocal();

    if (!isLocal) {
      // @ts-expect-error extending window
      globalThis.openReplay = {
        start: this.start.bind(this),
        stop: this.stop.bind(this),
      };
      return this;
    }

    this.iamService.authServiceMessages.subscribe({
      next: message => {
        if (message === AuthMessages.TOKEN_REFRESH) {
          this.start();
        } else {
          this.stop();
        }
      },
      error: () => {
        this.stop();
      },
    });
  }

  private sanitizeNetworkLog(data: RequestResponseData) {
    if (data.url.includes('/login/') || data.url.includes('/password-reset/')) {
      return null;
    }

    if (data.status > 200 && data.status < 400) {
      return null;
    }

    return data;
  }

  private setUserMetadata(
    userId: string,
    organizationId: string,
    email: string
  ) {
    this.zone.runOutsideAngular(() => {
      if (this.tracker) {
        this.tracker.setUserID(userId);
        this.tracker.setMetadata('userId', userId);
        this.tracker.setMetadata('organizationId', organizationId);
        this.tracker.setMetadata('email', email);
        this.tracker.setMetadata(
          'environment',
          this.apiService.getEnvironmentName()
        );
        this.tracker.setMetadata('sessionId', this.apiService.getSessionId());
      }
    });
  }

  private setTrackerIfRequired() {
    if (!this.tracker) {
      this.zone.runOutsideAngular(() => {
        this.tracker = new Tracker({
          projectKey: this.projectKey,
          __DISABLE_SECURE_MODE: true,
          network: {
            failuresOnly: true,
            ignoreHeaders: true,
            capturePayload: true,
            captureInIframes: false,
            sessionTokenHeader: false,
            sanitizer: data => {
              return this.sanitizeNetworkLog(data);
            },
          },
        });

        this.tracker.use(
          trackerAssist({
            confirmText: `You have an incoming call from a support specialist. Do you want to answer?`,
          })
        );
      });
    }
  }

  public setProjectKey(key: string) {
    this.projectKey = key;
  }

  public async start() {
    if (
      this.organizationService.isFeatureFlagActivated(
        'COOKIE_CONSENT_BANNER'
      ) &&
      this.cookieConsentService.getConsent() === 'rejected'
    ) {
      return Promise.resolve({
        sessionID: null,
        sessionToken: null,
        userUUID: null,
      });
    }

    this.setTrackerIfRequired();

    return this.zone.runOutsideAngular(() => {
      const currentUser = this.iamService.getActiveUser();
      const email = currentUser?.email;
      const currentUserId = currentUser?.id;

      if (this.tracker && currentUserId) {
        this.setUserMetadata(
          currentUserId,
          this.organizationService.getOrganizationId(),
          email ?? 'UNKNOWN'
        );
        return this.tracker.start();
      } else {
        return Promise.resolve({
          sessionID: null,
          sessionToken: null,
          userUUID: null,
        });
      }
    });
  }

  public async stop() {
    return this.zone.runOutsideAngular(() => {
      if (this.tracker) {
        this.tracker.stop();
        this.tracker = null;
        return Promise.resolve({
          sessionID: null,
          sessionToken: null,
          userUUID: null,
        });
      }
      return Promise.resolve({
        sessionID: null,
        sessionToken: null,
        userUUID: null,
      });
    });
  }
}
