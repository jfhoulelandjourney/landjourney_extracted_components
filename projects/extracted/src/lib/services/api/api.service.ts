import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  ObservableInput,
  Subject,
  catchError,
  map,
  of,
  retry,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { isNonNullable } from '../../utils/nullishUtil';
import * as StringUtil from '../../utils/stringUtil';
import { CacheService } from '../cache/cache.service';
import { EnvironmentService } from '../environment/environment.service';
import { ApiQueryParameters } from './api.models';

// TODO: Add a replay interceptor
// https://docs.openreplay.com/en/using-or/angular/

export class ServiceConfiguration {
  private name: string;
  private host: string;
  private port: string;
  private basePath = '';

  private baseServiceUrl = '';

  constructor(name: string, host: string, port = '443', basePath = '') {
    this.name = name;
    this.host = host;
    this.port = port;
    this.basePath = basePath;
  }

  getBaseServiceUrl(websocket = false): string {
    const protocol = websocket ? 'wss' : 'https';

    if (this.baseServiceUrl === '') {
      this.baseServiceUrl = `${protocol}://${this.host}`;

      if (this.port !== '') {
        this.baseServiceUrl = `${this.baseServiceUrl}:${this.port}`;
      }

      if (this.basePath !== '') {
        this.baseServiceUrl = `${this.baseServiceUrl}/${this.basePath}`;
      }
    }

    return this.baseServiceUrl;
  }
}

export interface APIConfiguration {
  Data: ServiceConfiguration;
  IAM: ServiceConfiguration;
  Workflows: ServiceConfiguration;
  Documents: ServiceConfiguration;
  Messaging: ServiceConfiguration;
  Discussion: ServiceConfiguration;
  Lending: ServiceConfiguration;
  Credit: ServiceConfiguration;
  Products: ServiceConfiguration;
}

export interface Environment {
  APIs: APIConfiguration;
}

export class Environments {
  static local: Environment = {
    APIs: {
      Data: new ServiceConfiguration('Data', 'local.landjourney.ai', '8006'),
      IAM: new ServiceConfiguration('IAM', 'local.landjourney.ai', '8000'),
      Workflows: new ServiceConfiguration(
        'Workflows',
        'local.landjourney.ai',
        '8002'
      ),
      Documents: new ServiceConfiguration(
        'Documents',
        'local.landjourney.ai',
        '8001'
      ),
      Messaging: new ServiceConfiguration(
        'Realtime',
        'ppp6dj9vqf.execute-api.us-east-1.amazonaws.com/test/',
        //'socket-test.landjourney.ai/messaging/',
        ''
      ),
      Discussion: new ServiceConfiguration(
        'Messaging',
        'local.landjourney.ai',
        '8004'
      ),
      Lending: new ServiceConfiguration(
        'Lending',
        'local.landjourney.ai',
        '8005'
      ),
      Credit: new ServiceConfiguration('Credit', '0.0.0.0', '8008'),
      Products: new ServiceConfiguration(
        'Products',
        'local.landjourney.ai',
        '8007'
      ),
    },
  };

  static integration: Environment = {
    APIs: {
      Data: new ServiceConfiguration(
        'Data',
        'api-integration.landjourney.ai',
        '443',
        'data'
      ),
      IAM: new ServiceConfiguration(
        'IAM',
        'api-integration.landjourney.ai',
        '443',
        'iam'
      ),
      Workflows: new ServiceConfiguration(
        'Workflows',
        'api-integration.landjourney.ai',
        '443',
        'workflows'
      ),
      Documents: new ServiceConfiguration(
        'Documents',
        'api-integration.landjourney.ai',
        '443',
        'documents'
      ),
      Messaging: new ServiceConfiguration(
        'Realtime',
        'mm80b9zhu4.execute-api.us-east-1.amazonaws.com/integration/',
        '',
        ''
      ),
      Discussion: new ServiceConfiguration(
        'Messaging',
        'api-integration.landjourney.ai',
        '443',
        'messaging'
      ),
      Lending: new ServiceConfiguration(
        'Lending',
        'api-integration.landjourney.ai',
        '443',
        'lending'
      ),
      Credit: new ServiceConfiguration(
        'Credit',
        'api-integration.landjourney.ai',
        '443',
        'credit'
      ),
      Products: new ServiceConfiguration(
        'Products',
        'api-integration.landjourney.ai',
        '443',
        'products'
      ),
    },
  };

