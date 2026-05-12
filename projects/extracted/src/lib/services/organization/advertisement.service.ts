import { Injectable, type OnDestroy } from '@angular/core';
import { type Observable, Subject } from 'rxjs';
import { type ApiQueryParameters } from '../api/api.models';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import { Advertisement } from './advertisement.model';
import { OrganizationService } from './organization.service';

@Injectable({
  providedIn: 'root',
})
export class AdvertisementService implements OnDestroy {
  private serviceConfiguration: ServiceConfiguration;
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private organizationService: OrganizationService
  ) {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.IAM;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get all advertisements for the current organization.
   * @param searchTerm - Optional search term to filter advertisements
   * @returns Observable of Advertisement array
   */
  getAllAdvertisements(searchTerm?: string): Observable<Advertisement[]> {
    const organizationId = this.organizationService.getOrganizationId();
    const queryParams: ApiQueryParameters = {};
    if (searchTerm) {
      queryParams.search_term = searchTerm;
    }

    return this.apiService.get<Advertisement[]>(
      this.serviceConfiguration,
      `/organizations/${organizationId}/advertisements`,
      queryParams
    );
  }

  /**
   * Creates a new advertisement for the current organization.
   * @param advertisement - The advertisement data (without id)
   * @returns Observable with created advertisement (including id)
   */
  createAdvertisement(
    advertisement: Omit<Advertisement, 'id'>
  ): Observable<Advertisement> {
    const organizationId = this.organizationService.getOrganizationId();
    return this.apiService.post<Advertisement>(
      this.serviceConfiguration,
      `/organizations/${organizationId}/advertisements`,
      advertisement
    );
  }

  /**
   * Updates an existing advertisement for the current organization.
   * @param advertisementId - The advertisement ID
   * @param advertisement - The updated advertisement data
   * @returns Observable with API message
   */
  updateAdvertisement(
    advertisementId: string,
    advertisement: Advertisement
  ): Observable<ApiMessage> {
    const organizationId = this.organizationService.getOrganizationId();
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${organizationId}/advertisements/${advertisementId}`,
      advertisement
    );
  }

  /**
   * Deletes an advertisement for the current organization.
   * @param advertisementId - The advertisement ID
   * @returns Observable with API message
   */
  deleteAdvertisement(advertisementId: string): Observable<ApiMessage> {
    const organizationId = this.organizationService.getOrganizationId();
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${organizationId}/advertisements/${advertisementId}`
    );
  }
}
