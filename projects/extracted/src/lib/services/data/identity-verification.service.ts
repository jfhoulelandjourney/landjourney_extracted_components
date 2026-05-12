import { Injectable, inject } from '@angular/core';
import {
  catchError,
  expand,
  filter,
  Observable,
  of,
  switchMap,
  take,
  timer,
} from 'rxjs';
import { ApiService, ServiceConfiguration } from '../api/api.service';
import type {
  CustomerSchema,
  IdentityVerificationBackofficeResponse,
  IdentityVerificationInput,
  IdentityVerificationStatusResponse,
  IdentityVerificationVerifyResponse,
} from './models/identity-verification.models';
import { AuthenticateStatuses } from './models/identity-verification.models';

@Injectable({
  providedIn: 'root',
})
export class IdentityVerificationService {
  private apiService = inject(ApiService);

  private service: ServiceConfiguration;

  constructor() {
    this.service = this.apiService.getEnvironmentConfiguration().APIs.Data;
  }

  /**
   * Check if the current user has been previously verified.
   * GET /identity-verification (customer endpoint)
   * Returns CustomerSchema with only status field.
   */
  public isUserPreviouslyVerified(): Observable<CustomerSchema> {
    return this.apiService
      .get<CustomerSchema>(this.service, '/identity-verification')
      .pipe(
        catchError(() =>
          of({ status: AuthenticateStatuses.NOT_PERFORMED } as CustomerSchema)
        )
      );
  }

  /**
   * Get full identity verification data for a specific user (backoffice endpoint).
   * GET /identity-verification/{organizationUserId}
   * Returns full AuthenticateResponseSchema with test result data.
   */
  public getIdentityVerificationData(
    organizationUserId: string
  ): Observable<IdentityVerificationBackofficeResponse> {
    return this.apiService.get<IdentityVerificationBackofficeResponse>(
      this.service,
      `/identity-verification/${organizationUserId}`
    );
  }

  /**
   * Save a manual identity verification (backoffice action).
   * POST /identity-verification/{organizationUserId}
   * Returns 200 OK with empty body.
   */
  public saveManualIdentityVerification(
    organizationUserId: string
  ): Observable<void> {
    return this.apiService.post<void>(
      this.service,
      `/identity-verification/${organizationUserId}`,
      {}
    );
  }

  /**
   * Verify identity - complete flow: start verification and poll for results.
   * POST /extern with operation='verify', then poll with operation='status'.
   * Returns the final status response or null on error.
   */
  public verify(
    data: IdentityVerificationInput
  ): Observable<IdentityVerificationStatusResponse | null> {
    return this.apiService
      .post<IdentityVerificationVerifyResponse>(
        this.service,
        '/extern',
        {
          vendor: 'ID_VALIDATION',
          operation: 'verify',
          data,
        },
        false,
        false
      )
      .pipe(
        switchMap(response => {
          // Verify operation returns ValidResponse with correlationId
          if (!response || !response.correlationId) {
            return of(null);
          }

          // Start polling for status
          return this.apiService
            .post<IdentityVerificationStatusResponse>(
              this.service,
              '/extern',
              {
                vendor: 'ID_VALIDATION',
                operation: 'status',
                data: {
                  organizationUserId: data.organizationUserId,
                  correlationId: response.correlationId,
                  idDocumentType: data.idDocumentType ?? 'PASSPORT',
                },
              },
              false,
              false
            )
            .pipe(
              expand(statusResp =>
                statusResp.status === AuthenticateStatuses.IN_PROGRESS
                  ? timer(1000).pipe(
                      switchMap(() =>
                        this.apiService.post<IdentityVerificationStatusResponse>(
                          this.service,
                          '/extern',
                          {
                            vendor: 'ID_VALIDATION',
                            operation: 'status',
                            data: {
                              organizationUserId: data.organizationUserId,
                              correlationId: response.correlationId,
                              idDocumentType: data.idDocumentType ?? 'PASSPORT',
                            },
                          },
                          false,
                          false
                        )
                      )
                    )
                  : of(statusResp)
              ),
              // Only emit when status is not IN_PROGRESS
              filter(
                statusResp =>
                  statusResp.status !== AuthenticateStatuses.IN_PROGRESS
              ),
              take(1),
              catchError(() => of(null))
            );
        }),
        catchError(() => of(null))
      );
  }
}
