import { inject, Injectable, signal } from '@angular/core';
import { isNotNil } from 'es-toolkit';
import {
  BehaviorSubject,
  catchError,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import type { DynamicForm } from '../../dynamic-forms/models/dynamic-forms.models';
import { Business } from '../../models/businessModels';
import {
  Request,
  RequestQueryResult,
  RequestUserTypes,
  type CustomerInitiableRequestTemplateQueryResult,
} from '../../models/requestModels';
import {
  Attachment,
  deriveSectionStatus,
  deriveTaskStatus,
  Section,
  Task,
  TaskStatuses,
  updateTaskStatus,
} from '../../models/sectionModels';
import { BasicUserProfile } from '../../models/userModels';
import { TimeUtil } from '../../utils/timeUtil';
import { PaginatedApiQueryOptions } from '../api/api.models';
import { ApiMessage } from '../api/api.service';
import { AttachmentsService } from '../documents/attachments.service';
import { DynamicFormService } from '../documents/dynamic-form.service';
import { OrganizationService } from '../organization/organization.service';
import {
  GetRequestResponse,
  type RequestColumnSearchArgsSchema,
} from './requests.schema';
import { WorkflowService } from './workflow.service';

@Injectable({
  providedIn: 'root',
})
export class RequestsService {
  loading = {
    requests: signal<boolean>(false),
    templates: signal<boolean>(false),
  };

  // DEPENDENCIES
  private readonly attachmentService = inject(AttachmentsService);
  private readonly workflowService = inject(WorkflowService);
  private readonly organizationService = inject(OrganizationService);
  private readonly dynamicFormService = inject(DynamicFormService);

  // INTERNAL STATE
  private readonly requestsSubject = new BehaviorSubject<RequestQueryResult>({
    items: [],
    totalCount: 0,
  });

  private readonly templatesSubject = new BehaviorSubject<RequestQueryResult>({
    items: [],
    totalCount: 0,
  });

  private readonly templatesAsCustomerSubject = new BehaviorSubject<CustomerInitiableRequestTemplateQueryResult>({
    items: [],
    totalCount: 0,
  });

  // PUBLIC API
  readonly requests$ = this.requestsSubject.asObservable();
  readonly templates$ = this.templatesSubject.asObservable();

  getAllRequestsWithColumnFilters(
    args: RequestColumnSearchArgsSchema
  ): Observable<RequestQueryResult> {
    this.loading.requests.set(true);
    // @ts-expect-error type not detected, any idea Thiago or Cath?
    return this.workflowService.getAllRequestsWithColumnFilters(args).pipe(
      tap(response => {
        // @ts-expect-error type not detected, any idea Thiago or Cath?
        this.requestsSubject.next(response);
        this.loading.requests.set(false);
      }),
      take(1)
    );
  }

  getAllRequests(
    options: PaginatedApiQueryOptions
  ): Observable<RequestQueryResult> {
    this.loading.requests.set(true);
    return this.workflowService.getAllRequests(options).pipe(
      tap(response => {
        this.requestsSubject.next(response);
        this.loading.requests.set(false);
      }),
      take(1)
    );
  }

  getAllTemplates() {
    this.loading.templates.set(true);
    return this.workflowService.getAllTemplates().pipe(
      tap(response => {
        this.templatesSubject.next({
          totalCount: response.length,
          items: response,
        });
        this.loading.templates.set(false);
      }),
      take(1)
    );
  }

  getAllTemplatesAsCustomer() {
    this.loading.templates.set(true);
    return this.workflowService.getAllTemplatesAsCustomer().pipe(
      tap(response => {
        this.templatesAsCustomerSubject.next({
          totalCount: response.length,
          items: response,
        });
        this.loading.templates.set(false);
      }),
      take(1)
    );
  }

  getRequest(requestId: string): Observable<GetRequestResponse> {
    return forkJoin({
      request: this.workflowService.getRequest(requestId).pipe(take(1)),
      sections: this.workflowService
        .getSectionsForRequest(requestId)
        .pipe(take(1)),
    }).pipe(
      map(response => {
        const sections = response.sections;
        const request = response.request as Request;
        const businessProfiles = request.users
          .filter(user => user.userType !== RequestUserTypes.INDIVIDUAL)
          .map(user => user.profile as Business)
          .filter(isNotNil);
        const individualProfiles = request.users
          .filter(user => user.userType === RequestUserTypes.INDIVIDUAL)
          .map(user => {
            const profile = user.profile as BasicUserProfile;
            if (!profile) {
              return null;
            }
            return {
              id: profile.userId,
              ...profile,
            };
          })
          .filter(isNotNil);

        return {
          request,
          sections,
          users: individualProfiles,
          businesses: businessProfiles,
        };
      }),
      take(1)
    );
  }

  getListOfBusinesses(ids?: string[]) {
    if (!ids || ids.length === 0) return of([]);

    return forkJoin(
      ids.map(id =>
        this.organizationService.getBusiness(id ?? '').pipe(
          take(1),
          catchError(error => {
            console.error(error);
            return of(undefined);
          })
        )
      )
    ).pipe(map(businesses => businesses.flat().filter(isNotNil)));
  }

  updateRequest(updatedRequest: Request) {
    const requests = this.requestsSubject.value;

    for (const request of requests.items) {
      if (request.id === updatedRequest.id) {
        request.users = updatedRequest.users;
      }
    }

    this.requestsSubject.next(structuredClone(requests));
  }

  patchTaskStatus(
    status: TaskStatuses,
    props: {
      request: Request;
      sectionId: string;
      taskId: string;
    }
  ): Observable<ApiMessage> {
    const requestId = props.request.id ?? '';
    const section = props.request.sections?.find(s => s.id === props.sectionId);
    const task = section?.tasks?.find(s => s.id === props.taskId);
    const attachments = (task?.attachments ?? []).map(a => ({
      ...a,
      status: updateTaskStatus(a.status, status),
    }));

    if (!section) {
      return throwError(() => 'Section not found');
    }

    if (!task) {
      return throwError(() => 'Task not found');
    }

    const updatedTask = {
      ...task,
      attachments,
      status: updateTaskStatus(task?.status, status),
    };
    return this.workflowService
      .saveTask(requestId, props.sectionId, updatedTask)
      .pipe(
        switchMap(response => {
          const tasks = section.tasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          );
          const sectionStatus = deriveSectionStatus(tasks) ?? section.status;

          if (section.status === sectionStatus) {
            return of(response);
          }

          const updatedSection = {
            ...section,
            tasks,
            status: sectionStatus,
          };

          return this.workflowService
            .saveSection(requestId, updatedSection)
            .pipe(map(() => response));
        })
      );
  }

  uploadFile(props: {
    file: File;
    section: Section;
    taskId: string;
    attachmentId: string;
    options?: {
      fileName?: string;
      fileMetadata?: Record<string, unknown>;
    };
  }): Observable<Attachment> {
    const requestId =
      'requestId' in props.section ? String(props.section.requestId) : '';
    const section = props.section;
    const task = section?.tasks.find(t => t.id === props.taskId);
    const attachment = task?.attachments.find(a => a.id === props.attachmentId);

    if (!section) {
      return throwError(() => 'Section not found');
    }
    if (!task) {
      return throwError(() => 'Task not found');
    }
    if (!attachment) {
      return throwError(() => 'Attachment not found');
    }

    return this.attachmentService
      .uploadFileToAttachment(props.file, attachment, props.options)
      .pipe(
        filter(response => response.type === 'attachment'),
        map(response => {
          const attachment = response.value as Attachment;
          return {
            ...attachment,
            status: TaskStatuses.PROVIDED,
          };
        }),
        switchMap((value: Attachment) => {
          const valueId = value.id ?? '';
          const attachments = (task.attachments ?? []).map(attachment => {
            return attachment.id === valueId ? value : attachment;
          }) satisfies Attachment[];

          const taskStatus = deriveTaskStatus(attachments) ?? task.status;
          const updatedTask = {
            ...task,
            attachments,
            status: taskStatus,
          };

          const tasks = (section.tasks ?? []).map(task => {
            return task.id === updatedTask.id ? updatedTask : task;
          }) satisfies Task[];

          const sectionStatus = deriveSectionStatus(tasks) ?? section.status;
          const updatedSection = {
            ...section,
            tasks,
            status: sectionStatus,
          } satisfies Section;

          return this.workflowService
            .saveSection(requestId, updatedSection)
            .pipe(map(() => value));
        })
      );
  }

  submitDynamicForm(props: {
    section: Section;
    task: Task;
    attachment: Attachment;
    dynamicForm: DynamicForm;
  }): Observable<Attachment> {
    const requestId =
      'requestId' in props.section ? String(props.section.requestId) : '';
    const section = props.section;
    const task = section?.tasks.find(t => t.id === props.task.id);
    const attachment = task?.attachments.find(
      a => a.id === props.attachment.id
    );

    if (!section) {
      return throwError(() => 'Section not found');
    }
    if (!task) {
      return throwError(() => 'Task not found');
    }
    if (!attachment) {
      return throwError(() => 'Attachment not found');
    }

    const updatedAttachments = task.attachments.map(att =>
      att.id === attachment.id
        ? {
            ...attachment,
            status: TaskStatuses.PROVIDED,
          }
        : att
    );
    const updatedTask = {
      ...task,
      submittedAt: TimeUtil.convertDateToSecondTimestamp(new Date()),
      submittedBy: this.organizationService.getOrganizationUserId(),
      attachments: updatedAttachments,
    };
    updatedTask.status = deriveTaskStatus(updatedAttachments) ?? task.status;
    const updatedTasks =
      section?.tasks.map(t => (t.id === task.id ? updatedTask : t)) ?? [];
    const updatedSection = {
      ...section,
      tasks: updatedTasks,
    } as Section;
    updatedSection.status = deriveSectionStatus(updatedTasks) ?? section.status;

    return this.dynamicFormService
      .updateDynamicForm(
        {
          ...props.dynamicForm,
          submittedBy: this.organizationService.getOrganizationUserId(),
        },
        props.attachment.digest ?? ''
      )
      .pipe(
        switchMap(() => {
          return this.workflowService
            .saveSection(requestId, updatedSection)
            .pipe(
              map(
                () =>
                  updatedAttachments.find(
                    a => a.id === attachment.id
                  ) as Attachment
              )
            );
        })
      );
  }
}
