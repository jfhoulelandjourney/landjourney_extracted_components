import { Injectable, OnDestroy, inject } from '@angular/core';
import { forkJoin, map, of, Subject, switchMap, takeUntil } from 'rxjs';

import { Discussion, UserComment } from '../../models/discussionModel';
import { isUserInternal, type RequestUser } from '../../models/requestModels';
import type { Message } from '../../types/messages';
import { ApiService, ServiceConfiguration } from '../api/api.service';
import { OrganizationService } from '../organization/organization.service';
import {
  RealtimeActions,
  RealtimeMessage,
  RealtimeMessagingService,
  WatchedEntities,
} from '../realtimeMessaging/realtime-messaging.service';
import {
  AddCommentToDiscussionInput,
  CreateDiscussionWithCommentsInput,
  DiscussionQueryParams,
  UpdateCommentInput,
} from './discussion.schemas';

@Injectable({
  providedIn: 'root',
})
export class DiscussionService implements OnDestroy {
  private apiService = inject(ApiService);
  private organizationService = inject(OrganizationService);
  private realTimeService = inject(RealtimeMessagingService);

  private readonly serviceConfiguration: ServiceConfiguration;

  private destroy$ = new Subject<void>();

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Discussion;
  }

  initializeRealtimeSubscription(
    id: string,
    callbackAction: (message: RealtimeMessage) => void
  ) {
    this.realTimeService.connect();
    this.sendWatchMessage(id);
    this.realTimeService.messages.pipe(takeUntil(this.destroy$)).subscribe({
      next: message => {
        if (
          message.entity === WatchedEntities.DISCUSSION &&
          message.action === RealtimeActions.REFRESH
        ) {
          callbackAction(message);
        }
      },
    });
  }

  sendWatchMessage(id: string) {
    this.realTimeService.sendMessage({
      action: RealtimeActions.WATCH,
      entity: WatchedEntities.DISCUSSION,
      watched_resource_id: id,
    });
  }

  sendUnwatchMessage(id: string) {
    this.realTimeService.sendMessage({
      action: RealtimeActions.UNWATCH,
      entity: WatchedEntities.DISCUSSION,
      watched_resource_id: id,
    });
  }

  sendRefreshMessage(id: string) {
    this.realTimeService.sendMessage({
      action: RealtimeActions.REFRESH,
      entity: WatchedEntities.DISCUSSION,
      watched_resource_id: id,
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  public getDiscussion(id: string, requestDigest?: string) {
    const queryParams = {
      ...(requestDigest && { entity_digest: requestDigest }),
    };
    return this.apiService.get<Discussion>(
      this.serviceConfiguration,
      `/discussions/${id}`,
      queryParams
    );
  }

  public getDiscussionByTargetEntity(input: DiscussionQueryParams) {
    const metadata = input.metadata || {};
    const params = {
      ...metadata,
      ...(input.sinceTimestamp && { since_timestamp: input.sinceTimestamp }),
      target_entity_id: input.targetEntityId,
      target_entity_type: input.targetEntityType,
      ...(input.entityDigest && { entity_digest: input.entityDigest }),
    };

    return this.apiService
      .head(this.serviceConfiguration, `/discussions`, params)
      .pipe(
        switchMap(isValid => {
          if (isValid) {
            return this.apiService
              .get<Discussion>(
                this.serviceConfiguration,
                `/discussions`,
                params
              )
              .pipe(
                switchMap(discussion => {
                  const users = discussion.participants.users;
                  return this.organizationService
                    .getUsersFromIdsAndDigest(
                      users,
                      discussion.usersDigest ?? ''
                    )
                    .pipe(
                      map(usersData => {
                        return { discussion, usersData };
                      })
                    );
                })
              );
          } else {
            return of(null);
          }
        })
      );
  }

  public updateComment(input: UpdateCommentInput) {
    return this.apiService.put<UserComment>(
      this.serviceConfiguration,
      `/discussions/${input.discussionId}/comments/${input.id}`,
      input
    );
  }

  public createDiscussionWithComments(
    input: CreateDiscussionWithCommentsInput
  ) {
    return this.apiService.post<Discussion>(
      this.serviceConfiguration,
      `/discussions`,
      input
    );
  }

  public addCommentToDiscussion(input: AddCommentToDiscussionInput) {
    return this.apiService.post<Discussion>(
      this.serviceConfiguration,
      `/discussions/${input.discussionId}/comments`,
      input
    );
  }

  public deleteComment(discussionId: string, commentId: string) {
    return this.apiService.delete(
      this.serviceConfiguration,
      `/discussions/${discussionId}/comments/${commentId}`
    );
  }

  public getDiscussionOverview(
    targetEntities: {
      target_entity_id: string;
      target_entity_type: string;
      entity_digest: string;
    }[]
  ) {
    return this.apiService
      .get<Discussion[]>(
        this.serviceConfiguration,
        `/discussions/comments/overview`,
        {
          target_entities: btoa(JSON.stringify(targetEntities)),
          comment_count: 1,
        }
      )
      .pipe(
        switchMap((discussions: Discussion[]) => {
          if (discussions.length === 0) {
            return of(null);
          }

          const usersRequests = discussions.map(discussion => ({
            users: discussion.participants.users,
            usersDigest: discussion.usersDigest,
          }));
          const userRequests$ = usersRequests.map(request =>
            this.organizationService.getUsersFromIdsAndDigest(
              request.users,
              request.usersDigest ?? ''
            )
          );

          return forkJoin(userRequests$).pipe(
            map(usersDataArray => {
              const usersData = usersDataArray.flat();
              return { discussions, usersData };
            })
          );
        })
      );
  }

  public getDiscussionByTargetEntities(
    targetEntities: {
      targetEntityId: string;
      targetEntityType: string;
      entityDigest: string;
    }[]
  ) {
    if (targetEntities.length === 0) {
      return of(null);
    }

    return this.apiService
      .post<Discussion[]>(
        this.serviceConfiguration,
        `/discussions/comments/batch`,
        {
          targetEntities: targetEntities,
        }
      )
      .pipe(
        switchMap((discussions: Discussion[]) => {
          if (discussions.length === 0) {
            return of(null);
          }

          const usersRequests$ = discussions.map(discussion =>
            this.organizationService.getUsersFromIdsAndDigest(
              discussion.participants.users,
              discussion.usersDigest ?? ''
            )
          );

          return forkJoin(usersRequests$).pipe(
            map(usersDataArray => {
              const usersData = usersDataArray.flat();
              return { discussions, usersData };
            })
          );
        })
      );
  }

  public sendCollaboratorEmailInvite(
    collaboratorUserId: string,
    collaboratorName: string,
    collaboratorEmail: string,
    currentUserName: string,
    tenantName: string,
    targetEntityPath: string,
    targetEntityId?: string
  ) {
    const payload = {
      url: this.determineUrl(targetEntityPath, targetEntityId),
      methods: ['EMAIL'],
      sendNow: true,
      extra: {
        message: `Hi ${collaboratorName}, ${currentUserName} is giving you access to select information on their account on the ${tenantName} portal. Click the link below to login and get started. You can login using this email address (${collaboratorEmail}).`,
        subject: `${currentUserName} is inviting you to their ${tenantName} account.`,
      },
    };

    return this.apiService.post(this.serviceConfiguration, `/notifications`, {
      workflowName: 'simple-message',
      recipients: [collaboratorUserId],
      payload,
      overrides: {}, // we will want to fill that in in the future
    });
  }

  public sendMessageToRequestUsers(
    users: RequestUser[],
    message: Message,
    requestId: string
  ) {
    const templatePayload = {
      url: '',
      methods: ['EMAIL'],
      sendNow: true,
      extra: {
        message: message.body,
        subject: message.subject ?? 'New message from your request',
      },
    };

    const internalUsers = users.filter(u => isUserInternal(u));
    const customerUsers = users.filter(u => !isUserInternal(u));

    const response = [];

    if (customerUsers.length > 0) {
      const payload = structuredClone(templatePayload);
      payload.url = this.determinePlaceholderUrl('requests', requestId, false);
      response.push(
        this.apiService.post(this.serviceConfiguration, `/notifications`, {
          workflowName: 'simple-message',
          recipients: users.map(user => user.userId),
          payload,
          overrides: {},
          requestId: requestId,
        })
      );
    }

    if (internalUsers.length > 0) {
      const payload = structuredClone(templatePayload);
      payload.url = this.determinePlaceholderUrl('requests', requestId, true);
      response.push(
        this.apiService.post(this.serviceConfiguration, `/notifications`, {
          workflowName: 'simple-message',
          recipients: users.map(user => user.userId),
          payload,
          overrides: {},
          requestId: requestId,
        })
      );
    }

    if (response.length === 0) {
      return of([]);
    }

    return forkJoin(response);
  }

  public determinePlaceholderUrl(
    targetEntityPath: string,
    targetEntityId?: string,
    backoffice = false
  ): string {
    const placeholder = backoffice ? '{{BACKOFFICE_URL}}' : '{{CLIENT_URL}}';

    return targetEntityId
      ? `${placeholder}/${targetEntityPath}/${targetEntityId}`
      : `${placeholder}/${targetEntityPath}`;
  }

  public determineUrl(
    targetEntityPath: string,
    targetEntityId?: string
  ): string {
    const rootPath =
      this.organizationService.uiConfiguration.webappFQDN ||
      window.location.hostname.replace('mobile', 'app');

    return targetEntityId
      ? `https://${rootPath}/${targetEntityPath}/${targetEntityId}`
      : `https://${rootPath}/${targetEntityPath}`;
  }

  public sendTestEmail() {
    return this.apiService.post(this.serviceConfiguration, `/notifications`, {
      workflowName: 'client-new-request',
      recipients: ['a9f10217-0f7b-45a9-9623-d9753be751bf'],
      payload: {
        url: 'https://app-test.landjourney.ai/authTokenLogin',
        methods: ['EMAIL'],
        sendNow: true,
        extra: {
          message:
            'This is a message from the request or template that is set by the loan agent when setting up notifications for clients',
          requestType: 'Land loan',
          actor: {
            name: 'Cathleen',
            avatarUrl:
              'https://lh3.googleusercontent.com/a/ACg8ocJzPX11cH0FlHHK8MhF6AZ2BFEpE_FLsIwpZDrIcx5f-sANUA=s96-c',
            initials: 'CG',
          },
        },
      },
      overrides: {},
    });
  }
}