  static test: Environment = {
    APIs: {
      Data: new ServiceConfiguration(
        'Data',
        'api-test.landjourney.ai',
        '443',
        'data'
      ),
      IAM: new ServiceConfiguration(
        'IAM',
        'api-test.landjourney.ai',
        '443',
        'iam'
      ),
      Workflows: new ServiceConfiguration(
        'Workflows',
        'api-test.landjourney.ai',
        '443',
        'workflows'
      ),
      Documents: new ServiceConfiguration(
        'Documents',
        'api-test.landjourney.ai',
        '443',
        'documents'
      ),
      Messaging: new ServiceConfiguration(
        'Realtime',
        'ppp6dj9vqf.execute-api.us-east-1.amazonaws.com/test/',
        '',
        ''
      ),
      Discussion: new ServiceConfiguration(
        'Messaging',
        'api-test.landjourney.ai',
        '443',
        'messaging'
      ),
      Lending: new ServiceConfiguration(
        'Lending',
        'api-test.landjourney.ai',
        '443',
        'lending'
      ),
      Credit: new ServiceConfiguration(
        'Credit',
        'api-test.landjourney.ai',
        '443',
        'credit'
      ),
      Products: new ServiceConfiguration(
        'Products',
        'api-test.landjourney.ai',
        '443',
        'products'
      ),
    },
  };

  static production: Environment = {
    APIs: {
      Data: new ServiceConfiguration(
        'Data',
        'api.landjourney.ai',
        '443',
        'data'
      ),
      IAM: new ServiceConfiguration('IAM', 'api.landjourney.ai', '443', 'iam'),
      Workflows: new ServiceConfiguration(
        'Workflows',
        'api.landjourney.ai',
        '443',
        'workflows'
      ),
      Documents: new ServiceConfiguration(
        'Documents',
        'api.landjourney.ai',
        '443',
        'documents'
      ),
      Messaging: new ServiceConfiguration(
        'Realtime',
        'y9mthktj0d.execute-api.us-east-1.amazonaws.com/production/',
        //'socket.landjourney.ai/messaging/',
        ''
      ),
      Discussion: new ServiceConfiguration(
        'Messaging',
        'api.landjourney.ai',
        '443',
        'messaging'
      ),
      Lending: new ServiceConfiguration(
        'Lending',
        'api.landjourney.ai',
        '443',
        'lending'
      ),
      Credit: new ServiceConfiguration(
        'Credit',
        'api.landjourney.ai',
        '443',
        'credit'
      ),
      Products: new ServiceConfiguration(
        'Products',
        'api.landjourney.ai',
        '443',
        'products'
      ),
    },
  };
}

export enum LandjourneyAgents {
  MOBILE = 'mobile',
  WEB = 'web',
}

export interface ApiMessage {
  status_code?: number;
  message?: string;
  id?: string;
  digest?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private httpClient = inject(HttpClient);
  private cacheService = inject(CacheService);
  private environmentService = inject(EnvironmentService);

  public errorMessages = new Subject<ApiMessage>();
  public landjourneyAgent: LandjourneyAgents = LandjourneyAgents.MOBILE;
  public organizationKey: string | null = null;
  private sessionId!: string;

  readonly activity = new Subject<void>();

  constructor() {
    this.assignSessionId();
  }

