import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Preference, PreferenceLevel } from '@novu/js';
import { Subject } from 'rxjs';
import { DigestFrequenciesEnum } from '../../../models/userModels';
import { IAMService } from '../../../services/identity/iam.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { CollapsiblePanelComponent } from '../../containers/collapsible-panel/collapsible-panel.component';
import { LjSelectFieldComponent } from '../../form/select-field/select-field.component';

const DISPLAYED_WORKFLOW_BACKOFFICE: string[] = [
  // 'in-app-notifications',
  // 'request-ready-for-review',
  // 'agent-new-comment-request',
  'agent-tasks-completed',
  // 'simple-message',
];
const DISPLAYED_WORKFLOW_CLIENT_APPS: string[] = [
  // 'agent-new-comment-request',
  // 'client-needs-revision',
  // 'simple-message',
];

@Component({
  selector: 'lj-communication-preferences',
  imports: [
    MatSlideToggleModule,
    CollapsiblePanelComponent,
    LjSelectFieldComponent,
    FormsModule,
  ],
  templateUrl: './communication-preferences.component.html',
  styleUrl: './communication-preferences.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunicationPreferencesComponent implements OnInit, OnDestroy {
  private readonly iamService = inject(IAMService);
  private readonly organizationService = inject(OrganizationService);
  private readonly notificationSevice = inject(NotificationService);
  private readonly uiNotification = inject(UiNotificationService);

  backoffice = input(false);
  mobile = input(false);

  globalSms = signal(true);
  globalEmail = signal(true);
  globalInApp = signal(true);

  preferences = signal<Preference[]>([]);

  displayedPreferences = computed(() => {
    const preferences: Preference[] = [];
    const displayedWorkflows = this.backoffice()
      ? DISPLAYED_WORKFLOW_BACKOFFICE
      : DISPLAYED_WORKFLOW_CLIENT_APPS;

    for (const preference of this.preferences()) {
      if (
        preference.level === PreferenceLevel.TEMPLATE &&
        displayedWorkflows.includes(preference.workflow?.identifier ?? '')
      ) {
        preferences.push(preference);
      }
    }

    return preferences;
  });

  loading = signal(true);
  error = signal(true);
  destroy$ = new Subject<void>();

  digestOptions = [
    {
      label: 'Instant',
      description: 'The notification will be delivered as soon as received',
      value: DigestFrequenciesEnum.NO_DIGEST,
    },
    // {
    //   label: 'Every 30 minutes',
    //   description:
    //     'The notifications will be delivered in the same email every 30 minutes (48 times / day)',
    //   value: DigestFrequenciesEnum.DIGEST_30_MINUTE,
    // },
    {
      label: 'Every 60 minutes',
      description:
        'The notifications will be delivered in the same email every 60 minutes (24 times / day)',
      value: DigestFrequenciesEnum.DIGEST_60_MINUTES,
    },
    // {
    //   label: 'Every 4 hours',
    //   description:
    //     'The notifications will be delivered in the same email every 4 hours (6 times / day)',
    //   value: DigestFrequenciesEnum.DIGEST_4_HOURS,
    // },
    // {
    //   label: 'Every 8 hours',
    //   description:
    //     'The notifications will be delivered in the same email every 8 hours (3 times / day)',
    //   value: DigestFrequenciesEnum.DIGEST_8_HOURS,
    // },
    // {
    //   label: 'Every day at 8h00 (Eastern Time)',
    //   description:
    //     'The notifications will be delivered in the same email every day at 8h00 (Eastern Time)',
    //   value: DigestFrequenciesEnum.DIGEST_DAILY,
    // },
    // {
    //   label: 'Every Monday morning at 8h00 (Eastern Time)',
    //   description:
    //     'The notifications will be delivered in the same email every Monday morning at 8h00 (Eastern Time)',
    //   value: DigestFrequenciesEnum.DIGEST_DAILY,
    // },
  ];

  // LIFECYCLE

  ngOnInit() {
    if (
      this.organizationService.getOrganizationUserId() &&
      this.organizationService.getOrganizationUserDigest()
    ) {
      this.notificationSevice.initializeNovu(
        this.organizationService.getOrganizationUserId(),
        this.organizationService.getOrganizationUserDigest()
      );

      this.notificationSevice.getUserPreferences()?.then(value => {
        if ('originalError' in value) {
          this.loading.set(false);
          this.error.set(true);
          return;
        }

        this.preferences.set((value.data ?? []) as Preference[]);
        this.setGlobalPreferences();
        this.loading.set(false);
      });
    }
  }

  setGlobalPreferences() {
    for (const preference of this.preferences()) {
      if (preference.level === PreferenceLevel.GLOBAL) {
        this.globalEmail.set(preference.channels.email ?? false);
        this.globalSms.set(preference.channels.sms ?? false);
        this.globalInApp.set(preference.channels.in_app ?? false);
      }
    }
  }

  saveGlobalPreferences() {
    this.preferences.set(
      this.preferences().map(p => {
        if (p.level === PreferenceLevel.GLOBAL) {
          p.channels.email = this.globalEmail();
          p.channels.sms = this.globalSms();
          p.channels.in_app = this.globalInApp();

          this.notificationSevice
            .updateUserGlobalCommunicationPreferences({
              channels: p.channels,
              preference: p,
            })
            ?.then(() => {
              this.showNotificationSavedMessage();
            });
        }

        return p;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.notificationSevice.destroyNovu();
  }

  // UI INTERACTIONS

  getHumanName(workflow: string | undefined): string {
    switch (workflow) {
      case 'in-app-notifications':
        return 'Change list within the application';
      case 'agent-new-comment-request':
        return 'A new comment has been added on a request';
      case 'client-needs-revision':
        return 'Provided information (file, form) needs revision';
      case 'request-ready-for-review':
        return 'A request is ready to be reviewed';
      case 'agent-tasks-completed':
        return 'A task has been completed by a client';
      case 'simple-message':
        return 'Other messages';
    }

    return 'Unknown workflow';
  }

  getDigestPreferenceForWorkflow(
    preference: Preference
  ): DigestFrequenciesEnum {
    const activeUser = this.iamService.getActiveUser();

    if (
      activeUser &&
      activeUser.preferences &&
      preference.workflow?.identifier &&
      activeUser.preferences.digestFrequencies[preference.workflow.identifier]
    ) {
      return activeUser.preferences.digestFrequencies[
        preference.workflow.identifier
      ] as DigestFrequenciesEnum;
    }

    return DigestFrequenciesEnum.NO_DIGEST;
  }

  handleDigestPreferenceChange(
    preference: Preference,
    frequency: DigestFrequenciesEnum
  ) {
    const activeUser = this.iamService.getActiveUser();

    if (
      !activeUser ||
      !activeUser.preferences ||
      !preference.workflow?.identifier
    ) {
      return;
    }

    if (
      activeUser.preferences.digestFrequencies[
        preference.workflow.identifier
      ] === frequency
    ) {
      return;
    }

    activeUser.preferences.digestFrequencies[preference.workflow.identifier] =
      frequency;

    this.iamService
      .updateOwnProfile({
        preferences: activeUser.preferences,
      })
      .subscribe({
        next: _ => {
          this.iamService.setActiveUser(activeUser);
          this.showNotificationSavedMessage();
        },
      });
  }

  showNotificationSavedMessage() {
    this.uiNotification.showSnackbar('Communication preference saved', 'green');
  }

  handleEmailChange() {
    this.globalEmail.set(!this.globalEmail());
    this.saveGlobalPreferences();
  }

  handleSmsChange() {
    this.globalSms.set(!this.globalSms());
    this.saveGlobalPreferences();
  }

  handleInAppChange() {
    this.globalInApp.set(!this.globalInApp());
    this.saveGlobalPreferences();
  }

  handleChannelPreferenceChange(
    preference: Preference,
    channel: 'email' | 'sms' | 'in_app' | 'push' | 'chat'
  ) {
    switch (channel) {
      case 'email':
        preference.channels.email = !preference.channels.email;
        break;
      case 'sms':
        preference.channels.sms = !preference.channels.sms;
        break;
      case 'in_app':
        preference.channels.in_app = !preference.channels.in_app;
        break;
      case 'push':
        preference.channels.push = !preference.channels.push;
        break;
      case 'chat':
        preference.channels.chat = !preference.channels.chat;
        break;
    }

    this.preferences.set(
      this.preferences().map(p => {
        if (p.workflow === preference.workflow) {
          return preference;
        }

        return p;
      })
    );

    this.notificationSevice
      .updateUserCommunicationPreferences({
        workflowId: preference.workflow?.id ?? '',
        channels: preference.channels,
      })
      ?.then(() => {
        this.showNotificationSavedMessage();
      });
  }

  isDigestActivated() {
    return this.organizationService.isFeatureFlagActivated(
      'COMMUNICATION_PREFERENCES'
    );
  }
}
