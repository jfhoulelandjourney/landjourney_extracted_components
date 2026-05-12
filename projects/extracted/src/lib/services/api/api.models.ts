import { HttpParams } from '@angular/common/http';
import { isNil, omitBy } from 'es-toolkit';

export type ApiQueryParameters =
  | HttpParams
  | Record<
      string,
      string | number | boolean | readonly (string | number | boolean)[]
    >
  | undefined;

/**
 * The configuration object in the request
 * to pass pagination configuration to some services.
 */
export interface PaginatedApiQueryOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  sortDirection?: string;
  search?: string;
  retailerId?: string;
}

export type PaginatedResponse<T> = {
  items: T[];
  totalCount: number;
};

export function buildPaginatedApiQueryParams(
  options?: PaginatedApiQueryOptions | null
): Record<string, string | number> | null {
  const { page, pageSize, sort, sortDirection } = options ?? {};
  const obj = omitBy(
    {
      page,
      page_size: pageSize,
      sort,
      sort_direction: sortDirection,
    },
    isNil
  );
  return Object.keys(obj).length > 0 ? obj : null;
}

export function buildApiPathWithPagination(
  path: string,
  options?: PaginatedApiQueryOptions | null
): string {
  const params = buildPaginatedApiQueryParams(options);
  if (!params) {
    return path;
  }
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    qs.set(key, String(value));
  }
  return `${path}?${qs.toString()}`;
}

export function buildApiPathWithOptionalQuery(
  path: string,
  query: Record<string, string | undefined>
): string {
  const entries = Object.entries(query).filter(
    ([, v]) => v !== undefined && v !== ''
  );
  if (entries.length === 0) {
    return path;
  }
  const qs = new URLSearchParams();
  for (const [k, v] of entries) {
    qs.set(k, v as string);
  }
  return `${path}?${qs.toString()}`;
}

export class RequestState<T, E = Error> {
  readonly isIdle: boolean = true;
  readonly isResolved: boolean = false;
  readonly isSuccessful: boolean = false;
  readonly isFailed: boolean = false;
  readonly isPending: boolean = false;
  readonly data?: T;
  readonly error?: E;

  private constructor(state: Partial<RequestState<T, E>>) {
    Object.assign(this, state);
  }

  static create<T, E = Error>(): RequestState<T, E> {
    return new RequestState<T, E>({ isIdle: true });
  }

  static createResolved<T, E = Error>(
    props: { data: T } | { error: E }
  ): RequestState<T, E> {
    if ('data' in props) {
      return new RequestState<T, E>({
        isIdle: false,
        isResolved: true,
        isSuccessful: true,
        isFailed: false,
        data: props.data,
      });
    } else {
      return new RequestState<T, E>({
        isIdle: false,
        isResolved: true,
        isSuccessful: false,
        isFailed: true,
        error: props.error,
      });
    }
  }

  toJSON() {
    return {
      isIdle: this.isIdle,
      isSuccessful: this.isSuccessful,
      isFailed: this.isFailed,
      isPending: this.isPending,
      data: this.data,
      error: this.error,
    };
  }

  start() {
    return new RequestState<T, E>({
      ...this.toJSON(),
      isIdle: true,
      isResolved: false,
      isSuccessful: false,
      isFailed: false,
      isPending: false,
    });
  }

  succeed(data: T) {
    if (!this.isPending) {
      throw new Error('Cannot succeed a request that is not pending');
    }
    if (this.isFailed) {
      throw new Error('Cannot succeed a request that is errored');
    }
    return new RequestState<T, E>({
      isIdle: false,
      isPending: false,
      isSuccessful: true,
      isResolved: true,
      isFailed: false,
      data,
    });
  }

  fail(error: E) {
    if (!this.isPending) {
      throw new Error('Cannot error a request that is not pending');
    }
    if (this.isSuccessful) {
      throw new Error('Cannot error a request that is successful');
    }
    return new RequestState<T, E>({
      isIdle: false,
      isPending: false,
      isSuccessful: false,
      isResolved: true,
      isFailed: true,
      error,
    });
  }
}