  private assignSessionId(): void {
    this.sessionId =
      sessionStorage.getItem('sessionId') || StringUtil.getUUID4();
    sessionStorage.setItem('sessionId', this.sessionId);
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getEnvironmentConfiguration(): Environment {
    return Environments[this.environmentService.getEnvironment()];
  }

  public getEnvironmentName(): string {
    return this.environmentService.getEnvironment();
  }

  getOrganizationKeyFromHost(): string {
    let organizationKey =
      window.location.hostname.split('.')[0]?.toLowerCase() ?? 'app';

    if (['backoffice', 'app', 'mobile'].includes(organizationKey)) {
      organizationKey = 'root';
    }

    return organizationKey;
  }

  public handleError(error: HttpErrorResponse, showErrorMessage = true) {
    let internalShowErrorMessage = true;

    if (error?.status !== 0) {
      if ([error?.error?.statusCode, error?.status].includes(401)) {
        showErrorMessage = false;
        localStorage.removeItem('token');
        localStorage.removeItem('compressedToken');
      }

      if ([error?.error?.statusCode, error?.status].includes(403)) {
        internalShowErrorMessage = false;
      }

      if (error?.status === 404 || error?.error?.statusCode === 404) {
        if (this.errorMessages) {
          // TODO: Reactivate once the dynamic form issue keeping track of templates VS ad hoc (task-documents.component.ts:303 is fixed)
          // this.errorMessages.next({
          //   status_code: 404,
          //   message: 'The requested resource was not found.',
          // });
        } else {
          console.error('Unable to post error in topic.');
        }
      }
    }

    if (this.errorMessages && internalShowErrorMessage) {
      if (Object.keys(error.error).includes('message')) {
        if (showErrorMessage) {
          this.errorMessages.next({
            status_code: error?.status || error?.error?.status || 0,
            message: error.error.message,
          });
        }
      } else {
        if (showErrorMessage) {
          console.error(error);
          this.errorMessages.next({
            status_code: error?.status || error?.error?.status || 0,
            message: 'An error happened when executing the request.',
          });
        }
      }
    } else {
      console.error('Unable to post error in topic.');
    }

    return throwError(
      () =>
        new Error(
          'Something went wrong. Unable to get a proper response from the API.'
        )
    );
  }

  private addLoadingAnimation(): void {
    document.body.classList.add('applicationIsLoading');
    const $progressLineCollection =
      document.getElementsByClassName('progress-line');
    if ($progressLineCollection.length > 0) {
      $progressLineCollection[0]?.classList.add('progress-line-visible');
    }
  }

  private removeLoadingAnimation(): void {
    document.body.classList.remove('applicationIsLoading');
    const $progressLineCollection =
      document.getElementsByClassName('progress-line');
    if ($progressLineCollection.length > 0) {
      $progressLineCollection[0]?.classList.remove('progress-line-visible');
    }
  }

  private getFullUrl(
    serviceConfiguration: ServiceConfiguration,
    path: string,
    queryParams?: Record<string, unknown>
  ): string {
    let fullUrl = `${serviceConfiguration.getBaseServiceUrl()}${path}`;

    if (queryParams && Object.keys(queryParams).length > 0) {
      const paramsList: Array<string> = [];

      for (const key of Object.keys(queryParams)) {
        paramsList.push(`${key}=${queryParams[key]}`);
      }

      fullUrl = `${fullUrl}?${paramsList.join('&')}`;
    }

    return fullUrl;
  }

  private getHeaders(): HttpHeaders {
    let headers: HttpHeaders | null = null;
    let token = localStorage.getItem('compressedToken');
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (this.organizationKey) {
      headers = new HttpHeaders({
        authorization: token ? `Bearer ${token}` : '',
        'x-landjourney-agent': this.landjourneyAgent,
        'x-organization': this.organizationKey,
        'x-session-id': this.getSessionId(),
        'x-landjourney-app-type':
          this.environmentService.getAppType() ?? 'unknown',
      });
    } else {
      headers = new HttpHeaders({
        authorization: token ? `Bearer ${token}` : '',
        'x-landjourney-agent': this.landjourneyAgent,
        'x-session-id': this.getSessionId(),
        'x-landjourney-app-type':
          this.environmentService.getAppType() ?? 'unknown',
      });
    }

    return headers;
  }

  public requestReady() {
    return this.environmentService.getAppType() !== undefined;
  }

  public invalidateCacheByPrefix(prefix: string) {
    this.cacheService.invalidateCacheByPrefix(prefix);
  }

  public get<ResponseType>(
    service: ServiceConfiguration,
    path: string,
    queryParams: ApiQueryParameters | null = null,
    bypassCacheOrOptions?:
      | {
          bypassCache?: boolean;
          showErrorMessage?: boolean;
          retries?: number;
        }
      | boolean
  ): Observable<ResponseType> {
    const fullUrl = this.getFullUrl(service, path);
    const bypassCache =
      typeof bypassCacheOrOptions === 'boolean'
        ? bypassCacheOrOptions
        : (bypassCacheOrOptions?.bypassCache ?? true);
    const showErrorMessage =
      typeof bypassCacheOrOptions === 'boolean'
        ? true
        : (bypassCacheOrOptions?.showErrorMessage ?? true);
    const retries =
      typeof bypassCacheOrOptions === 'boolean'
        ? 3
        : (bypassCacheOrOptions?.retries ?? 3);

    if (bypassCache) {
      this.invalidateCacheByPrefix(this.getFullUrl(service, path));
    } else {
      const cacheValue = this.cacheService.get(fullUrl);

      if (isNonNullable(cacheValue)) {
        return of(cacheValue as ResponseType);
      }
    }

    this.addLoadingAnimation();

    return this.httpClient
      .get<ResponseType>(fullUrl, {
        headers: this.getHeaders(),
        params: queryParams ?? undefined,
      })
      .pipe(
        retry({
          count: retries,
          delay: (err, retryCount) => {
            switch (err.status) {
              case 408:
              case 500:
              case 502:
              case 503:
              case 504:
                return timer(1000 * (retryCount * retryCount));
              default:
                return throwError(() => err);
            }
          },
        }),
        tap(() => {
          this.removeLoadingAnimation();
        }),
        catchError(
          (
            error,
            _caught: Observable<ResponseType>
          ): ObservableInput<ResponseType> => {
            this.handleError(error, showErrorMessage);
            return throwError(() => error);
          }
        )
      )
      .pipe(
        tap(data => {
          if (!bypassCache) {
            this.cacheService.put(fullUrl, data);
          }
        })
      );
  }

  public head(
    service: ServiceConfiguration,
    path: string,
    queryParams: ApiQueryParameters | null = null,
    bypassCache = true
  ): Observable<boolean> {
    this.activity.next();

    const fullUrl = this.getFullUrl(service, path);

    if (bypassCache) {
      this.invalidateCacheByPrefix(this.getFullUrl(service, path));
    } else {
      const cacheValue = this.cacheService.get(fullUrl);

      if (isNonNullable(cacheValue)) {
        return of(cacheValue as boolean);
      }
    }

    this.addLoadingAnimation();

    return this.httpClient
      .head(fullUrl, {
        headers: this.getHeaders(),
        params: queryParams ?? undefined,
        observe: 'response',
      })
      .pipe(
        retry({
          count: 2,
          delay: (err, retryCount) => {
            switch (err.status) {
              case 408:
              case 500:
              case 502:
              case 503:
              case 504:
                return timer(1000 * (retryCount * retryCount));
              default:
                return throwError(() => err);
            }
          },
        }),
        map(response => {
          this.removeLoadingAnimation();
          return response.status >= 200 && response.status < 300;
        }),
        catchError(
          (error, _caught: Observable<boolean>): ObservableInput<boolean> => {
            this.removeLoadingAnimation();
            if (error.status === 404) {
              return of(false);
            }
            return throwError(() => error);
          }
        )
      );
  }

  public download(
    service: ServiceConfiguration,
    path: string,
    body: unknown,
    filename = 'Download.pdf'
  ) {
    this.activity.next();
    this.addLoadingAnimation();

    const headers = this.getHeaders();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Accept', 'application/pdf');
    headers.set('Cache-Control', 'no-cache');

    return this.httpClient
      .post(this.getFullUrl(service, path), body, {
        headers: headers,
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        retry({
          count: 2,
          delay: (err, retryCount) => {
            switch (err.status) {
              case 408:
              case 500:
              case 502:
              case 503:
              case 504:
                return timer(1000 * (retryCount * retryCount));
              default:
                return throwError(() => err);
            }
          },
        }),
        map((data: HttpResponse<Blob>) => {
          this.removeLoadingAnimation();
          this.handleDownloadSuccess(filename, data);
          return data;
        }),
        catchError(
          (
            error,
            _caught: Observable<HttpResponse<Blob>>
          ): ObservableInput<HttpResponse<Blob>> => {
            this.handleError(error);
            return throwError(() => error);
          }
        )
      );
  }

  public post<ReturnType, BodyType = unknown>(
    service: ServiceConfiguration,
    path: string,
    body: BodyType,
    reportProgress = false,
    showErrorMessage = true
  ): Observable<ReturnType> {
    this.activity.next();

    this.addLoadingAnimation();

    return this.httpClient
      .post<ReturnType>(this.getFullUrl(service, path), body, {
        headers: this.getHeaders(),
        reportProgress: reportProgress,
      })
      .pipe(
        retry({
          count: 2,
          delay: (err, retryCount) => {
            switch (err.status) {
              case 408:
              case 500:
              case 502:
              case 503:
              case 504:
                return timer(1000 * (retryCount * retryCount));
              default:
                return throwError(() => err);
            }
          },
        }),
        map(data => {
          this.removeLoadingAnimation();
          return data;
        }),
        catchError(
          (
            error,
            _caught: Observable<ReturnType>
          ): ObservableInput<ReturnType> => {
            this.handleError(error, showErrorMessage);
            return throwError(() => error);
          }
        )
      );
  }

  public put<ResponseType, BodyType = unknown>(
    service: ServiceConfiguration,
    path: string,
    body: BodyType,
    reportProgress = false
  ): Observable<ResponseType> {
    this.activity.next();

    this.addLoadingAnimation();

    return this.httpClient
      .put<ResponseType>(this.getFullUrl(service, path), body, {
        headers: this.getHeaders(),
        reportProgress: reportProgress,
      })
      .pipe(
        retry({
          count: 2,
          delay: (err, retryCount) => {
            switch (err.status) {
              case 408:
              case 500:
              case 502:
              case 503:
              case 504:
                return timer(1000 * (retryCount * retryCount));
              default:
                return throwError(() => err);
            }
          },
        }),
        map(data => {
          this.removeLoadingAnimation();
          return data;
        }),
        catchError(
          (
            error,
            _caught: Observable<ResponseType>
          ): ObservableInput<ResponseType> => {
            this.handleError(error);
            return throwError(() => error);
          }
        )
      );
  }

  public patch<ResponseType, BodyType = unknown>(
    service: ServiceConfiguration,
    path: string,
    body: BodyType
  ): Observable<ResponseType> {
    this.activity.next();

    this.addLoadingAnimation();

    return this.httpClient
      .patch<ResponseType>(this.getFullUrl(service, path), body, {
        headers: this.getHeaders(),
      })
      .pipe(
        retry({
          count: 2,
          delay: (err, retryCount) => {
            switch (err.status) {
              case 408:
              case 500:
              case 502:
              case 503:
              case 504:
                return timer(1000 * (retryCount * retryCount));
              default:
                return throwError(() => err);
            }
          },
        }),
        map(data => {
          this.removeLoadingAnimation();
          return data;
        }),
        catchError(
          (
            error,
            _caught: Observable<ResponseType>
          ): ObservableInput<ResponseType> => {
            this.handleError(error);
            return throwError(() => error);
          }
        )
      );
  }

  public delete<ReturnType>(
    service: ServiceConfiguration,
    path: string
  ): Observable<ReturnType> {
    this.activity.next();

    this.addLoadingAnimation();

    return this.httpClient
      .delete<ReturnType>(this.getFullUrl(service, path), {
        headers: this.getHeaders(),
      })
      .pipe(
        retry({
          count: 2,
          delay: (err, retryCount) => {
            switch (err.status) {
              case 408:
              case 500:
              case 502:
              case 503:
              case 504:
                return timer(1000 * (retryCount * retryCount));
              default:
                return throwError(() => err);
            }
          },
        }),
        map(data => {
          this.removeLoadingAnimation();
          return data;
        }),
        catchError(
          (
            error,
            _caught: Observable<ReturnType>
          ): ObservableInput<ReturnType> => {
            this.handleError(error);
            return throwError(() => error);
          }
        )
      );
  }

  handleDownloadSuccess(filename: string, response: HttpResponse<Blob>) {
    const a = document.createElement('a');
    const blob = response.body;

    if (!blob) {
      return;
    }

    a.style.display = 'none';
    a.href = window.URL.createObjectURL(blob);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(a.href);
  }
}
