import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, timer } from 'rxjs';
import { expand, last, switchMap } from 'rxjs/operators';
import { AsyncTask, AsyncTaskStatus } from '../../models/asyncTask';
import { ApiService, ServiceConfiguration } from '../api/api.service';
import { UiNotificationService } from '../notifications/ui-notification.service';

@Injectable({
  providedIn: 'root',
})
export class AsyncTaskService {
  private apiService = inject(ApiService);
  private httpClient = inject(HttpClient);
  private uiNotificationService = inject(UiNotificationService);

  private readonly serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  public getAsyncTaskStatus(asyncTaskId: string) {
    return this.apiService.get<AsyncTask>(
      this.serviceConfiguration,
      `/async-tasks/${asyncTaskId}`
    );
  }

  public pollForAsyncTaskCompletion(
    asyncTaskId: string,
    initialDelayInMs = 15000, // 15 seconds for initial polling
    maxDelayInMs = 1000 * 3 * 60, // 3 mins for max total polling duration
    frequentPollingIntervalMs = 5000, // 5 seconds
    stopOnNotFound = true
  ): Observable<AsyncTask> {
    const startTime = Date.now();
    const frequentPollingInterval = frequentPollingIntervalMs;
    return timer(initialDelayInMs).pipe(
      switchMap(() => this.getAsyncTaskStatus(asyncTaskId)),
      expand(asyncTask => {
        const elapsed = Date.now() - startTime;
        if (
          asyncTask.status === AsyncTaskStatus.COMPLETED ||
          asyncTask.status === AsyncTaskStatus.FAILED ||
          (stopOnNotFound && asyncTask.status === AsyncTaskStatus.NOT_FOUND) ||
          elapsed >= maxDelayInMs
        ) {
          return EMPTY; // Stop polling, do not emit again
        }
        return timer(frequentPollingInterval).pipe(
          switchMap(() => this.getAsyncTaskStatus(asyncTaskId))
        );
      }),
      last()
    );
  }
}
