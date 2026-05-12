
import { Component, ChangeDetectionStrategy, computed, signal, input, OnDestroy, AfterViewInit, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  TargetEntity,
  TargetEntityType,
  extractTargetEntitiesFromRequest,
} from '../../../models/discussionModel';
import { Subject, takeUntil } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { DiscussionService } from '../../../services/discussions/discussion.service';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { ClientRequest } from '../../../services/client/requests/client-requests.service';
import { getTargetEntityId } from '../messaging-helper';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-message-counter',
  templateUrl: './message-counter.component.html',
  styleUrls: ['./message-counter.component.scss'],
  imports: [MatIconModule, ActivateDirective],
})
export class MessageCounterComponent implements OnDestroy, AfterViewInit {
  private discussionService = inject(DiscussionService);

  private destroy$ = new Subject<void>();

  request = input<ClientRequest>();
  requestId = computed(() => this.request()?.id ?? '');
  sections = computed(() => this.request()?.sections ?? []);
  selectedEntityTargetId = input<string | undefined>(undefined);
  selectedEntityTargetType = computed(() =>
    this.selectedEntityTargetId()
      ? TargetEntityType.SECTION
      : TargetEntityType.REQUEST
  );

  readonly onCounterClicked = output<void>();

  nbComments = signal<number>(0);

  newMessagesCounter = computed(() => {
    return this.nbComments() > 0 ? `${this.nbComments()}` : '+';
  });

  constructor() {
    toObservable(this.requestId).pipe(takeUntil(this.destroy$)).subscribe({});
  }

  ngAfterViewInit() {
    this.reloadComments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.discussionService.sendUnwatchMessage(this.requestId());
  }

  private reloadComments() {
    this.loadComments();
  }

  private loadComments() {
    const entities: TargetEntity[] = extractTargetEntitiesFromRequest(
      this.request(),
      this.sections(),
      this.selectedEntityTargetId(),
      this.selectedEntityTargetType()
    );
    const targetEntities = entities.map(item => ({
      targetEntityId: getTargetEntityId(item),
      targetEntityType: item.type as string,
      entityDigest: item.digest ?? '',
    }));

    this.discussionService
      .getDiscussionByTargetEntities(targetEntities)
      .subscribe({
        next: data => {
          if (data) {
            let sum = 0;
            for (const discussion of data.discussions) {
              sum += discussion.comments.length;
            }
            this.nbComments.set(sum);
          }
        },
        error: error => {
          console.error(error);
        },
      });
  }

  onChatBubbleClicked() {
    this.onCounterClicked.emit();
  }
}
