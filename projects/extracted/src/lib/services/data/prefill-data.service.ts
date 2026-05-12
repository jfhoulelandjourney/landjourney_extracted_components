import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { TimeUtil } from '../../utils/timeUtil';
import { ApiService, ServiceConfiguration } from '../api/api.service';
import { PrefillDataQuerySchema } from './models/prefill-data-unit-query.models';
import {
  BasePrefillDataUnitSchema,
  ExistingPrefillDataUnitSchema,
} from './models/prefill-data-unit.models';

@Injectable({
  providedIn: 'root',
})
export class PrefillDataService {
  private apiService = inject(ApiService);

  private service: ServiceConfiguration;

  private allUserPrefillData: ExistingPrefillDataUnitSchema[] = [];
  private lastPrefillFetchTime: number | undefined;

  constructor() {
    this.service = this.apiService.getEnvironmentConfiguration().APIs.Data;
  }

  public upsertPrefillData(
    data: BasePrefillDataUnitSchema[]
  ): Observable<void> {
    // clean the prefill data in case there's a rogue unnamed field
    const cleanedData = data.filter(
      item =>
        item.key !== null &&
        item.key !== undefined &&
        item.key.trim() !== '' &&
        !item.key.startsWith('newField')
    );

    if (cleanedData.length === 0) {
      return of(undefined);
    }

    return this.apiService.put<void>(this.service, '/prefill', cleanedData);
  }

  public searchPrefillData(
    query: PrefillDataQuerySchema
  ): Observable<ExistingPrefillDataUnitSchema[]> {
    const cleanedQuery: PrefillDataQuerySchema = {
      ...query,
      keys: query.keys?.filter(
        key =>
          key !== null &&
          key !== undefined &&
          key.trim() !== '' &&
          !key.startsWith('newField')
      ),
    };

    if (cleanedQuery.keys?.length === 0) {
      return of([]);
    }

    return this.apiService.post<ExistingPrefillDataUnitSchema[]>(
      this.service,
      '/prefill/search',
      cleanedQuery
    );
  }

  public getAllPrefillData(
    forceRefresh = false
  ): Observable<ExistingPrefillDataUnitSchema[]> {
    if (
      !forceRefresh &&
      this.lastPrefillFetchTime &&
      !TimeUtil.isExpired(this.lastPrefillFetchTime, 15 * 60)
    ) {
      return of(this.allUserPrefillData);
    }

    return this.apiService
      .get<ExistingPrefillDataUnitSchema[]>(this.service, '/prefill')
      .pipe(
        tap(response => {
          this.allUserPrefillData = response;
        })
      );
  }

  public getAllPrefillDataForUser(
    userId: string
  ): Observable<ExistingPrefillDataUnitSchema[]> {
    return this.apiService.get<ExistingPrefillDataUnitSchema[]>(
      this.service,
      `/prefill/users/${userId}/all`
    );
  }

  public getAllPrefillDataExcludedRepresentatives(): Observable<
    ExistingPrefillDataUnitSchema[]
  > {
    return this.apiService.get<ExistingPrefillDataUnitSchema[]>(
      this.service,
      '/prefill',
      {
        excluded_representatives: true,
      }
    );
  }

  public getAllPublicPrefillData(
    userId: string
  ): Observable<ExistingPrefillDataUnitSchema[]> {
    return this.apiService.get<ExistingPrefillDataUnitSchema[]>(
      this.service,
      `/prefill/users/${userId}/public`
    );
  }

  public grantAccessToPrefillDataForRepresentative(
    representativeUserId: string,
    dataUnitIds: string[]
  ): Observable<void> {
    return this.apiService.put(
      this.service,
      `/prefill/grant/representatives/${representativeUserId}`,
      dataUnitIds
    );
  }

  public revokeAccessToPrefillDataForRepresentative(
    representativeUserId: string
  ): Observable<void> {
    return this.apiService.delete<void>(
      this.service,
      `/prefill/revoke/representatives/${representativeUserId}`
    );
  }

  public deleteAllPrefillDataForCurrentUser(): Observable<void> {
    return this.apiService.delete<void>(this.service, '/prefill');
  }

  public deleteAllMatchingPrefillData(
    query: PrefillDataQuerySchema
  ): Observable<void> {
    return this.apiService.post<void>(this.service, '/prefill/delete', query);
  }
}
