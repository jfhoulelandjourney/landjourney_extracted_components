import { Injectable, type OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Subject, type Observable } from 'rxjs';
import { ApiService, ServiceConfiguration } from '../api/api.service';
import {
  ApprovedTenantRequest,
  ApproveTenantRequestInput,
  EmailVerificationResponse,
  GetAllTenantRequestsResponse,
  TenantRequest,
  TenantRequestInput,
  UnauthenticatedTenantRequestInput,
  type CompleteSelfOnboardingRequestSchema,
  type SelfOnboardingRequestResponseSchema,
  type SelfOnboardingTenantRequest,
} from '../organization/tenant.models';
import { OrganizationUIConfiguration } from './organization.models';

@Injectable({
  providedIn: 'root',
})
export class TenantService implements OnDestroy {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  public readonly uiConfiguration$ =
    new BehaviorSubject<OrganizationUIConfiguration | null>(null);

  public readonly sharedDomainUiConfigurations$ = new BehaviorSubject<
    OrganizationUIConfiguration[]
  >([]);

  private destroy$ = new Subject<void>();

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.IAM;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // STANDARD TENANTS

  approveTenantRequest(
    input: ApproveTenantRequestInput
  ): Observable<ApprovedTenantRequest> {
    return this.apiService.post<ApprovedTenantRequest>(
      this.serviceConfiguration,
      `/management/requests/tenants/approve`,
      input
    );
  }

  createTenantRequest(input: TenantRequestInput): Observable<TenantRequest> {
    return this.apiService.post(
      this.serviceConfiguration,
      '/management/requests/tenants',
      input
    );
  }

  unauthenticatedCreateTenantRequest(
    input: UnauthenticatedTenantRequestInput
  ): Observable<TenantRequest> {
    return this.apiService.post(
      this.serviceConfiguration,
      '/tenant-requests ',
      input
    );
  }

  getAllTenantRequests(): Observable<GetAllTenantRequestsResponse> {
    return this.apiService.get<GetAllTenantRequestsResponse>(
      this.serviceConfiguration,
      '/management/requests/tenants'
    );
  }

  verifyEmail(token: string): Observable<EmailVerificationResponse> {
    return this.apiService.get(
      this.serviceConfiguration,
      '/tenant-requests/verify-email',
      {
        token,
      }
    );
  }

  // self onboarding

  initiatePayment(
    licenseId: string
  ): Observable<{ id: string; clientSecret: string }> {
    return this.apiService.post<{ id: string; clientSecret: string }>(
      this.serviceConfiguration,
      `/tenant-requests/self-onboarding/licenses/${licenseId}/initiate-payment`,
      {}
    );
  }

  createSelfOnboardingRequest(
    args: SelfOnboardingTenantRequest
  ): Observable<SelfOnboardingRequestResponseSchema> {
    return this.apiService.post<SelfOnboardingRequestResponseSchema>(
      this.serviceConfiguration,
      `/tenant-requests/self-onboarding`,
      args
    );
  }

  getSelfOnboardingRequestStatus(
    requestId: string
  ): Observable<SelfOnboardingRequestResponseSchema> {
    return this.apiService.get<SelfOnboardingRequestResponseSchema>(
      this.serviceConfiguration,
      `/tenant-requests/self-onboarding/${requestId}/status`
    );
  }

  completeSelfOnboarding(
    requestId: string,
    args: SelfOnboardingTenantRequest
  ): Observable<CompleteSelfOnboardingRequestSchema> {
    return this.apiService.post<CompleteSelfOnboardingRequestSchema>(
      this.serviceConfiguration,
      `/tenant-requests/self-onboarding/${requestId}/complete`,
      args
    );
  }
}
