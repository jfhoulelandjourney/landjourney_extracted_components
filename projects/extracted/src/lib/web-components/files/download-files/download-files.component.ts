import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChipComponent } from '../../chip/chip.component';
import { MatIconModule } from '@angular/material/icon';
import { LjButtonComponent } from '../../button/button.component';
import {
  CreateExportJob,
  DownloadDocument,
  ExportJob,
} from '../../../models/documents/exportJobModel';
import { WorkflowService } from '../../../services/workflows-api/workflow.service';
import { catchError, map, mergeMap, of, retry, throwError, timer } from 'rxjs';
import { DocumentService } from '../../../services/documents/document.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { formatDate } from '../../../utils/timeUtil';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { FileTypes } from '../../../models/documents/fileModels';

@Component({
  selector: 'lj-download-files',
  imports: [
    LjButtonComponent,
    ChipComponent,
    MatIconModule,
    ActivateDirective,
    MatMenuModule,
  ],
  templateUrl: './download-files.component.html',
  styleUrls: ['./download-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadFilesComponent {
  requestId = input.required<string>();
  exportFileName = input.required<string>();
  documentsList = input.required<DownloadDocument[]>();
  documentsCount = input.required<number>();
  hideListDisplay = computed(() => this.documentsList().length > 0);
  expanded = signal<boolean>(false);
  downloadMenu = viewChild.required<MatMenuTrigger>('downloadMenuTrigger');
  protected readonly formatDate = formatDate;
  private workflowService = inject(WorkflowService);
  private documentService = inject(DocumentService);
  private uiNotification = inject(UiNotificationService);
  private http = inject(HttpClient);
  private delayTimeout = 500;

  readonly fileExportCompletedEvent = output<ExportJob>();

  downloadFiles() {
    const requestId = this.requestId();
    if (requestId) {
      const input: CreateExportJob = {
        filename: this.exportFileName(),
        requestId,
        includeAll: true,
        sections: [],
        tasks: [],
        documents: [],
      };
      this.workflowService.createFileExportJob(input).subscribe({
        next: response => {
          this.uiNotification.showSnackbar(
            'Your zip file is being prepared... Please wait.',
            'neutral'
          );
          this.pollExportJob(response.id);
        },
        error: error => {
          console.error('Error creating export job', error);
        },
      });
    }
  }

  triggerDownload(url: string, name: string) {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: error => {
        console.error('Error downloading file', error);
      },
    });
  }

  downloadSingleFile(downloadDocument: DownloadDocument) {
    if (downloadDocument.url) {
      this.triggerDownload(downloadDocument.url, downloadDocument.name);
      return;
    }
  }

  pollExportJob(jobId: string) {
    this.workflowService
      .getExportJob(jobId)
      .pipe(
        mergeMap(job => {
          if (job.status === 'COMPLETED') {
            return of(job);
          } else {
            return throwError(() => new Error('Job not completed'));
          }
        }),
        retry({
          count: 10,
          delay: (_, retryAttempt) => {
            const backoffTime = Math.pow(2, retryAttempt) * this.delayTimeout;
            return timer(backoffTime);
          },
        }),
        mergeMap(job => {
          if (job && job.digest) {
            const id = job.id;
            const digest = job.digest;
            return this.documentService.downloadFile(id, digest).pipe(
              mergeMap(response =>
                this.http.get(response.url, { responseType: 'blob' })
              ),
              map(blob => ({ job, blob }))
            );
          } else {
            return throwError(() => new Error('Job digest not found'));
          }
        }),
        catchError(error => {
          console.error('Error in polling or downloading', error);
          return of(null);
        })
      )
      .subscribe({
        next: result => {
          if (result) {
            const { job, blob } = result;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${job.filename}`;
            a.click();
            window.URL.revokeObjectURL(url);
            this.uiNotification.showSnackbar(
              'Your zip file is ready for download.',
              'green'
            );
            this.fileExportCompletedEvent.emit(job);
          }
        },
        error: error => {
          console.error('Final error after retries', error);
        },
      });
  }

  expandComponent() {
    this.expanded.set(!this.expanded());
  }

  protected readonly FileTypes = FileTypes;
}
