import { inject, Injectable, type OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, type Observable } from 'rxjs';
import {
  ApiService,
  ServiceConfiguration,
  type ApiMessage,
} from '../api/api.service';
import type {
  ExistingPlatformLicenseSchema,
  PlatformLicenseBaseSchema,
} from './license.models';
import { OrganizationUIConfiguration } from './organization.models';

@Injectable({
  providedIn: 'root',
})
export class LicenseService implements OnDestroy {
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

  // SELF-ONBOARDING TENANTS

  getLicensesForSelfOnboarding(): Observable<ExistingPlatformLicenseSchema[]> {
    return this.apiService.get<ExistingPlatformLicenseSchema[]>(
      this.serviceConfiguration,
      `/platform/licenses/onboarding`
    );
  }

  // LICENSE MANAGEMENT

  getAllLicenses(): Observable<ExistingPlatformLicenseSchema[]> {
    return this.apiService.get<ExistingPlatformLicenseSchema[]>(
      this.serviceConfiguration,
      `/platform/licenses`
    );
  }

  getLicense(licenseId: string): Observable<ExistingPlatformLicenseSchema> {
    return this.apiService.get<ExistingPlatformLicenseSchema>(
      this.serviceConfiguration,
      `/platform/licenses/${licenseId}`
    );
  }

  createLicense(license: PlatformLicenseBaseSchema): Observable<ApiMessage> {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/platform/licenses`,
      license
    );
  }

  saveLicense(license: ExistingPlatformLicenseSchema): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/platform/licenses/${license.id}`,
      license
    );
  }

  deleteLicense(licenseId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/platform/licenses/${licenseId}`
    );
  }
}
