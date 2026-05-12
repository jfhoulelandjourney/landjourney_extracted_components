import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { Business, BusinessTypes } from '../../models/businessModels';
import type {
  CoApplicantViewModel,
  InviteCoApplicantPayload,
} from '../../models/coApplicantModels';
import {
  Request,
  RequestUser,
  RequestUserRoles,
  RequestUserTypes,
} from '../../models/requestModels';
import { SharedViewUserProfile } from '../../models/userModels';
import { PermissionUtil } from '../../utils/permissionUtil';
import { ApiMessage } from '../api/api.service';
import { IAMService } from '../identity/iam.service';
import {
  ExistingRequestUserInvitationSchema,
  InvitationSchema,
} from '../workflows-api/invitation.models';
import { InvitationService } from '../workflows-api/invitation.service';
import { WorkflowService } from '../workflows-api/workflow.service';

@Injectable({
  providedIn: 'root',
})
export class CoApplicantsService {
  private readonly workflowService = inject(WorkflowService);
  private readonly invitationService = inject(InvitationService);
  private readonly iamService = inject(IAMService);

  readonly confirmedApplicants = signal<CoApplicantViewModel[]>([]);
  readonly pendingInvitations = signal<CoApplicantViewModel[]>([]);

  // Backward-compat: mobile-top-bar and add-co-applicant-dialog still read coApplicants()
  readonly coApplicants = computed(() => [
    ...this.confirmedApplicants(),
    ...this.pendingInvitations(),
  ]);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private readonly _latestRequest = signal<Request | null>(null);

