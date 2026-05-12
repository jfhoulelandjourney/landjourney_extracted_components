import { inject, Injectable } from '@angular/core';
import { isNil, omitBy } from 'es-toolkit';
import {
  EMPTY,
  forkJoin,
  map,
  Observable,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import {
  CreateExportJob,
  ExportJob,
} from '../../models/documents/exportJobModel';
import type { RequestAttachmentHistory } from '../../models/requestAttachmentModels';
import {
  Request,
  RequestConfiguration,
  RequestOverview,
  RequestQueryResult,
  RequestUser,
  RequestUserRoles,
  RequestUserTypes,
  type CreateRequestAsCustomerParams,
  type CustomerInitiableRequestTemplate,
} from '../../models/requestModels';
import {
  AudiencePermissionsLevel,
  PatchAttachmentInput,
  Section,
  Task,
} from '../../models/sectionModels';
import { type PaginatedApiQueryOptions } from '../api/api.models';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import {
  RealtimeActions,
  RealtimeMessage,
  RealtimeMessagingService,
  WatchedEntities,
} from '../realtimeMessaging/realtime-messaging.service';
import type {
  RequestColumnSearchArgsSchema,
  RequestFilterConfiguration,
} from './requests.schema';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private apiService = inject(ApiService);
  private realTimeService = inject(RealtimeMessagingService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Workflows;
  }

  // TODO: Review the API to return metadata about pagination

  /* FILTERS CONFIGURATION */

  public getFilterConfiguration(): Observable<RequestFilterConfiguration> {
    return this.apiService.get<RequestFilterConfiguration>(
      this.serviceConfiguration,
      `/requests/filter-configuration`
    );
  }

  /* REQUESTS */

  public getRequestOverview(): Observable<RequestOverview> {
    return this.apiService.get<RequestOverview>(
      this.serviceConfiguration,
      `/requests/overview`
    );
  }

  public getAllRequests(): Observable<Request[]>;
  public getAllRequests(options: null): Observable<Request[]>;
  public getAllRequests(
    options: PaginatedApiQueryOptions
  ): Observable<RequestQueryResult>;
  public getAllRequests(
    options?: PaginatedApiQueryOptions | null
  ): Observable<Request[] | RequestQueryResult> {
    const { pageSize, sortDirection, ...rest } = options ?? {};
    const obj = omitBy(
      {
        ...rest,
        pageSize: pageSize,
        sortDirection: sortDirection,
      },
      isNil
    );
    const params = Object.keys(obj).length > 0 ? obj : null;
    return this.apiService
      .get<
        RequestQueryResult | Request[]
      >(this.serviceConfiguration, `/requests`, params, true)
      .pipe(
        map(response => {
          if (Array.isArray(response)) {
            // TODO: Validate this return type
            return response;
          }
          return response;
        })
      );
  }

  public getAllRequestsWithColumnFilters(
    args: RequestColumnSearchArgsSchema
  ): Observable<Request[]>;
  public getAllRequestsWithColumnFilters(
    args: RequestColumnSearchArgsSchema
  ): Observable<RequestQueryResult>;
  public getAllRequestsWithColumnFilters(
    args: RequestColumnSearchArgsSchema
  ): Observable<Request[] | RequestQueryResult> {
    return this.apiService
      .post<
        RequestQueryResult | Request[]
      >(this.serviceConfiguration, `/requests/search`, args)
      .pipe(
        map(response => {
          if (Array.isArray(response)) {
            // TODO: Validate this return type
            return response;
          }
          return response;
        })
      );
  }

  public getRequestsForUser(
    userId: string,
    loadSections = false,
    searchExpression = '',
    includeWorkgroups = false,
    includeClosed = true,
    sort = 'updatedAt',
    sortDirection = 'desc'
  ) {
    return this.apiService.get<Request[]>(
      this.serviceConfiguration,
      `/requests/users/${userId}`,
      {
        loadSections,
        search: searchExpression.trim(),
        includeWorkgroups,
        includeClosed,
        sort,
        sortDirection,
      }
    );
  }

  public getRequestsForUserWithColumnFilters(
    userId: string,
    args: RequestColumnSearchArgsSchema
  ) {
    return this.apiService
      .post<
        Request[]
      >(this.serviceConfiguration, `/requests/users/${userId}/search`, args)
      .pipe(
        map(response => {
          if (Array.isArray(response)) {
            // TODO: Validate this return type
            return response;
          }
          return response;
        })
      );
  }

  public getRequest(requestId: string, loadSections = false) {
    return this.apiService.get<Request>(
      this.serviceConfiguration,
      `/requests/${requestId}`,
      { loadSections },
      true
    );
  }

  public addUserToRequest(
    requestId: string,
    userId: string,
    userRole: RequestUserRoles,
    userType: RequestUserTypes,
    createSections = false,
    representatives: string[] = []
  ) {
    const payload = {
      requestId: requestId,
      userId: userId,
      userRole: userRole,
      userType: userType,
      representatives: representatives,
    };

    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/users?create_sections=${createSections}`,
      payload
    );
  }

  public updateUserInRequest(requestId: string, requestUser: RequestUser) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/users/${requestUser.userId}`,
      requestUser
    );
  }

  public removeUserFromRequest(requestId: string, userId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/users/${userId}`
    );
  }

  public createRequest(request: Request, isRenewal = false) {
    const renewalQueryParam = isRenewal ? `?isRenewal=true` : '';
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests${renewalQueryParam}`,
      request
    );
  }

  public createRequestAsCustomer(request: CreateRequestAsCustomerParams) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/customers`,
      request
    );
  }

  public saveRequest(request: Request, createOrUpdateSections = false) {
    const payload = structuredClone(request);

    if (!createOrUpdateSections) {
      payload.sections = null;
    }

    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${request.id}`,
      payload
    );
  }

  public addSectionsToRequest(
    request: Request,
    sections: Section[],
    instanciateTemplate = false,
    updateTemplate = false
  ) {
    const requestId = request.id;

    if (!requestId) return EMPTY;

    return forkJoin(
      sections.map(section => {
        const { tasks: _, ...copySection } = section;
        Object.assign(copySection, { tasks: [] });

        return this.createSection(
          requestId,
          copySection as Section,
          instanciateTemplate,
          updateTemplate
        ).pipe(
          switchMap(sectionResponse =>
            forkJoin(
              section.tasks.map(task =>
                this.createTask(requestId, sectionResponse.id || '', {
                  ...task,
                  sectionId: sectionResponse.id,
                })
              )
            )
          )
        );
      })
    );
  }

  public deleteRequest(requestId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}`
    );
  }

  /* SECTIONS */

  public getSectionsForRequest(requestId: string) {
    return this.apiService.get<Section[]>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections`
    );
  }

  public getSection(requestId: string, sectionId: string) {
    return this.apiService.get<Section>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}`
    );
  }

  public createSection(
    requestId: string,
    section: Section,
    instanciateTemplate = false,
    updateTemplate = false
  ) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections?should_instantiate_template_to_all_users=${instanciateTemplate}&should_update_template=${updateTemplate}`,
      section
    );
  }

  public saveSection(requestId: string, section: Section) {
    const requestPayload: Section = structuredClone(section);
    requestPayload.tasks = requestPayload.tasks ? requestPayload.tasks : [];
    return this.apiService
      .put<ApiMessage>(
        this.serviceConfiguration,
        `/requests/${requestId}/sections/${section.id}`,
        {
          ...requestPayload,
          ...(section.entityHash ? { lastEntityHash: section.entityHash } : {}),
        }
      )
      .pipe(
        map(response => {
          this.sendRequestRefreshMessage(requestId);
          return response;
        })
      );
  }

  public assignSection(
    requestId: string,
    sectionId: string,
    assigneeId: string | undefined
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}`,
      {
        assigneeId,
      }
    );
  }

  public updateAudiences(
    requestId: string,
    sectionId: string,
    audiencesPermissions: Record<string, AudiencePermissionsLevel>
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}`,
      {
        audiencesToUpdate: audiencesPermissions,
      }
    );
  }

  public removeAudiences(
    requestId: string,
    sectionId: string,
    audiences: string[]
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}`,
      {
        audiencesToRemove: audiences,
      }
    );
  }

  public patchSectionReviewStatus(
    requestId: string,
    sectionId: string,
    reviewStatus: string
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}`,
      {
        reviewStatus,
      }
    );
  }

  public deleteSection(requestId: string, sectionId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}`
    );
  }

  /* TEMPLATES */

  public getAllTemplates(bypassCache = true) {
    return this.apiService.get<Request[]>(
      this.serviceConfiguration,
      `/templates`,
      null,
      bypassCache
    );
  }

  public getAllTemplatesAsCustomer(bypassCache = true) {
    return this.apiService.get<CustomerInitiableRequestTemplate[]>(
      this.serviceConfiguration,
      `/templates`,
      null,
      bypassCache
    );
  }

  public getTemplate(templateId: string) {
    return this.apiService.get<Request>(
      this.serviceConfiguration,
      `/templates/${templateId}`
    );
  }

  public cloneTemplate(
    template: Request,
    targetOrganizationKey: string,
    name: string
  ) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/templates/${template.id}/clone?target=${targetOrganizationKey}&name=${name}`,
      template
    );
  }

  public createTemplate(template: Request) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/templates`,
      template
    );
  }

  public saveTemplate(template: Request) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/templates/${template.id}`,
      template
    );
  }

  public deleteTemplate(templateId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/templates/${templateId}`
    );
  }

  /* TASKS */

  public createTask(requestId: string, sectionId: string, requirement: Task) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}/tasks`,
      requirement
    );
  }

  public saveTask(requestId: string, sectionId: string, task: Task) {
    const requestPayload = {
      ...task,
      ...(task.entityHash ? { lastEntityHash: task.entityHash } : {}),
    };

    return this.apiService
      .put<ApiMessage>(
        this.serviceConfiguration,
        `/requests/${requestId}/sections/${sectionId}/tasks/${task.id}`,
        requestPayload
      )
      .pipe(
        map(response => {
          this.sendRequestRefreshMessage(requestId);
          return response;
        })
      );
  }

  public patchAttachment(
    requestId: string,
    sectionId: string,
    taskId: string,
    input: PatchAttachmentInput
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}/tasks/${taskId}/attachments/${input.id}`,
      input
    );
  }

  public deleteTask(requestId: string, sectionId: string, taskId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/sections/${sectionId}/tasks/${taskId}`
    );
  }

  /* REALTIME WATCHES */

  initializeConnection() {
    this.realTimeService.connect();
  }

  sendRequestWatchMessage(id: string) {
    this.realTimeService.sendMessage({
      action: RealtimeActions.WATCH,
      entity: WatchedEntities.REQUEST,
      watched_resource_id: id,
    });
  }

  sendRequestUnwatchMessage(id?: string) {
    if (id) {
      this.realTimeService.sendMessage({
        action: RealtimeActions.UNWATCH,
        entity: WatchedEntities.REQUEST,
        watched_resource_id: id,
      });
    }
  }

  sendRequestRefreshMessage(id: string) {
    this.realTimeService.sendMessage({
      action: RealtimeActions.REFRESH,
      entity: WatchedEntities.REQUEST,
      watched_resource_id: id,
    });
  }

  listenToRequestChanges(
    callbackAction: (message: RealtimeMessage) => void,
    destroy$: Subject<void>
  ) {
    this.realTimeService.messages.pipe(takeUntil(destroy$)).subscribe({
      next: message => {
        if (
          message.entity === WatchedEntities.REQUEST &&
          message.action === RealtimeActions.REFRESH
        ) {
          callbackAction(message);
        }
      },
    });
  }

  createFileExportJob(input: CreateExportJob) {
    return this.apiService.post<ExportJob>(
      this.serviceConfiguration,
      `/export-jobs`,
      input
    );
  }

  getExportJob(jobId: string) {
    return this.apiService.get<ExportJob>(
      this.serviceConfiguration,
      `/export-jobs/${jobId}`
    );
  }

  getExportJobsByRequest(requestId: string) {
    return this.apiService.get<ExportJob[]>(
      this.serviceConfiguration,
      `/export-jobs/requests/${requestId}`
    );
  }

  /* attachment history  */
  public addAttachmentHistory(
    event: RequestAttachmentHistory,
    requestId: string,
    attachmentId: string
  ) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}/attachments/${attachmentId}/history`,
      event
    );
  }

  public patchRequestConfiguration(
    requestId: string,
    requestConfiguration: RequestConfiguration
  ) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/requests/${requestId}`,
      {
        requestConfiguration,
      }
    );
  }
}
