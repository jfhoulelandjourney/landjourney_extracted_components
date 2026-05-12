import { HttpEventType } from '@angular/common/http';
import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { isNotNil } from 'es-toolkit';
import {
  catchError,
  delay,
  filter,
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import type { DynamicForm } from '../../../dynamic-forms/models/dynamic-forms.models';
import { SystemGroups } from '../../../models/authModels';
import type { FileMetadata } from '../../../models/documents/fileModels';
import {
  Request,
  RequestUser,
  RequestUserRoles,
  RequestUserTypes,
} from '../../../models/requestModels';
import {
  Attachment,
  AttachmentTypes,
  AudiencePermissionsLevel,
  Audiences,
  Section,
  SectionStatuses,
  Task,
  TaskStatuses,
} from '../../../models/sectionModels';
import { SafeUserCreate, UserProfile } from '../../../models/userModels';
import { PermissionUtil } from '../../../utils/permissionUtil';
import { getAliasesForEntity } from '../../../utils/requestUtils/entity-status';
import {
  isRequestClosed,
  isRequestPending,
} from '../../../utils/requestUtils/request-status';
import {
  computeSectionStatus,
  getSectionStatusCategory,
  isSectionCurrent,
  isSectionPast,
  SectionStatusesCategories,
} from '../../../utils/requestUtils/section-status';
import {
  sortIdentityVerificationLast,
  sortSectionComparator,
  sortSetCoapplicantsFirst,
} from '../../../utils/requestUtils/sections';
import { computeTaskStatus } from '../../../utils/requestUtils/task-status';
import { TimeUtil } from '../../../utils/timeUtil';
import { isSignatureDocumentFullySigned } from '../../../web-components/signature/annotation.types';
import { ApiMessage } from '../../api/api.service';
import { KeyValueService } from '../../data/keyValue.service';
import { DiscussionService } from '../../discussions/discussion.service';
import { DocumentService } from '../../documents/document.service';
import { DynamicFormService } from '../../documents/dynamic-form.service';
import { IAMService } from '../../identity/iam.service';
import { OrganizationService } from '../../organization/organization.service';
import { OffersService, type Offer } from '../../products/offers.service';
import {
  RealtimeActions,
  RealtimeMessage,
  WatchedEntities,
} from '../../realtimeMessaging/realtime-messaging.service';
import { WorkflowService } from '../../workflows-api/workflow.service';
import { ClientDocumentsService } from '../documents/client-documents.service';

export type ClientRequest = Request & {
  totalPendingTasks?: number;
};
export interface ThirdParty {
  firstName: string;
  lastName: string;
  email: string;
  role?: RequestUserRoles;
}

@Injectable({
  providedIn: 'root',
})
export class ClientRequestsService implements OnDestroy {
  readonly requestsLoaded = signal<boolean>(false);
  readonly requests = signal<Request[]>([]);
  readonly offersForApplicantApproval = signal<Offer[]>([]);
  readonly requestLoaded = signal<boolean>(false);

  // DEPENDENCIES
  private readonly documentService = inject(DocumentService);
  private readonly workflowService = inject(WorkflowService);
  private readonly iamService = inject(IAMService);
  private readonly organizationService = inject(OrganizationService);
  private readonly dynamicFormService = inject(DynamicFormService);
  private readonly discussionService = inject(DiscussionService);
  private readonly clientDocumentsService = inject(ClientDocumentsService);
  private readonly keyValueService = inject(KeyValueService);
  private readonly offersService = inject(OffersService);

  private destroy$ = new Subject<void>();

  constructor() {
    this.reset();
  }

  readonly requestsInProgress = computed<ClientRequest[]>(() => {
    const userId = this.organizationService.getOrganizationUserId();

    return this.requests()
      .filter(isRequestPending)
      .map(request => {
        const aliases = getAliasesForEntity(request.users ?? [], userId ?? '');

        const summaries = aliases
          .map(alias => {
            return request.userSummaries?.[alias];
          })
          .filter(isNotNil);

        const totalPendingTasks = summaries?.reduce(
          (sum, summary) => (sum += summary.incomplete + summary.need_updates),
          0
        );

        return {
          ...request,
          totalPendingTasks,
        };
      });
  });

  readonly requestsClosed = computed<ClientRequest[]>(() =>
    this.requests().filter(isRequestClosed)
  );

  readonly totalPendingTasks = computed(() => {
    return this.requestsInProgress().reduce(
      (sum, request) => (sum += request.totalPendingTasks ?? 0),
      0
    );
  });

  reset() {
    this.requestsLoaded.set(false);
    this.requests.set([]);
    this.loadRequests();
  }

  loadRequests() {
    if (
      this.organizationService.uiConfiguration.sharedDomain &&
      !this.organizationService.uiConfiguration.sharedDomainId
    ) {
      return;
    }

    this.requestsLoaded.set(false);
    this.workflowService
      .getRequestsForUser(
        this.organizationService.getOrganizationUserId(),
        true // DO NOT REMOVE WE NEED THAT TO FILTER OUT THE COLLABORATOR LIST
      )
      .pipe(
        tap((requests: Request[]) => {
          const requestsWithSections = this.requests().filter(
            request => request.sections
          );
          this.requests.set(
            requests.map(request => {
              const sections = requestsWithSections.find(
                r => r.id === request.id
              )?.sections;

              return sections
                ? {
                    ...request,
                    sections,
                  }
                : request;
            })
          );

          const requestIds = this.requestsInProgress().map(
            request => request.id ?? ''
          );

          if (requestIds.length > 0) {
            this.initializeRealtimeSubscription(requestIds);
          }

          const mainBorrowerRequestIds = this.requests()
            .filter(request =>
              request.users?.some(
                user =>
                  user.userRole === RequestUserRoles.BORROWER &&
                  user.userId ===
                    this.organizationService.getOrganizationUserId()
              )
            )
            .map(request => request.id ?? '');

          if (
            this.organizationService.isDemoModeActivated() &&
            mainBorrowerRequestIds.length > 0
          ) {
            this.offersService
              .getOffersForApplicantApproval(mainBorrowerRequestIds)
              .subscribe({
                next: offers => {
                  this.offersForApplicantApproval.set(offers);
                  this.requestsLoaded.set(true);
                },
              });
          } else {
            this.requestsLoaded.set(true);
          }
        }),
        catchError(_err => {
          this.requestsLoaded.set(false);
          return of([]);
        })
      )
      .subscribe({});
  }

  getOfferForApplicantApprovalForRequest(
    requestId: string
  ): Observable<Offer | undefined> {
    return this.offersService.getOffersForApplicantApproval([requestId]).pipe(
      tap(offers => {
        // If an offer is returned, add it to offersForApplicantApproval if it isn't already there
        if (offers && offers.length > 0) {
          const offer = offers[0];
          if (offer) {
            const currentOffers = this.offersForApplicantApproval();
            const offerExists = currentOffers.some(o => o.id === offer.id);
            if (!offerExists) {
              this.offersForApplicantApproval.set([...currentOffers, offer]);
            }
          }
        }
      }),
      map(offers => (offers && offers.length > 0 ? offers[0] : undefined))
    );
  }

  fetchRequest(requestId: string | undefined): Observable<Request | undefined> {
    this.requestLoaded.set(false);

    if (!requestId) {
      this.requestLoaded.set(true);
      return of(undefined);
    }

    const requests = [...this.requestsInProgress(), ...this.requestsClosed()];
    const request = requests.find(request => request.id === requestId);

    if (request && request.sections) {
      // Check if current user is the main borrower and load offer if needed
      this.checkAndLoadOfferForBorrower(request);
      this.requestLoaded.set(true);
      return of(request);
    } else {
      return this.workflowService.getRequest(requestId, true).pipe(
        tap((requestWithSections: Request) => {
          if (this.requests().length === 0) {
            this.requests.set([requestWithSections]);
          } else {
            this.requests.set(
              this.requests().map(request =>
                request.id === requestId ? requestWithSections : request
              )
            );
          }

          // Check if current user is the main borrower and load offer if needed
          this.checkAndLoadOfferForBorrower(requestWithSections);

          this.requestLoaded.set(true);
        })
      );
    }
  }

  private checkAndLoadOfferForBorrower(request: Request): void {
    const userId = this.organizationService.getOrganizationUserId();
    const isMainBorrower = request.users?.some(
      user =>
        user.userRole === RequestUserRoles.BORROWER && user.userId === userId
    );

    if (
      isMainBorrower &&
      this.organizationService.isDemoModeActivated() &&
      request.id
    ) {
      // Load offer for applicant approval if user is main borrower
      this.getOfferForApplicantApprovalForRequest(request.id).subscribe({
        next: () => {
          // Offer is automatically added to offersForApplicantApproval in the function
        },
        error: () => {
          // Silently fail if offer doesn't exist or can't be loaded
        },
      });
    }
  }

  refetchRequest(
    requestId: string | undefined
  ): Observable<Request | undefined> {
    if (!requestId) {
      return of(undefined);
    }
    this.requestLoaded.set(false);
    return this.workflowService.getRequest(requestId, true).pipe(
      tap((requestWithSections: Request) => {
        this.requests.set(
          this.requests().map(request =>
            request.id === requestId ? requestWithSections : request
          )
        );
        this.requestLoaded.set(true);
      })
    );
  }

  getAttachmentFile(attachment: Attachment) {
    const { documentId, digest } = attachment;
    return this.clientDocumentsService.fetchDocument(documentId, digest);
  }

  getDynamicForm(attachment: Attachment) {
    if (attachment.documentId && attachment.digest) {
      return this.dynamicFormService.getDynamicForm(
        attachment.documentId,
        attachment.digest
      );
    }

    return of(null);
  }

  createSignatureToken(): Observable<{
    id: string;
    accessToken: string;
  }> {
    return this.documentService.createSignatureToken();
  }

  getSignatureCertificates(): Observable<{
    caCertificates: string[];
  }> {
    return this.documentService.getSignatureCertificates();
  }

  submitSignatureFile(
    request: ClientRequest | undefined,
    section: Section | undefined,
    task: Task,
    attachment: Attachment,
    file: FileMetadata
  ) {
    const allSigned = isSignatureDocumentFullySigned(file);

    const updatedAttachments = task.attachments.map(att =>
      att.id === attachment.id
        ? {
            ...attachment,
            status: allSigned ? TaskStatuses.PROVIDED : TaskStatuses.INCOMPLETE,
          }
        : att
    );

    const updatedTask = {
      ...task,
      attachments: updatedAttachments,
    };
    if (allSigned) {
      updatedTask.status = computeTaskStatus(updatedTask);
    } else {
      updatedTask.status = TaskStatuses.PROVIDED;
    }

    const updatedTasks =
      section?.tasks.map(t => (t.id === task.id ? updatedTask : t)) ?? [];

    const updatedSection = {
      ...section,
      tasks: updatedTasks,
    } as Section;
    updatedSection.status = computeSectionStatus(updatedSection, {
      modifyTasks: false,
    });

    return forkJoin([
      this.workflowService.saveSection(request?.id ?? '', updatedSection),
      this.documentService.updateFileMetadata(file, file.digest ?? ''),
    ]).pipe(
      delay(100),
      take(1),
      switchMap(() => {
        return forkJoin([
          this.clientDocumentsService
            .fetchDocument(file.id ?? '', file.digest ?? '', {
              forceReload: true,
            })
            .pipe(
              catchError(err => {
                console.error(
                  'Error fetching updated document:',
                  file.id,
                  String(err)
                );
                return of(undefined);
              })
            ),
          this.refetchRequest(request?.id).pipe(
            catchError(err => {
              console.error(
                'Error refetching request:',
                request?.id,
                String(err)
              );
              return of(undefined);
            })
          ),
        ]);
      })
    );
  }

  submitSignedFile(
    request: ClientRequest | undefined,
    section: Section | undefined,
    task: Task,
    attachment: Attachment,
    metadata: FileMetadata,
    pdfFile: File
  ): Observable<{ success: boolean; error?: string }> {
    const allSigned = isSignatureDocumentFullySigned(metadata, {
      allowSignedByFallback: true,
    });

    if (!allSigned) {
      return throwError(() => ({
        success: false,
        error: new Error('Not all signatures are filled.'),
      }));
    }

    // Remove all annotations and pdf metadata from the signed file
    const fm = metadata.fileMetadata as Record<string, unknown> | undefined;

    const sanitizedMetadata: FileMetadata = {
      ...metadata,
      digest: metadata.digest ?? '',
      fileMetadata: {
        fileName: fm?.fileName as string | undefined,
        originalName: fm?.originalName as string | undefined,
        uploadedBy: fm?.uploadedBy as string | undefined,
      },
    } as FileMetadata;

    return this.documentService
      .getUploadConfiguration(metadata.id ?? '', metadata.digest ?? '')
      .pipe(
        switchMap(uploadConfiguration => {
          return this.documentService
            .uploadFile(uploadConfiguration, { file: pdfFile })
            .pipe(filter(event => event.type === HttpEventType.Response));
        }),
        switchMap(() => {
          return this.documentService.updateFileMetadata(
            sanitizedMetadata,
            sanitizedMetadata.digest ?? ''
          );
        }),
        switchMap(() => {
          const updatedAttachment = {
            ...attachment,
            status: TaskStatuses.APPROVED,
          };

          const updatedAttachments = task.attachments.map(att =>
            att.id === attachment.id ? updatedAttachment : att
          );

          const updatedTask = {
            ...task,
            submittedAt: TimeUtil.convertDateToSecondTimestamp(new Date()),
            submittedBy: this.organizationService.getOrganizationUserId(),
            attachments: updatedAttachments,
          };
          updatedTask.status = computeTaskStatus(updatedTask);

          const updatedTasks =
            section?.tasks.map(t => (t.id === task.id ? updatedTask : t)) ?? [];

          const updatedSection = {
            ...section,
            tasks: updatedTasks,
          } as Section;
          updatedSection.status = computeSectionStatus(updatedSection);

          return this.workflowService.saveSection(
            request?.id ?? '',
            updatedSection
          );
        }),
        take(1),
        tap(() => {
          this.refetchRequest(request?.id).subscribe();
        }),
        map(() => ({ success: true })),
        catchError((error: ApiMessage) => {
          console.error('Error submitting signed file:', error);
          return of({ success: false, error: error.message });
        })
      );
  }

  submitDynamicForm(
    request: ClientRequest | undefined,
    section: Section | undefined,
    task: Task,
    attachment: Attachment,
    dynamicForm: DynamicForm
  ) {
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
    updatedTask.status = computeTaskStatus(updatedTask);

    const updatedTasks =
      section?.tasks.map(t => (t.id === task.id ? updatedTask : t)) ?? [];

    const updatedSection = {
      ...section,
      tasks: updatedTasks,
    } as Section;
    updatedSection.status = computeSectionStatus(updatedSection);

    return forkJoin([
      this.workflowService.saveSection(request?.id ?? '', updatedSection),
      this.dynamicFormService.updateDynamicForm(
        dynamicForm,
        attachment.digest ?? ''
      ),
    ]).pipe(
      delay(100),
      take(1),
      tap(() => this.refetchRequest(request?.id).subscribe({}))
    );
  }

  saveDynamicForm(attachment: Attachment, dynamicForm: DynamicForm) {
    return this.dynamicFormService.updateDynamicForm(
      dynamicForm,
      attachment.digest ?? ''
    );
  }

  getEntitiesForRequest(request: ClientRequest | undefined): RequestUser[] {
    if (!request) {
      return [];
    }

    return (request?.users ?? []).filter(
      user => user.userRole !== RequestUserRoles.LOAN_OFFICER
    );
  }

  getRequest(requestId: string | undefined): Request | undefined {
    if (!requestId) {
      return undefined;
    }

    const requests = [...this.requestsInProgress(), ...this.requestsClosed()];
    const request = requests.find(request => request.id === requestId);

    return request;
  }

  getSections(
    request: ClientRequest | undefined,
    filterStatus: SectionStatuses[]
  ): Section[] {
    if (!request) {
      return [];
    }

    const currentUserId = this.organizationService.getOrganizationUserId();

    const sections =
      request.sections?.filter(
        (section: Section) =>
          isSectionCurrent(request?.status, section) ||
          isSectionPast(request?.statusFlow, request?.status, section) ||
          section.status === SectionStatuses.APPROVED
      ) ?? [];

    if (filterStatus.length === 0) {
      return sections
        .sort(section => (section.tasks && section.tasks.length > 0 ? -1 : 1))
        .sort(section => (section.assigneeId === currentUserId ? -1 : 1))
        .sort((a, b) => sortSectionComparator(a, b))
        .sort((a, b) => sortIdentityVerificationLast(a, b))
        .sort((a, b) => sortSetCoapplicantsFirst(a, b));
    }

    return sections
      .filter(section => filterStatus.includes(section.status))
      .sort(section => (section.tasks && section.tasks.length > 0 ? -1 : 1))
      .sort(section => (section.assigneeId === currentUserId ? -1 : 1))
      .sort((a, b) => sortSectionComparator(a, b))
      .sort((a, b) => sortIdentityVerificationLast(a, b))
      .sort((a, b) => sortSetCoapplicantsFirst(a, b));
  }

  getSection(
    request: ClientRequest | undefined,
    sectionId: string | undefined
  ): Section | undefined {
    if (!request) {
      return undefined;
    }

    const section = (request.sections ?? []).find(
      section => section.id === sectionId
    );

    if (!section) {
      return undefined;
    }

    // attachments inside of tasks are sorted by returning the reference attachments first
    return {
      ...section,
      tasks: section.tasks.map(task => {
        return {
          ...task,
          attachments: task.attachments.sort(attachment =>
            attachment.type === AttachmentTypes.REFERENCE_DOCUMENT ? -1 : 1
          ),
        };
      }),
    };
  }

  isSectionUnderReview(section: Section | undefined): boolean {
    if (!section) {
      return false;
    }

    const sectionStatusCategory = getSectionStatusCategory(section);

    return (
      sectionStatusCategory !== SectionStatusesCategories.COMPLETED &&
      sectionStatusCategory !== SectionStatusesCategories.SUBMITTED &&
      section?.permission === AudiencePermissionsLevel.EDIT
    );
  }

  canEditSection(section: Section | undefined): boolean {
    if (!section) {
      return false;
    }

    const sectionStatusCategory = getSectionStatusCategory(section);

    return (
      sectionStatusCategory !== SectionStatusesCategories.COMPLETED &&
      section?.permission === AudiencePermissionsLevel.EDIT
    );
  }

  getAssignedName(
    request: ClientRequest | undefined,
    assigneeId: string | undefined
  ): string | undefined {
    const entity = request?.users.find(entity => entity.userId === assigneeId);

    if (!entity) {
      return undefined;
    }

    const isEntityBusiness = entity.profile && 'businessType' in entity.profile;

    if (isEntityBusiness) {
      if (entity.profile) {
        if (
          'representatives' in entity.profile &&
          entity.profile.representatives?.length
        ) {
          const currentUserId =
            this.organizationService.getOrganizationUserId();
          const currentUser = entity.profile.representatives.find(
            rep => rep === currentUserId
          );
          if (currentUser) {
            return `${entity.profile.name} (${currentUser.firstName} ${currentUser.lastName})`;
          }
          const firstRepresentative = entity.profile.representatives.sort()[0];
          return `${entity.profile.name} (${firstRepresentative?.firstName} ${firstRepresentative?.lastName})`;
        }

        if (
          'primaryContactId' in entity.profile &&
          entity.profile.primaryContactId
        ) {
          const primaryContactId = entity.profile.primaryContactId;
          const users = (entity.profile.users as UserProfile[]) ?? [];
          const primaryContact = users.find(
            user => user.userId === primaryContactId
          );

          return `${entity.profile.name} (${primaryContact?.firstName} ${primaryContact?.lastName})`;
        }

        if ('firstName' in entity.profile) {
          return `${entity.profile.firstName} ${entity.profile.lastName}`;
        } else {
          return `${entity.firstName} ${entity.lastName}`;
        }
      } else {
        return `${entity.firstName} ${entity.lastName}`;
      }
    } else {
      if (entity.profile) {
        return 'firstName' in entity.profile
          ? `${entity.profile.firstName} ${entity.profile.lastName}`
          : `${entity.firstName} ${entity.lastName}`;
      } else {
        return `${entity.firstName} ${entity.lastName}`;
      }
    }
  }

  skipAttachment(
    request: ClientRequest | undefined,
    section: Section | undefined,
    task: Task,
    groupedAttachment: Attachment[],
    justification: string
  ): Section {
    const groupedAttachmentIds = groupedAttachment.map(
      attachment => attachment.id
    );

    const updatedTask = {
      ...task,
      submittedAt: TimeUtil.convertDateToSecondTimestamp(new Date()),
      submittedBy: this.organizationService.getOrganizationUserId(),
      attachments: [
        ...task.attachments.filter(
          attachment => !groupedAttachmentIds.includes(attachment.id)
        ),
        ...task.attachments
          .filter(attachment => groupedAttachmentIds.includes(attachment.id))
          .map(attachment => ({
            ...attachment,
            status: TaskStatuses.SKIPPED,
            justification: justification,
          })),
      ],
    };

    const updatedTasks =
      section?.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)) ??
      [];

    const updatedSection = {
      ...section,
      tasks: updatedTasks,
    } as Section;

    updatedSection.status = computeSectionStatus(updatedSection);

    this.workflowService
      .saveSection(request?.id ?? '', updatedSection)
      .subscribe({
        next: () => {
          this.refetchRequest(request?.id).subscribe({});
        },
      });

    return updatedSection;
  }

  unskipAttachment(
    request: ClientRequest | undefined,
    section: Section | undefined,
    task: Task,
    groupedAttachment: Attachment[]
  ): Section {
    const groupedAttachmentIds = groupedAttachment.map(
      attachment => attachment.id
    );

    const hasAlreadyUploadedFile = groupedAttachment.some(attachment => {
      return (
        attachment.writable &&
        attachment.documentId &&
        attachment.type !== AttachmentTypes.DYNAMIC_FORM
      );
    });

    const updatedTask = {
      ...task,
      submittedAt: hasAlreadyUploadedFile ? task.submittedAt : undefined,
      submittedBy: hasAlreadyUploadedFile ? task.submittedBy : undefined,
      justification: null,
      status: hasAlreadyUploadedFile
        ? TaskStatuses.PROVIDED
        : TaskStatuses.INCOMPLETE,
      attachments: [
        ...task.attachments.filter(
          attachment => !groupedAttachmentIds.includes(attachment.id)
        ),
        ...task.attachments
          .filter(attachment => groupedAttachmentIds.includes(attachment.id))
          .map(attachment => ({
            ...attachment,
            status: hasAlreadyUploadedFile
              ? TaskStatuses.PROVIDED
              : TaskStatuses.INCOMPLETE,
            justification: null,
          })),
      ],
    };

    const updatedTasks =
      section?.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)) ??
      [];

    const updatedSection = {
      ...section,
      tasks: updatedTasks,
    } as Section;
    updatedSection.status = computeSectionStatus(updatedSection);

    this.workflowService
      .saveSection(request?.id ?? '', updatedSection)
      .subscribe({
        next: () => {
          this.refetchRequest(request?.id).subscribe({});
        },
      });

    return updatedSection;
  }

  updateAssignee(
    requestId: string,
    sectionId: string,
    assigneeId: string | undefined
  ) {
    // if the assigneeId is null, we want to assign to the current user. A section can not not have an assignee
    return this.workflowService
      .assignSection(
        requestId,
        sectionId,
        assigneeId ?? this.organizationService.getOrganizationUserId()
      )
      .pipe(
        take(1),
        tap(() => this.refetchRequest(requestId).subscribe({}))
      );
  }

  addUserToRequest(
    user: {
      firstname: string;
      lastname: string;
      email: string;
      userRole: RequestUserRoles;
    },
    requestId: string | undefined
  ) {
    const safeCreateUserInput: SafeUserCreate = {
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      groups: [SystemGroups.CUSTOMERS as string],
    };

    return this.organizationService
      .safeAddUserToOrganization(safeCreateUserInput)
      .pipe(
        switchMap(({ id }: ApiMessage) => {
          if (id && user.userRole) {
            return this.workflowService.addUserToRequest(
              requestId ?? '',
              id,
              user.userRole,
              RequestUserTypes.INDIVIDUAL
            );
          }
          throw new Error('User role or ID is missing');
        })
      )
      .pipe(
        take(1),
        tap(() => this.refetchRequest(requestId).subscribe({}))
      );
  }

  public async delegateRequest(
    requests: Request[],
    thirdParty: ThirdParty
  ): Promise<boolean> {
    const organizationUserId = this.organizationService.getOrganizationUserId();

    const userCreationResponse = await lastValueFrom(
      this.organizationService.safeAddUserToOrganization({
        ...thirdParty,
        groups: [SystemGroups.CUSTOMERS],
      })
    );

    const userId = userCreationResponse.id;

    if (!userId || !organizationUserId) {
      Promise.resolve(false);
    }

    if (
      requests.some(
        request =>
          !PermissionUtil.userCanDelegate(organizationUserId ?? '', request)
      )
    ) {
      return Promise.resolve(false);
    }

    // For each request, assign the audience for the delegate
    // It's important to keep it separate for legal traceability
    for (const request of requests) {
      if (!request.id) {
        continue;
      }

      if (
        !request.users.some(user => user.userId === userCreationResponse.id)
      ) {
        const _ = await lastValueFrom(
          this.workflowService.addUserToRequest(
            request.id,
            userId ?? '',
            RequestUserRoles.COLLABORATOR,
            RequestUserTypes.INDIVIDUAL
          )
        );
      }

      await this.delegateSections(request, userId ?? '');
    }

    // then send one email for all requests
    // path to the request is provided only if the delegate was added to a single request
    const currentUserName = `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`;
    await lastValueFrom(
      this.discussionService.sendCollaboratorEmailInvite(
        userCreationResponse.id ?? '',
        `${thirdParty.firstName} ${thirdParty.lastName}`,
        thirdParty.email,
        currentUserName,
        this.organizationService.getTenantName(),
        'requests',
        requests.length > 1 ? '' : (requests[0]?.id ?? '')
      )
    );

    return Promise.resolve(true);
  }

  async delegateSections(
    request: Request,
    delegateId: string
  ): Promise<boolean> {
    const organizationUserId = this.organizationService.getOrganizationUserId();

    if (!organizationUserId) {
      return Promise.resolve(false);
    }

    const aliases = getAliasesForEntity(request.users, organizationUserId);

    for (const section of request.sections ?? []) {
      if (
        (aliases.includes(section.assigneeId ?? '') &&
          section.scope === 'applicant') ||
        (section.scope === 'request' &&
          section.audiencesPermission[Audiences.ALL_CLIENTS] ===
            AudiencePermissionsLevel.EDIT)
      ) {
        const payload: Record<string, AudiencePermissionsLevel> = {};
        payload[delegateId] = AudiencePermissionsLevel.EDIT;

        await lastValueFrom(
          this.workflowService.updateAudiences(
            request.id ?? '',
            section.id ?? '',
            payload
          )
        );
      }
    }

    return Promise.resolve(true);
  }

  public async removeDelegateFromRequest(requestId: string, userId: string) {
    await lastValueFrom(
      this.workflowService.removeUserFromRequest(requestId, userId)
    );
    await lastValueFrom(this.refetchRequest(requestId));
    this.loadRequests();
  }

  public async removeDelegateFromAllRequests(userId: string): Promise<boolean> {
    const requests = this.requests();
    const organizationUserId = this.organizationService.getOrganizationUserId();

    if (!organizationUserId || !userId) {
      return Promise.resolve(false);
    }

    const requestIds: string[] = [];
    for (const request of requests) {
      if (
        (PermissionUtil.userCanDelegate(organizationUserId, request) &&
          PermissionUtil.isUserCollaboratorRequest(userId, request.users)) ||
        (PermissionUtil.isUserCollaboratorRequest(userId, request.users) &&
          userId === organizationUserId)
      ) {
        requestIds.push(request.id ?? '');
      }
    }

    for (const requestId of requestIds) {
      await lastValueFrom(
        this.workflowService.removeUserFromRequest(requestId, userId)
      );
    }

    this.loadRequests();

    return Promise.resolve(true);
  }

  uploadFilesToSectionBypassStatus(
    request: ClientRequest | undefined,
    section: Section | undefined,
    task: Task,
    attachments: Attachment[]
  ) {
    const updatedTask = {
      ...task,
      attachments,
    };

    const updatedTasks =
      section?.tasks.map(t => (t.id === task.id ? updatedTask : t)) ?? [];

    const updatedSection = {
      ...section,
      tasks: updatedTasks,
    } as Section;

    return this.workflowService
      .saveSection(request?.id ?? '', updatedSection)
      .pipe(
        delay(100),
        take(1),
        tap(() => this.refetchRequest(request?.id).subscribe({}))
      );
  }

  uploadFilesToSection(
    request: ClientRequest | undefined,
    section: Section | undefined,
    task: Task,
    attachments: Attachment[]
  ) {
    const updatedTask = {
      ...task,
      attachments,
    };
    updatedTask.status = computeTaskStatus(updatedTask);

    if (updatedTask.status === TaskStatuses.PROVIDED) {
      updatedTask.submittedAt = TimeUtil.convertDateToSecondTimestamp(
        new Date()
      );
      updatedTask.submittedBy =
        this.organizationService.getOrganizationUserId();
    } else if (
      updatedTask.status === TaskStatuses.APPROVED &&
      !updatedTask.submittedAt
    ) {
      updatedTask.submittedAt = TimeUtil.convertDateToSecondTimestamp(
        new Date()
      );
      updatedTask.submittedBy =
        this.organizationService.getOrganizationUserId();
    }

    const updatedTasks =
      section?.tasks.map(t => (t.id === task.id ? updatedTask : t)) ?? [];

    const updatedSection = {
      ...section,
      tasks: updatedTasks,
    } as Section;
    updatedSection.status = computeSectionStatus(updatedSection);

    return this.workflowService
      .saveSection(request?.id ?? '', updatedSection)
      .pipe(
        delay(100),
        take(1),
        tap(() => this.refetchRequest(request?.id).subscribe({}))
      );
  }

  refreshRequest(message: RealtimeMessage) {
    if (
      message.entity === WatchedEntities.REQUEST &&
      message.action === RealtimeActions.REFRESH
    ) {
      const requestIds = this.requestsInProgress()
        .map(request => request.id)
        .filter(isNotNil);
      if (requestIds.includes(message.watched_resource_id)) {
        this.refetchRequest(message.watched_resource_id).subscribe({});
      }
    }
  }

  initializeRealtimeSubscription(ids: string[]) {
    this.workflowService.initializeConnection();
    for (const requestId of ids) {
      this.workflowService.sendRequestWatchMessage(requestId);
    }
    this.workflowService.listenToRequestChanges(
      this.refreshRequest.bind(this),
      this.destroy$
    );
  }

  sendUnwatchMessage(ids: string[] = []) {
    if (ids && ids.length > 0) {
      for (const id of ids) {
        this.workflowService.sendRequestUnwatchMessage(id);
      }
    }
  }

  ngOnDestroy() {
    const requestIds = this.requestsInProgress()
      .map(request => request.id)
      .filter(isNotNil);
    this.sendUnwatchMessage(requestIds);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