  loadCoApplicants(requestId: string): Observable<CoApplicantViewModel[]> {
    this.loading.set(true);
    this.error.set(null);

    return forkJoin({
      request: this.workflowService.getRequest(requestId),
      invitations: this.invitationService.getAllRequestInvitations(requestId),
    }).pipe(
      map(({ request, invitations }) => {
        this._latestRequest.set(request);

        const confirmed = this.buildConfirmedApplicants(request);
        const pending = this.buildPendingInvitations(request, invitations);

        this.confirmedApplicants.set(confirmed);
        this.pendingInvitations.set(pending);

        return [...confirmed, ...pending];
      }),
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        this.error.set(this.toErrorMessage(err));
        return throwError(() => err);
      })
    );
  }

  computeEligibility(currentUserId: string): { canShowMyself: boolean; canDirectAddBusiness: boolean } {
    const request = this._latestRequest();
    const users = request?.users ?? [];
    if (!request || !currentUserId) {
      return { canShowMyself: true, canDirectAddBusiness: false };
    }
    const canShowMyself = !users.some(
      u =>
        (u.userId === currentUserId ||
          PermissionUtil.isRepresentative(currentUserId, u)) &&
        u.userType === RequestUserTypes.INDIVIDUAL
    );
    const canDirectAddBusiness = users.some(
      u =>
        u.userId === currentUserId ||
        PermissionUtil.isRepresentative(currentUserId, u)
    );
    return { canShowMyself, canDirectAddBusiness };
  }

  getCurrentUserProfile(currentUserId: string): { firstName: string; lastName: string; email: string } {
    const request = this._latestRequest();
    if (!request || !currentUserId) {
      return { firstName: '', lastName: '', email: '' };
    }
    const user = (request.users ?? []).find(
      u =>
        u.userId === currentUserId ||
        PermissionUtil.isRepresentative(currentUserId, u)
    );
    if (!user) {
      return { firstName: '', lastName: '', email: '' };
    }
    const profile = user.profile as { firstName?: string; lastName?: string } | undefined;
    const activeUser = this.iamService.getActiveUser();
    return {
      firstName: profile?.firstName ?? user.firstName ?? activeUser?.firstName ?? '',
      lastName: profile?.lastName ?? user.lastName ?? activeUser?.lastName ?? '',
      email: (user.email ?? activeUser?.email ?? '').trim(),
    };
  }

  inviteCoApplicant(payload: InviteCoApplicantPayload): Observable<ApiMessage> {
    const isDirectAdd = payload.invitationType === 'BUSINESS_INVITATION' && Boolean(payload.businessId);

    this.error.set(null);

    return isDirectAdd
      ? this._inviteDirectAdd(payload)
      : this._inviteWithOptimistic(payload);
  }

  private _inviteWithOptimistic(payload: InviteCoApplicantPayload): Observable<ApiMessage> {
    const optimistic = this.buildOptimisticCoApplicant(payload);
    this.pendingInvitations.update(list => [...list, optimistic]);

    return this.invitationService
      .createRequestInvitation(this.toInvitationSchema(payload))
      .pipe(
        switchMap(result => {
          return this.invitationService
            .getAllRequestInvitations(payload.requestId)
            .pipe(
              tap(invitations => {
                const realEntry = invitations
                  .filter(inv => inv.active)
                  .find(inv => inv.email.toLowerCase() === (payload.email ?? '').toLowerCase());

                this.pendingInvitations.update(current => {
                  const withoutOptimistic = current.filter(c => c.id !== optimistic.id);
                  if (realEntry) {
                    return [...withoutOptimistic, this.toViewModelFromInvitation(realEntry)];
                  }
                  return [...withoutOptimistic, { ...optimistic, status: 'pending' as const }];
                });
              }),
              switchMap(() =>
                timer(200).pipe(
                  switchMap(() => this.workflowService.getRequest(payload.requestId)),
                  tap(request => {
                    this._latestRequest.set(request);
                    const confirmed = this.buildConfirmedApplicants(request);
                    this.confirmedApplicants.set(confirmed);
                  }),
                  map(() => result)
                )
              )
            );
        }),
        catchError(err => {
          this.pendingInvitations.update(list => list.filter(c => c.id !== optimistic.id));
          this.error.set(this.toErrorMessage(err));
          return throwError(() => err);
        })
      );
  }

  private _inviteDirectAdd(payload: InviteCoApplicantPayload): Observable<ApiMessage> {
    return this.invitationService
      .createRequestInvitation(this.toInvitationSchema(payload))
      .pipe(
        switchMap(result =>
          timer(200).pipe(
            switchMap(() =>
              forkJoin({
                request: this.workflowService.getRequest(payload.requestId),
                invitations: this.invitationService.getAllRequestInvitations(payload.requestId),
              })
            ),
            tap(({ request, invitations }) => {
              this._latestRequest.set(request);
              const confirmed = this.buildConfirmedApplicants(request);
              const pending = this.buildPendingInvitations(request, invitations);
              this.confirmedApplicants.set(confirmed);
              this.pendingInvitations.set(pending);
            }),
            map(() => result)
          )
        ),
        catchError(err => {
          this.error.set(this.toErrorMessage(err));
          return throwError(() => err);
        })
      );
  }

  private buildConfirmedApplicants(request: Request): CoApplicantViewModel[] {
    const coBorrowerUsers = (request.users ?? []).filter(
      user => user.userRole === RequestUserRoles.CO_BORROWER
    );

    const sorted = [...coBorrowerUsers].sort((a, b) => {
      const rankA = this.isBusinessProfile(a) ? 2 : 1;
      const rankB = this.isBusinessProfile(b) ? 2 : 1;
      return rankA - rankB;
    });

    const result = sorted.map(user => this.toViewModelFromUserConfirmed(user));
    return result;
  }

  private buildPendingInvitations(
    request: Request,
    invitations: ExistingRequestUserInvitationSchema[]
  ): CoApplicantViewModel[] {
    const coBorrowerUsers = (request.users ?? []).filter(
      user => user.userRole === RequestUserRoles.CO_BORROWER
    );

    const result = invitations
      .filter(invitation => invitation.active)
      .filter(
        invitation =>
          !coBorrowerUsers.some(
            user =>
              (user.email ?? '').toLowerCase() === invitation.email.toLowerCase()
          )
      )
      .map(invitation => this.toViewModelFromInvitation(invitation));

    return result;
  }

  private buildOptimisticCoApplicant(
    payload: InviteCoApplicantPayload
  ): CoApplicantViewModel {
    const isBusiness = payload.invitationType === 'BUSINESS_INVITATION';
    const displayName = isBusiness
      ? payload.businessName ?? ''
      : `${payload.firstName} ${payload.lastName}`.trim();

    return {
      id: `optimistic-${this.generateOptimisticId()}`,
      displayName,
      email: payload.email,
      entityType: isBusiness ? 'business' : 'individual',
      source: 'invited',
      status: 'sending',
      businessName: isBusiness ? payload.businessName : undefined,
      businessType: isBusiness ? payload.businessType : undefined,
    };
  }

  private generateOptimisticId(): string {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random()}`;
  }

  private toInvitationSchema(p: InviteCoApplicantPayload): InvitationSchema {
    const base = {
      requestId: p.requestId,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      role: p.role,
    };
    if (p.invitationType === 'BUSINESS_INVITATION') {
      return {
        invitationType: 'BUSINESS_INVITATION',
        ...base,
        businessName: p.businessName ?? '',
        businessType: p.businessType as BusinessTypes,
        businessUniqueIdentifier: p.businessUniqueIdentifier,
        businessId: p.businessId,
        businessContactId: p.businessContactId,
      };
    }
    return { invitationType: 'USER_INVITATION', ...base };
  }

  cancelInvite(
    requestId: string,
    invitationId: string
  ): Observable<ApiMessage> {
    this.error.set(null);

    return this.invitationService
      .deleteRequestInvitation(requestId, invitationId)
      .pipe(
        switchMap(result =>
          this.loadCoApplicants(requestId).pipe(map(() => result))
        ),
        catchError(err => {
          this.error.set(this.toErrorMessage(err));
          return throwError(() => err);
        })
      );
  }

  // TODO: replace delete+recreate with a dedicated backend resend endpoint when available
  resendInvite(
    requestId: string,
    invitationId: string,
    email: string,
    firstName: string,
    lastName: string
  ): Observable<ApiMessage> {
    this.error.set(null);

    const payload: InviteCoApplicantPayload = {
      requestId,
      invitationType: 'USER_INVITATION',
      firstName,
      lastName,
      email,
      role: RequestUserRoles.CO_BORROWER,
    };

    return this.invitationService
      .deleteRequestInvitation(requestId, invitationId)
      .pipe(
        switchMap(() =>
          this.invitationService.createRequestInvitation(
            this.toInvitationSchema(payload)
          )
        ),
        switchMap(result =>
          this.loadCoApplicants(requestId).pipe(map(() => result))
        ),
        catchError(err => {
          this.error.set(this.toErrorMessage(err));
          return throwError(() => err);
        })
      );
  }

  removeCoApplicant(
    requestId: string,
    userId: string
  ): Observable<ApiMessage> {
    this.error.set(null);

    return this.workflowService.removeUserFromRequest(requestId, userId).pipe(
      switchMap(result =>
        this.loadCoApplicants(requestId).pipe(map(() => result))
      ),
      catchError(err => {
        this.error.set(this.toErrorMessage(err));
        return throwError(() => err);
      })
    );
  }

  private toViewModelFromUserConfirmed(user: RequestUser): CoApplicantViewModel {
    const isBusiness = this.isBusinessProfile(user);
    const businessProfile = isBusiness ? (user.profile as Business) : undefined;
    const email = (user.email ?? businessProfile?.email ?? '').trim();

    return {
      id: user.userId ?? '',
      userId: user.userId,
      displayName: this.buildDisplayName(user, businessProfile),
      email,
      entityType: isBusiness ? 'business' : 'individual',
      source: 'direct',
      status: 'accepted',
      role: user.userRole as RequestUserRoles,
      businessName: businessProfile?.name,
      businessType: businessProfile?.businessType,
    };
  }

  private toViewModelFromInvitation(
    invitation: ExistingRequestUserInvitationSchema
  ): CoApplicantViewModel {
    return {
      id: invitation.id,
      invitationId: invitation.id,
      displayName: `${invitation.firstName} ${invitation.lastName}`.trim(),
      email: invitation.email,
      entityType: 'individual',
      source: 'invited',
      status: 'pending',
      role: invitation.role,
    };
  }

  private buildDisplayName(
    user: RequestUser,
    businessProfile: Business | undefined
  ): string {
    if (businessProfile?.name) {
      return businessProfile.name;
    }

    const profile = user.profile as SharedViewUserProfile | undefined;
    const firstName = profile?.firstName ?? user.firstName ?? '';
    const lastName = profile?.lastName ?? user.lastName ?? '';
    const full = `${firstName} ${lastName}`.trim();
    return full || (user.email ?? '');
  }

  private isBusinessProfile(user: RequestUser): boolean {
    if (!user.profile) {
      return user.userType !== RequestUserTypes.INDIVIDUAL;
    }
    return 'businessType' in user.profile;
  }

  clearError() {
    this.error.set(null);
  }

  private toErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body?.message && typeof body.message === 'string') return body.message;
      if (body?.detail && typeof body.detail === 'string') return body.detail;
      return 'An unexpected error occurred';
    }
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      const message = (err as { message: unknown }).message;
      if (typeof message === 'string') return message;
    }
    return 'An unexpected error occurred';
  }
}
