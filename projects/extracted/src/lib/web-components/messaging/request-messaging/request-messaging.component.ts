import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
  signal,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Subject, takeUntil } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  CommentGroup,
  extractTargetEntitiesFromRequest,
  TargetEntity,
  TargetEntityType,
  UserComment,
} from '../../../models/discussionModel';
import { Request } from '../../../models/requestModels';
import { Section } from '../../../models/sectionModels';
import { BasicUserProfile, UserProfile } from '../../../models/userModels';
import { ClientRequest } from '../../../services/client/requests/client-requests.service';
import { DiscussionService } from '../../../services/discussions/discussion.service';
import { IAMService } from '../../../services/identity/iam.service';
import { AdHocNotificationService } from '../../../services/notifications/adhocnotification.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { getUUID4 } from '../../../utils/stringUtil';
import { TimeUtil } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';
import {
  CommentAction,
  CommentEvent,
  flattenComments,
  getTargetEntityId,
  sortComments,
} from '../messaging-helper';
import { CommentComponent } from './comment/comment.component';

export type RequestType = (Request | null) | (ClientRequest | undefined);

@Component({
  selector: 'lj-request-messaging',
  templateUrl: './request-messaging.component.html',
  styleUrls: ['./request-messaging.component.scss'],
  imports: [
    MatDividerModule,
    MatIconModule,
    CommentComponent,
    ActivateDirective,
    LjButtonComponent,
    NgxSkeletonLoaderModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RequestMessagingComponent
  implements AfterViewInit, OnDestroy, AfterViewChecked, OnChanges
{
  private iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);
  private discussionService = inject(DiscussionService);
  private route = inject(ActivatedRoute);
  private adHocNotificationsService = inject(AdHocNotificationService);

  request = input<RequestType>();
  sections = input<Section[]>([]);
  discussionId = signal<string | undefined>(undefined);
  requestId = computed(() => this.request()?.id ?? '');
  requestUsers = computed(() => this.request()?.users ?? []);
  selectedEntityTargetId = input<string | undefined>('');
  selectedEntityTargetType = input<TargetEntityType | undefined>(undefined);
  readonly entityTargetList = computed(() => {
    return extractTargetEntitiesFromRequest(
      this.request(),
      this.sections(),
      this.selectedEntityTargetId(),
      this.selectedEntityTargetType(),
      this.internal()
    );
  });
  readonly targetName = computed(
    () => this.request()?.name ?? 'Loan Application'
  );

  showMessagesOnly = input<boolean>(false);
  isMobile = input<boolean>(false);
  title = input<string | undefined>(undefined);
  subtitle = input<string | undefined>(undefined);
  enableEmployeeSearch = input<boolean>(false);
  internal = input<boolean>(false);
  icon = input<string>('chat_bubble_outline');

  displayTitle = computed(() => {
    const inputTitle = this.title();
    return inputTitle === undefined
      ? 'Customers Chat'
      : inputTitle.toUpperCase();
  });

  commentGroups = signal<CommentGroup[]>([]);

  activeUser = signal<UserProfile | null>(this.iamService.getActiveUser());

  newMessagesCounter = computed(() => {
    const count = flattenComments(this.commentGroups()).length;
    return count > 0 ? `${count}` : '+';
  });

  isCollapsed = signal<boolean>(true);
  isLoading = signal<boolean>(true);

  readonly onCommentChange = output();

  private readonly commentsListContainer = viewChild('commentsListContainer', {
    read: ElementRef<HTMLDivElement>,
  });

  private destroy$ = new Subject<void>();
  private lastLoadedRequestId: string | undefined;
  private lastLoadedSectionsDigest: string | undefined;

  constructor() {
    toObservable(this.requestId).pipe(takeUntil(this.destroy$)).subscribe({});
  }

  private getSectionsDigest(): string {
    const sections = this.sections() ?? [];
    return sections.map(s => s.id).sort().join(',');
  }

  ngOnChanges(changes: SimpleChanges) {
    const currentRequestId = this.request()?.id;
    const currentSectionsDigest = this.getSectionsDigest();

    // Handle target entity changes (but not the first change)
    const hasSelectedEntityTargetIdChanged =
      !changes['selectedEntityTargetId']?.firstChange &&
      changes['selectedEntityTargetId']?.previousValue !==
        changes['selectedEntityTargetId']?.currentValue;

    // Handle request ID change - only reload if the request ID actually changed
    const hasRequestIdChanged = currentRequestId && currentRequestId !== this.lastLoadedRequestId;

    // Handle sections changes - only if the sections digest actually changed
    const hasSectionsChanged =
      changes['sections'] &&
      currentSectionsDigest !== this.lastLoadedSectionsDigest;

    if (hasSelectedEntityTargetIdChanged || hasSectionsChanged || hasRequestIdChanged) {
      this.lastLoadedRequestId = currentRequestId;
      this.lastLoadedSectionsDigest = currentSectionsDigest;
      this.commentGroups.set([]);
      this.reloadComments();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.discussionService.sendUnwatchMessage(this.requestId());
  }

  ngAfterViewInit() {
    this.discussionService.initializeRealtimeSubscription(
      this.requestId(),
      this.onRefreshCommentsEvents.bind(this)
    );
  }

  private reloadComments(
    excludeInternalIds: string[] = [],
    sinceTimestamp?: number
  ) {
    const options = { excludeInternalIds, sinceTimestamp };
    this.loadComments(this.entityTargetList(), options);
  }

  private loadComments(
    targetEntityList: TargetEntity[],
    options: { excludeInternalIds?: string[]; sinceTimestamp?: number } = {}
  ) {
    if (targetEntityList.length === 0) {
      return;
    }

    const targetEntities = targetEntityList.map(entity => ({
      targetEntityId: getTargetEntityId(entity),
      targetEntityType: entity.type,
      entityDigest: entity.digest ?? '',
    }));

    this.discussionService
      .getDiscussionByTargetEntities(targetEntities)
      .subscribe({
        next: data => {
          if (data) {
            const flatList: UserComment[] = flattenComments(
              this.commentGroups()
            );
            const commentsMap = new Map<string, UserComment>(
              flatList.map(comment => [
                comment.id ?? comment.componentInternalId,
                comment,
              ])
            );
            const usersMap = new Map<string, BasicUserProfile>(
              data.usersData.map(user => [user.id ?? '', user])
            );
            if (options.excludeInternalIds) {
              for (const internalId of options.excludeInternalIds) {
                commentsMap.delete(internalId);
              }
            }
            const targetEntity = this.getSelectedEntityTarget();
            if (targetEntity) {
              const discussion = data.discussions.find(
                item => item.targetEntityId === getTargetEntityId(targetEntity)
              );
              if (discussion) {
                this.discussionId.set(discussion.id);
              }
            }
            for (const discussion of data.discussions) {
              const discussionTargetEntity = this.entityTargetList().find(
                item => getTargetEntityId(item) === discussion.targetEntityId
              );

              let taskId = discussionTargetEntity?.taskId;
              let taskName = discussionTargetEntity?.taskName;

              if (!taskId && discussionTargetEntity?.sectionId) {
                const section = this.sections().find(
                  s => s.id === discussionTargetEntity.sectionId
                );
                if (section) {
                  const defaultTask = section.tasks.find(
                    t => t.name === 'DEFAULT_TASK_FOR_SIMPLE_MODE'
                  );
                  if (defaultTask) {
                    taskId = defaultTask.id;
                    taskName = defaultTask.name;
                  }
                }
              }

              for (const comment of discussion.comments) {
                const userComment = {
                  id: comment.id,
                  discussionId: comment.discussionId,
                  createdBy: comment.createdBy,
                  name: usersMap.get(comment.createdBy)
                    ? `${usersMap.get(comment.createdBy)?.firstName} ${usersMap.get(comment.createdBy)?.lastName}`
                    : 'User',
                  avatar: usersMap.get(comment.createdBy)?.avatarUri,
                  message: comment.message,
                  createdAt: comment.createdAt,
                  updatedAt: comment.updatedAt,
                  deletedAt: comment.deletedAt,
                  metadata: comment.metadata,
                  targetEntityType: discussion.targetEntityType,
                  targetEntityId: discussion.targetEntityId,
                  targetEntityDigest: discussionTargetEntity?.digest ?? '',
                  componentInternalId: comment.componentInternalId,
                  requestId: discussionTargetEntity?.requestId ?? '',
                  sectionId: discussionTargetEntity?.sectionId ?? '',
                  taskId: taskId,
                  requestName: discussionTargetEntity?.requestName ?? '',
                  sectionName: discussionTargetEntity?.sectionName ?? '',
                  taskName: taskName,
                  assigneeId: discussionTargetEntity?.assigneeId,
                } satisfies UserComment;

                commentsMap.set(
                  userComment.id ?? userComment.componentInternalId,
                  userComment
                );
              }
            }

            this.commentGroups.update(() => {
              const list = Array.from(commentsMap.values());
              return sortComments(list);
            });

            this.isLoading.set(false);
          } else {
            this.commentGroups.set([]);
            this.isLoading.set(false);
          }
        },
        error: () => {
          this.commentGroups.set([]);
          this.isLoading.set(false);
        },
      });
  }

  onNewComment(commentEvent: CommentEvent) {
    if (
      [CommentAction.ADD, CommentAction.CREATE].includes(commentEvent.action)
    ) {
      const users = this.requestUsers();
      let entity: Request | Section | undefined = undefined;
      if (
        commentEvent.targetEntityType.toLowerCase() ===
        TargetEntityType.SECTION.toLowerCase()
      ) {
        entity = this.sections().find(
          item => item.id === commentEvent.targetEntityId
        );
      } else if (
        commentEvent.targetEntityType.toLowerCase() ===
        TargetEntityType.TASK.toLowerCase()
      ) {
        for (const section of this.sections()) {
          const task = section.tasks.find(
            item => item.id === commentEvent.targetEntityId
          );
          if (task) {
            // @ts-expect-error sectionId is part of Task but typescript is no recognizing it
            const sectionId = task.sectionId;
            entity = this.sections().find(item => item.id === sectionId);
            break;
          }
        }
      }
      this.adHocNotificationsService.sendNotificationToLoanOfficers({
        message: commentEvent.message,
        users,
        requestName: this.targetName() ?? '',
      });
      if (entity) {
        this.adHocNotificationsService.sendNotificationToSectionParticipants({
          section: entity,
          users,
          message: commentEvent.message,
          requestName: this.targetName() ?? '',
          requestId: this.request()?.id ?? '',
          taggedUserIds: commentEvent.participants ?? [],
        });
      }

      if (
        [
          TargetEntityType.REQUEST.toLowerCase(),
          TargetEntityType.INTERNAL_SECTION_DISCUSSION.toLowerCase(),
          TargetEntityType.INTERNAL_REQUEST_DISCUSSION.toLowerCase(),
          TargetEntityType.INTERNAL_TASK_DISCUSSION.toLowerCase(),
        ].includes(commentEvent.targetEntityType.toLowerCase())
      ) {
        this.adHocNotificationsService.sendNotificationPayload({
          recipients: commentEvent.participants ?? [],
          requestName: this.targetName() ?? '',
          message: commentEvent.message,
          currentUserFirstName: this.activeUser()?.firstName ?? '',
          requestId: this.request()?.id ?? '',
        });
      }
    }

    if (this.onCommentChange) {
      this.onCommentChange.emit();
    }
    this.discussionService.sendRefreshMessage(this.requestId());

    this.reloadComments(
      commentEvent.componentInternalId
        ? [commentEvent.componentInternalId]
        : [],
      commentEvent.sinceTimestamp
    );
  }

  private removeComment(internalId: string) {
    this.commentGroups.update(commentGroup => {
      const flatList: UserComment[] = flattenComments(commentGroup);
      const filteredList = flatList.filter(
        comment => comment.componentInternalId !== internalId
      );
      return sortComments(filteredList);
    });
  }

  onRefreshCommentsEvents() {
    this.reloadComments();
  }

  onRemoveComment(internalId: string) {
    this.removeComment(internalId);
  }

  private getSelectedEntityTarget(): TargetEntity | undefined {
    return this.entityTargetList().find(entity => {
      return getTargetEntityId(entity) === this.selectedEntityTargetId();
    });
  }

  createUserComment(
    overrides: Partial<UserComment> = {},
    threadId?: string
  ): UserComment {
    let targetEntity = this.getSelectedEntityTarget();
    if (!targetEntity) {
      targetEntity = {
        type: overrides.targetEntityType ?? TargetEntityType.SECTION,
        digest: overrides.targetEntityDigest ?? '',
        requestId: overrides?.requestId ?? '',
        sectionId: overrides?.sectionId ?? '',
        taskId: overrides?.taskId,
        requestName: overrides?.requestName ?? '',
        sectionName: overrides?.sectionName ?? '',
        taskName: overrides?.taskName,
        assigneeId: overrides?.assigneeId,
      };
    }

    return {
      discussionId: this.discussionId() ?? '',
      targetEntityId: getTargetEntityId(targetEntity),
      targetEntityType: targetEntity.type,
      targetEntityDigest: targetEntity.digest,
      createdBy: this.organizationService.getOrganizationUserId(),
      name: this.activeUser()
        ? `${this.activeUser()?.firstName} ${this.activeUser()?.lastName}`
        : 'User',
      message: '',
      metadata: {
        ...(threadId && { threadId }),
      },
      componentInternalId: getUUID4(),
      createdAt: Math.round(TimeUtil.convertDateToSecondTimestamp(new Date())),
      requestId: targetEntity.requestId ?? '',
      sectionId: targetEntity.sectionId ?? '',
      taskId: targetEntity.taskId,
      requestName: targetEntity.requestName ?? '',
      sectionName: targetEntity.sectionName ?? '',
      taskName: targetEntity.taskName,
      assigneeId: targetEntity.assigneeId,
      avatar: this.activeUser()?.avatarUri,
      ...overrides,
    } satisfies UserComment;
  }

  loadCommentInput(parentComment?: UserComment) {
    const override = parentComment
      ? {
          discussionId: parentComment.discussionId,
          targetEntityId: parentComment.targetEntityId,
          targetEntityType: parentComment.targetEntityType,
          targetEntityDigest: parentComment.targetEntityDigest,
        }
      : {};
    const userComment = this.createUserComment(
      override,
      parentComment?.id ?? parentComment?.componentInternalId
    );
    this.commentGroups.update(commentGroup => {
      const flatList = flattenComments(commentGroup);
      return sortComments([...flatList, userComment]);
    });
    setTimeout(
      () =>
        this.scrollToBottom(userComment.id ?? userComment.componentInternalId),
      20
    );
  }

  toggleCollapse() {
    if (!this.showMessagesOnly()) {
      this.isCollapsed.update(collapsed => !collapsed);
    }
  }

  ngAfterViewChecked() {
    this.route.queryParams.subscribe(params => {
      if (params.comment_id) {
        setTimeout(() => this.scrollToBottom(params.comment_id), 50);
      }
    });
  }

  addToThread(parentComment: UserComment) {
    this.loadCommentInput(parentComment);
  }

  private scrollToBottom(commentId: string) {
    const container = this.commentsListContainer();
    if (container?.nativeElement) {
      const comment = container.nativeElement.querySelector(
        `#${CSS.escape(commentId)}`
      );
      if (comment) {
        comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}
