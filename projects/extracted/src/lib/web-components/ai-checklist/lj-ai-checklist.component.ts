import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, OnChanges, signal, SimpleChanges, inject } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { finalize, timer } from 'rxjs';
import { ActivateDirective } from '../../directives/activate/activate.directive';
import { ChecklistOutput } from '../../models/documents/AiChatModel';
import { AttachmentTypes, Task } from '../../models/sectionModels';
import { DocumentQueryAiService } from '../../services/documents/document-query-ai.service';
import { LjChecklistTableComponent } from './checklist-table/lj-checklist-table.component';

@Component({
  selector: 'lj-ai-checklist',
  templateUrl: './lj-ai-checklist.component.html',
  styleUrls: ['./lj-ai-checklist.component.scss'],
  imports: [MatIconModule, ActivateDirective, LjChecklistTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LjAiChecklistComponent implements OnChanges {
  private queryAiService = inject(DocumentQueryAiService);

  task = input<Task | null>();
  currentDocumentName = input<string>();
  documentId = signal<string>('');
  isCollapsed = signal(true);
  checklist = signal<ChecklistOutput | undefined>(undefined);
  showChecklist = signal(false);
  isLoading = signal(true);

  ngOnChanges(changes: SimpleChanges) {
    if (changes.currentDocumentName || changes.task) {
      this.getChecklistOutput(this.task(), this.currentDocumentName());
    }
  }

  public getChecklistOutput(
    task: Task | null | undefined,
    documentName?: string
  ) {
    const taskId = task?.id;
    const digest = task?.taskDigest;
    const attachmentName = this.currentDocumentName() ?? '';
    const attachments = task?.attachments.filter(
      item => item.type === AttachmentTypes.FILE && item.name === attachmentName
    );
    if (attachments && attachments.length === 0) {
      this.showChecklist.set(false);
      return;
    }
    this.showChecklist.set(true);
    if (taskId && digest && documentName) {
      this.retryChecklistConfirmation(taskId, documentName, 0, Date.now());
    }
  }

  private retryChecklistConfirmation(
    taskId: string,
    documentName: string,
    attemptIndex: number,
    startTime: number
  ) {
    const maxDuration = 2 * 60 * 1000; // 5 minutes
    const elapsed = Date.now() - startTime;

    // Check if we've exceeded the 5-minute timeout
    if (elapsed >= maxDuration) {
      console.error('Timeout: Checklist not ready after 5 minutes');
      this.isLoading.set(false);
      return;
    }

    this.queryAiService
      .confirmChecklistByTarget(
        taskId,
        'TASK',
        this.currentDocumentName() ?? ''
      )
      .subscribe({
        next: resourceExists => {
          if (resourceExists === true) {
            this.fetchChecklist(taskId, documentName);
          } else {
            this.scheduleNextRetry(
              taskId,
              documentName,
              attemptIndex,
              startTime
            );
          }
        },
        error: error => {
          console.error(`Attempt ${attemptIndex + 1} failed:`, error);
          this.scheduleNextRetry(taskId, documentName, attemptIndex, startTime);
        },
      });
  }

  private scheduleNextRetry(
    taskId: string,
    documentName: string,
    attemptIndex: number,
    startTime: number
  ) {
    // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s max
    const delay = Math.min(1000 * Math.pow(3, attemptIndex), 16000);

    timer(delay).subscribe(() => {
      this.retryChecklistConfirmation(
        taskId,
        documentName,
        attemptIndex + 1,
        startTime
      );
    });
  }

  private fetchChecklist(taskId: string, documentName: string) {
    this.queryAiService
      .getChecklistByTarget(taskId, 'TASK', documentName)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: checklist => {
          this.checklist.set(checklist);
        },
        error: error => {
          console.error('Error loading checklist:', error);
        },
      });
  }

  toggleCollapse() {
    this.isCollapsed.set(!this.isCollapsed());
  }
}
