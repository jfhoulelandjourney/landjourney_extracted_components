import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  defer,
  finalize,
  from,
  type Observable,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { EnvironmentService } from '../../../services/environment/environment.service';
import { IAMService } from '../../../services/identity/iam.service';

export type PdfDocumentSource = string | File | ArrayBuffer | undefined;

@Injectable({
  providedIn: 'root',
})
export class PdfViewerService {
  // DEPENDENCIES
  private http = inject(HttpClient);
  private iamService = inject(IAMService);
  private environmentService = inject(EnvironmentService);

  // PUBLIC API
  fetching = signal<boolean>(false);
  licenseKey = signal(this.environmentService.getPsPdfKey());

  // INTERNAL STATE
  private fileFetchCache = new Map<string, Observable<ArrayBuffer>>();

  getUserEmail(): string | undefined {
    return this.iamService.getActiveUser()?.email;
  }

  appendParameters(
    originalUrl: string,
    parameters: Record<string, string>
  ): string {
    try {
      const baseUrl = window.location.origin;
      const url = new URL(originalUrl, baseUrl);

      Object.entries(parameters).forEach(([key, value]) => {
        url.searchParams.delete(key); // Clear existing parameter if it exists
        url.searchParams.set(key, value); // Append new parameter
      });

      // 5. Return the new URL string, ensuring we strip the origin if the
      // original was a path.
      // If the original URL was a full URL or protocol-relative, url.href is correct.
      // If originalUrl was a path (e.g., '/api/data' or 'assets/img.png'),
      // url.href will be 'https://current.origin/api/data?_t=...'
      // We need to return the path part if that was the original format.

      const isPathOnly =
        originalUrl.startsWith('/') ||
        (!originalUrl.includes('://') && !originalUrl.startsWith('//'));

      if (isPathOnly && url.href.startsWith(baseUrl)) {
        return url.href.substring(baseUrl.length);
      }

      return url.href;
    } catch (e: unknown) {
      console.error(`Error parsing or manipulating URL "${originalUrl}":`, e);
      // Fallback: If parsing fails, return the original URL with a basic timestamp appended.
      // This is a less robust fallback but prevents app crash.
      return `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    }
  }

  /**
   * Processes the input `file` source (string URL, File object, or ArrayBuffer)
   * into a Promise resolving to an `ArrayBuffer`.
   */
  processFileSource(
    source: PdfDocumentSource,
    forceReload = false
  ): Observable<ArrayBuffer | null> {
    if (source === undefined) {
      return of(null); // No file to process
    }

    if (typeof source === 'string') {
      return this.fetchFileAsArrayBuffer(source, forceReload);
    }

    if (source instanceof ArrayBuffer) {
      if (forceReload) {
        return of(new ArrayBuffer(source.byteLength)); // Force a new ArrayBuffer instance
      }
      return of(source);
    }

    if (source instanceof File) {
      return defer(
        () =>
          new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
              } else {
                reject(new Error('FileReader did not return an ArrayBuffer.'));
              }
            };
            reader.onerror = error => {
              console.error('FileReader error: ', error);
              reject(new Error('Failed to read file as ArrayBuffer.'));
            };
            reader.readAsArrayBuffer(source);
          })
      );
    }

    return from(Promise.reject(new Error('Unsupported file source type.')));
  }

  fetchFileAsArrayBuffer(url: string, force = false): Observable<ArrayBuffer> {
    if (!force && this.fileFetchCache.has(url)) {
      const response = this.fileFetchCache.get(url);
      if (response) {
        return response;
      }
    }

    if (force) {
      this.invalidateFileCache(url);
    }

    this.fetching.set(true);
    const fetchObservable = this.http
      .get(url, { responseType: 'arraybuffer' })
      .pipe(
        tap(() => this.fetching.set(false)),
        shareReplay({ refCount: false, bufferSize: 1 }),
        finalize(() => {
          this.fetching.set(false);
        })
      );

    this.fileFetchCache.set(url, fetchObservable);
    return fetchObservable;
  }

  invalidateFileCache(url: string) {
    this.fileFetchCache.delete(url);
  }

  clearCache() {
    this.fileFetchCache.clear();
  }
}
