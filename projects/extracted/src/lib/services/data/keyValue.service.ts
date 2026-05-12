import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ServiceConfiguration } from '../api/api.service';
import {
  KeyValuePair,
  KeyValueRecord,
  KeyValueRecordSingle,
} from './models/key-value.models';

@Injectable({
  providedIn: 'root',
})
export class KeyValueService {
  private apiService = inject(ApiService);

  private service: ServiceConfiguration;

  // Caching placeholders (disabled for now)
  // private cache: Map<string, KeyValueRecord> = new Map();
  // private lastFetchTime: number | undefined;

  constructor() {
    this.service = this.apiService.getEnvironmentConfiguration().APIs.Data;
  }

  public upsertKeyValues(items: KeyValuePair[]): Observable<void> {
    // Clear cache on upsert (when caching is enabled)
    // this.cache.clear();
    // this.lastFetchTime = undefined;

    return this.apiService.post<void>(this.service, '/kvstore', {
      payload: items,
    });
  }

  public upsertKeyValueForUser(
    userId: string,
    item: KeyValuePair
  ): Observable<void> {
    return this.apiService.post<void>(
      this.service,
      `/kvstore/users/${userId}`,
      {
        payload: [item],
      }
    );
  }

  public getKeyValueForUser(
    userId: string,
    key: string
  ): Observable<KeyValueRecord | null> {
    return this.apiService.post<KeyValueRecord | null>(
      this.service,
      `/kvstore/read_many/users/${userId}`,
      { keys: [key] }
    );
  }

  public getKeyValue(key: string): Observable<KeyValueRecordSingle | null> {
    // Check cache first (when caching is enabled)
    // if (this.cache.has(key)) {
    //   return of(this.cache.get(key)!);
    // }

    return this.apiService.get<KeyValueRecordSingle | null>(
      this.service,
      `/kvstore/${encodeURIComponent(key)}`
    );
  }

  public getMultipleKeyValues(keys: string[]): Observable<KeyValueRecord> {
    // Could implement batch caching here (when caching is enabled)
    // const cachedResults = keys
    //   .filter(key => this.cache.has(key))
    //   .map(key => this.cache.get(key)!);
    // const uncachedKeys = keys.filter(key => !this.cache.has(key));
    // if (uncachedKeys.length === 0) {
    //   return of(cachedResults);
    // }

    return this.apiService.post<KeyValueRecord>(
      this.service,
      '/kvstore/read_many',
      { keys }
    );
  }

  public deleteKeyValue(key: string): Observable<void> {
    // Remove from cache (when caching is enabled)
    // this.cache.delete(key);

    return this.apiService.delete<void>(
      this.service,
      `/kvstore/${encodeURIComponent(key)}`
    );
  }

  // Cache management methods (disabled for now)
  // public clearCache(): void {
  //   this.cache.clear();
  //   this.lastFetchTime = undefined;
  // }
}
