import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterModule } from '@angular/router';
import { AvatarComponent } from '../../../../design-system';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import { SystemGroups } from '../../../../models/authModels';
import { UserComment } from '../../../../models/discussionModel';
import { RequestUser } from '../../../../models/requestModels';
import { UserProfile } from '../../../../models/userModels';
import { DateAgoPipe } from '../../../../pipes/date-ago/date-ago.pipe';
import { CreateDiscussionWithCommentsInput } from '../../../../services/discussions/discussion.schemas';
import { DiscussionService } from '../../../../services/discussions/discussion.service';
import { IAMService } from '../../../../services/identity/iam.service';
import { UiNotificationService } from '../../../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../../../services/organization/organization.service';
import { getProfileFromRequestUser } from '../../../../utils/entityUtil';
import { PermissionUtil } from '../../../../utils/permissionUtil';
import { formatDate } from '../../../../utils/timeUtil';
import { LjButtonComponent } from '../../../button/button.component';
import { CommentAction, CommentEvent } from '../../messaging-helper';
import { CommentQuillEditorComponent } from '../quill-editor/comment-quill-editor.component';

@Component({
  standalone: true,
  selector: 'lj-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    ActivateDirective,
    CommentQuillEditorComponent,
    DateAgoPipe,
    AvatarComponent,
    LjButtonComponent,
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CommentComponent implements OnInit, AfterViewInit {
  private iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);
  private uiNotification = inject(UiNotificationService);
  private discussionService = inject(DiscussionService);
  private router = inject(Router);

  isMobile = input<boolean>(false);
  isDirty = signal<boolean>(false);
  userComment = input.required<UserComment>();
  users = input<RequestUser[]>([]);
  isChild = input(false);
  messageText = signal<string>('');
  messageDate = signal<string | null>(null);
  targetName = input<string | undefined>(undefined);
  enableEmployeeSearch = input<boolean>(false);
  activeUser = signal<UserProfile | null>(this.iamService.getActiveUser());
  participants = signal<string[]>([]);
  author = computed(() => this.userComment().name);
  avatar = computed(() => this.userComment().avatar);

  wasCreatedByActiveUser = computed(() => {
    const activeUser = this.activeUser();
    return (
      Boolean(activeUser) &&
      this.organizationService.getOrganizationUserId() ===
        this.userComment().createdBy
    );
  });
  wasDeleted = computed(() => Boolean(this.userComment().deletedAt));

  readonly discussionCreated = output<void>();
  readonly triggerReload = output<CommentEvent>();
  readonly clearInputEvent = output<string>();

  editorComponent = viewChild(CommentQuillEditorComponent);

  isCustomer = computed(() => {
    return PermissionUtil.isInSomeGroup(
      this.iamService.getUserGroups(
        this.organizationService.getOrganizationId()
      ),
      [SystemGroups.CUSTOMERS]
    );
  });

  isFeatureFlagActivated(featureFlagName: string) {
    return this.organizationService.isFeatureFlagActivated(featureFlagName);
  }

  handleIsDirtyChange() {
    this.saveComment();
  }

  focusTextarea() {
    if (this.wasCreatedByActiveUser()) {
      this.editorComponent()?.focusOnInput();
    }
  }

  ngAfterViewInit() {
    if (!this.userComment().id) {
      this.focusTextarea();
    }
  }

  ngOnInit() {
    if (!this.userComment().id) {
      this.isDirty.set(true);
    }
  }

  clearInput() {
    const commentUser = this.userComment();
    if (commentUser.id) {
      this.isDirty.set(false);
      if (this.editorComponent()) {
        this.editorComponent()?.setText(commentUser.message);
      }
      return;
    }
    this.clearInputEvent.emit(this.userComment().componentInternalId);
  }

  getCommentDate(): number | undefined {
    const userComment = this.userComment();
    return userComment.updatedAt ?? userComment.createdAt;
  }

  saveComment() {
    const comment = this.userComment();
    const message = this.messageText();
    const isAuthorized = PermissionUtil.isInSomeGroup(
      this.iamService.getUserGroups(
        this.organizationService.getOrganizationId()
      ),
      [SystemGroups.LOAN_OFFICER, SystemGroups.ORGANIZATION_OWNER]
    );

    // If there is a comment id and discussion id
    // means the object already exists, and we need to update it
    if (
      comment.id &&
      message &&
      comment.discussionId &&
      (comment.targetEntityDigest || isAuthorized)
    ) {
      this.updateComment(comment, message);
      return;
    }

    // when there is no comment id (new input is loaded, and id is unknown at this moment)
    // but there is a discussion id
    // means the discussion exists, and we need to add a comment to it
    if (
      !comment.id &&
      comment.discussionId &&
      message &&
      (comment.targetEntityDigest || isAuthorized)
    ) {
      this.addComment(comment, message, isAuthorized);
      return;
    }

    // no comment id and no discussion id means this is the first comment
    // and there is no discussion
    this.createDiscussionWithComment(comment, message, isAuthorized);
  }

  private updateComment(comment: UserComment, message: string | null) {
    if (comment.id && comment.id !== '' && message) {
      this.discussionService
        .updateComment({
          id: comment.id,
          discussionId: comment.discussionId ?? '',
          message,
          metadata: comment.metadata,
          participants: {
            users: this.participants(),
            workgroups: [],
          },
        })
        .subscribe({
          next: _data => {
            this.uiNotification.showSnackbar(
              'Comment successfully updated',
              'green'
            );
            this.messageDate.set(formatDate(new Date(), 'short'));
            this.isDirty.set(false);
            this.triggerReload.emit({
              action: CommentAction.UPDATE,
              id: this.userComment().id,
              sinceTimestamp: comment.createdAt,
              userId: comment.createdBy,
              targetEntityId: comment.targetEntityId,
              targetEntityType: comment.targetEntityType,
              message: this.messageText(),
              participants: this.participants(),
            });
          },
          error: _error => {
            // Already handled
          },
        });
    }
  }

  private createDiscussionWithComment(
    comment: UserComment,
    message: string | null,
    isAuthorized?: boolean
  ) {
    if (message && (comment.targetEntityDigest || isAuthorized)) {
      const targetEntityType = comment.targetEntityType;
      const targetEntityId = comment.targetEntityId;
      const entityDigest = comment.targetEntityDigest ?? '';
      const createDiscussionInput: CreateDiscussionWithCommentsInput = {
        targetEntityId,
        targetEntityType,
        entityDigest,
        metadata: {},
        comments: [
          {
            message,
            metadata: comment.metadata,
          },
        ],
        participants: {
          users: this.participants(),
          workgroups: [],
        },
      };
      this.discussionService
        .createDiscussionWithComments(createDiscussionInput)
        .subscribe({
          next: () => {
            this.uiNotification.showSnackbar(
              'Comment successfully created',
              'green'
            );
            this.messageDate.set(formatDate(new Date(), 'short'));
            this.isDirty.set(false);
            this.triggerReload.emit({
              action: CommentAction.CREATE,
              componentInternalId: this.userComment().componentInternalId,
              userId: comment.createdBy,
              targetEntityId: comment.targetEntityId,
              targetEntityType: comment.targetEntityType,
              message: this.messageText(),
              participants: this.participants(),
            });
          },
          error: _error => {
            this.uiNotification.showSnackbar('Failed to create comment', 'red');
          },
        });
    }
  }

  private addComment(
    comment: UserComment,
    message: string | null,
    isAuthorized?: boolean
  ) {
    if (message) {
      const entityDigest = comment.targetEntityDigest ?? '';

      if (!entityDigest && !isAuthorized) {
        this.uiNotification.showSnackbar(
          'Failed to add comment: not authorized',
          'red'
        );
        return;
      }

      this.discussionService
        .addCommentToDiscussion({
          entityDigest,
          discussionId: comment.discussionId,
          comment: {
            message,
            metadata: comment.metadata,
          },
          participants: {
            users: this.participants(),
            workgroups: [],
          },
        })
        .subscribe({
          next: _message => {
            this.uiNotification.showSnackbar(
              'Comment successfully added',
              'green'
            );
            this.messageDate.set(formatDate(new Date(), 'short'));
            this.isDirty.set(false);
            this.triggerReload.emit({
              action: CommentAction.ADD,
              componentInternalId: comment.componentInternalId,
              sinceTimestamp: comment.createdAt,
              userId: comment.createdBy,
              targetEntityId: comment.targetEntityId,
              targetEntityType: comment.targetEntityType,
              message: this.messageText(),
              participants: this.participants(),
            });
          },
          error: _error => {
            // Already handled
          },
        });
    }
  }

  deleteComment() {
    const comment = this.userComment();
    if (comment.id && this.wasCreatedByActiveUser()) {
      this.discussionService
        .deleteComment(comment.discussionId, comment.id)
        .subscribe({
          next: _message => {
            this.uiNotification.showSnackbar(
              'Comment successfully deleted',
              'green'
            );
            this.triggerReload.emit({
              action: CommentAction.DELETE,
              id: comment.id,
              sinceTimestamp: comment.createdAt,
              userId: comment.createdBy,
              targetEntityId: comment.targetEntityId,
              targetEntityType: comment.targetEntityType,
              message: this.messageText(),
              participants: this.participants(),
            });
            this.isDirty.set(false);
          },
          error: _error => {
            this.uiNotification.showSnackbar('Failed to delete comment', 'red');
          },
        });
      return;
    }

    this.uiNotification.showSnackbar(
      'You are not allowed to delete this comment',
      'red'
    );
  }

  getThreadTitle() {
    const comment = this.userComment();
    if (comment.taskName === 'DEFAULT_TASK_FOR_SIMPLE_MODE') {
      return comment.sectionName;
    }
    return comment.taskName ?? comment.sectionName;
  }

  getThreadAssignee() {
    const assignee = this.users().find(
      user => user.userId === this.userComment().assigneeId
    );

    if (assignee) {
      return getProfileFromRequestUser(assignee);
    }

    return undefined;
  }

  getThreadAssigneeTooltip() {
    return (
      'Task assigned to: ' +
      this.getThreadAssignee()?.firstName +
      ' ' +
      this.getThreadAssignee()?.lastName
    );
  }

  getTaskLink() {
    const c = this.userComment();
    if (!c.requestId || !c.sectionId) {
      return [];
    }

    let base = '';

    if (this.isMobile()) {
      base = '/tabs/requests/' + c.requestId;
    } else {
      base = '/requests/' + c.requestId;
    }

    if (this.isCustomer()) {
      return [base, 'sections', c.sectionId];
    }

    if (c.taskId) {
      return [base, 'section', c.sectionId, 'task', c.taskId];
    }
    return [base, 'section', c.sectionId];
  }

  shouldShowViewTaskButton() {
    const link = this.getTaskLink();
    if (link.length === 0) {
      return false;
    }

    const urlTree = this.router.createUrlTree(link);
    return !this.router.isActive(urlTree, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }
}
