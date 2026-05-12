import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
  signal,
  SimpleChanges,
} from '@angular/core';

import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Subject } from 'rxjs';
import { AvatarComponent } from '../../../design-system';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  TargetEntity,
  TargetEntityType,
  UserComment,
} from '../../../models/discussionModel';
import { RequestUser } from '../../../models/requestModels';
import { BasicUserProfile } from '../../../models/userModels';
import { DateAgoPipe } from '../../../pipes/date-ago/date-ago.pipe';
import { ClientRequest } from '../../../services/client/requests/client-requests.service';
import { DiscussionService } from '../../../services/discussions/discussion.service';
import { getTargetEntityId, sortByLastActivity } from '../messaging-helper';
import {
  RequestMessagingComponent,
  type RequestType,
} from '../request-messaging/request-messaging.component';

@Component({
  selector: 'lj-messaging',
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.scss'],
  imports: [
    ActivateDirective,
    RequestMessagingComponent,
    NgxSkeletonLoaderModule,
    AvatarComponent,
    DateAgoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MessagingComponent implements AfterViewInit, OnDestroy, OnChanges {
  private readonly discussionService = inject(DiscussionService);
  private destroy$ = new Subject<void>();

  users = input<RequestUser[]>([]);
  isMobile = input<boolean>(false);
  forceReload = input<boolean>(false);
  readonly onMessageClicked = output<{
    requestId: string;
    selectedEntityTargetId: string;
    selectedEntityTargetType: TargetEntityType;
  }>();

  targetEntitiesIdsAndDigests = input.required<TargetEntity[]>();

  isLoading = signal<boolean>(true);
  userCommentList = signal<UserComment[]>([]);

  selectedTargetEntityId = signal<string | undefined>(undefined);
  selectedTargetEntityType = signal<TargetEntityType | undefined>(undefined);
  discussionId = signal<string | undefined>(undefined);
  requests = input.required<ClientRequest[]>();

  ngAfterViewInit() {
    this.reloadLastComments();
    this.targetEntitiesIdsAndDigests().forEach(targetEntity => {
      this.discussionService.initializeRealtimeSubscription(
        targetEntity.requestId,
        this.onRefreshCommentsEvents.bind(this)
      );
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      !changes.forceReload?.firstChange &&
      changes.forceReload?.previousValue !== changes.forceReload?.currentValue
    ) {
      this.reloadLastComments();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.targetEntitiesIdsAndDigests().forEach(targetEntity => {
      this.discussionService.sendUnwatchMessage(targetEntity.requestId);
    });
  }

  onRefreshCommentsEvents() {
    this.reloadLastComments();
  }

  private reloadLastComments() {
    const targetEntities = this.targetEntitiesIdsAndDigests().map(r => ({
      target_entity_id: getTargetEntityId(r),
      target_entity_type: r.type,
      entity_digest: r.digest ?? '',
    }));

    // Add REQUEST-type entities for each unique request
    const uniqueRequestIds = new Set(
      this.targetEntitiesIdsAndDigests().map(r => r.requestId)
    );
    const requestEntities = Array.from(uniqueRequestIds).map(requestId => {
      const request = this.requests().find(r => r.id === requestId);
      return {
        target_entity_id: requestId,
        target_entity_type: TargetEntityType.REQUEST,
        entity_digest: request?.requestDigest ?? '',
      };
    });

    const allTargetEntities = [...targetEntities, ...requestEntities];

    this.discussionService.getDiscussionOverview(allTargetEntities).subscribe({
      next: data => {
        if (data) {
          const commentsMap = new Map<string, UserComment>();
          const usersMap = new Map<string, BasicUserProfile>(
            data.usersData.map(user => [user.id ?? '', user])
          );

          for (const discussion of data.discussions) {
            const comment = discussion.comments[0];

            if (comment) {
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
                componentInternalId: comment.componentInternalId,
                requestId: comment.requestId,
                sectionId: comment.sectionId,
                taskId: comment.taskId,
                requestName: comment.requestName,
                sectionName: comment.sectionName,
                taskName: comment.taskName,
                assigneeId: comment.assigneeId,
              } satisfies UserComment;

              commentsMap.set(
                userComment.id ?? userComment.componentInternalId,
                userComment
              );
            }
          }
          this.userCommentList.set(
            sortByLastActivity(Array.from(commentsMap.values()))
          );
          this.isLoading.set(false);
        } else {
          this.isLoading.set(false);
        }
      },
    });
  }

  getCommentDate(comment: UserComment): number | undefined {
    return comment.updatedAt ?? comment.createdAt;
  }

  handleDiscussionSelected(
    targetEntityId: string,
    targetEntityType: TargetEntityType,
    discussionId: string
  ) {
    if (!this.isMobile()) {
      this.selectedTargetEntityId.set(undefined);
      setTimeout(() => {
        this.selectedTargetEntityId.set(targetEntityId);
        this.selectedTargetEntityType.set(targetEntityType);
        this.discussionId.set(discussionId);
      }, 50);
    } else {
      this.onMessageClicked.emit({
        requestId: this.getRequestForDiscussionId(discussionId)?.id ?? '',
        selectedEntityTargetId: targetEntityId,
        selectedEntityTargetType: targetEntityType,
      });
    }
  }

  getTargetEntityForDiscussionId(discussionId: string): string | undefined {
    return this.userCommentList().find(
      discussion => discussion.discussionId === discussionId
    )?.targetEntityId;
  }

  getRequestForDiscussionId(discussionId: string): RequestType | undefined {
    const comment = this.userCommentList().find(
      discussion => discussion.discussionId === discussionId
    );

    if (!comment) {
      return undefined;
    }

    if (
      comment.targetEntityType.toLocaleLowerCase() ===
      TargetEntityType.REQUEST.toLocaleLowerCase()
    ) {
      const request = this.requests().find(
        request => request.id === comment.targetEntityId
      );
      if (request) {
        return request;
      }
    }

    if (
      comment.targetEntityType.toLocaleLowerCase() ===
      TargetEntityType.SECTION.toLocaleLowerCase()
    ) {
      const request = this.requests().find(request => {
        return request.sections?.find(
          section => section.id === comment.targetEntityId
        );
      });

      if (request) {
        return request;
      }
    }

    if (
      comment.targetEntityType.toLocaleLowerCase() ===
      TargetEntityType.TASK.toLocaleLowerCase()
    ) {
      const request = this.requests().find(request => {
        const section = request.sections?.find(section =>
          section.tasks.find(task => task.id === comment.targetEntityId)
        );

        if (section) {
          return request;
        }

        return undefined;
      });
      if (request) {
        return request;
      }
    }

    return undefined;
  }
}
