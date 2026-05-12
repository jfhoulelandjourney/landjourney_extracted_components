import { Injectable, inject } from '@angular/core';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

import { isNil, isUndefined, omitBy } from 'es-toolkit';
import { map, Observable } from 'rxjs';
import {
  PollExportBatchResponse,
  StartExportBatchResponse,
} from '../../models/exportData';
import type { RequestUserTypes as UserTypes } from '../../models/requestModels';
import { PaginatedApiQueryOptions } from '../api/api.models';
import {
  CreditLineStatementBaseSchema,
  DetailedCreditLineCompoundSchema,
  YearCreditLineHistoryOverviewSchema,
  type CreditLine,
} from './models/credit-lines.models';
import { UserOverviewSchema } from './models/lending-users.models';
import { UserRoles } from './models/lending.enums';
import {
  DetailedLoanCompoundSchema,
  LoanStatementBaseSchema,
  YearLoanHistoryOverviewSchema,
} from './models/loans.models';

@Injectable({
  providedIn: 'root',
})
export class LendingService {
  private apiService = inject(ApiService);

  private service: ServiceConfiguration;

  constructor() {
    this.service = this.apiService.getEnvironmentConfiguration().APIs.Lending;
  }

  public generateLoanData() {
    return this.apiService.post<void>(this.service, '/local-test', {});
  }

  public getLoans(options?: PaginatedApiQueryOptions | null): Observable<{
    items: DetailedLoanCompoundSchema[];
    totalCount: number;
  }> {
    const { pageSize, sortDirection, ...rest } = options ?? {};
    const obj = omitBy(
      {
        ...rest,
        pageSize: pageSize,
        sortDirection: sortDirection,
      },
      isNil
    );
    const params = Object.keys(obj).length > 0 ? obj : null;
    return this.apiService
      .get<{
        items: DetailedLoanCompoundSchema[];
        totalCount: number;
      }>(this.service, `/loans`, params)
      .pipe(
        map(response => {
          return response;
        })
      );
  }

  getCreditLines(options?: PaginatedApiQueryOptions | null): Observable<{
    items: DetailedCreditLineCompoundSchema[];
    totalCount: number;
  }> {
    const { pageSize, sortDirection, ...rest } = options ?? {};
    const obj = omitBy(
      {
        ...rest,
        pageSize: pageSize,
        sortDirection: sortDirection,
      },
      isNil
    );
    const params = Object.keys(obj).length > 0 ? obj : null;
    return this.apiService
      .get<{
        items: DetailedCreditLineCompoundSchema[];
        totalCount: number;
      }>(this.service, `/credit-lines`, params)
      .pipe(
        map(response => {
          return response;
        })
      );
  }

  public getUserOverview(
    options: PaginatedApiQueryOptions = {}
  ): Observable<UserOverviewSchema> {
    // Page size is used for the user credit history
    const { page, pageSize, ...rest } = options ?? {};

    const params = omitBy(
      {
        ...rest,
        page: page?.toString(),
        pageSize: pageSize?.toString(),
      },
      isUndefined
    );

    return this.apiService.get<UserOverviewSchema>(
      this.service,
      `/users/overview`,
      params
    );
  }

  getAllLoansForCurrentUser(): Observable<DetailedLoanCompoundSchema[]> {
    return this.apiService.get<DetailedLoanCompoundSchema[]>(
      this.service,
      `/loans/me`
    );
  }

  getAllCreditLinesForCurrentUser(): Observable<
    DetailedCreditLineCompoundSchema[]
  > {
    return this.apiService.get<DetailedCreditLineCompoundSchema[]>(
      this.service,
      `/credit-lines/me`
    );
  }

  getAllLoansForUser(userId: string): Observable<DetailedLoanCompoundSchema[]> {
    return this.apiService.get<DetailedLoanCompoundSchema[]>(
      this.service,
      `/loans/users/${userId}`
    );
  }

  getAllCreditLinesForUser(
    userId: string
  ): Observable<DetailedCreditLineCompoundSchema[]> {
    return this.apiService.get<DetailedCreditLineCompoundSchema[]>(
      this.service,
      `/credit-lines/users/${userId}`
    );
  }

  public getCreditLineById(
    creditLineId: string
  ): Observable<DetailedCreditLineCompoundSchema> {
    return this.apiService.get<DetailedCreditLineCompoundSchema>(
      this.service,
      `/credit-lines/${creditLineId}`
    );
  }

  public getLoanYearlyHistory(
    loanId: string,
    year: number
  ): Observable<YearLoanHistoryOverviewSchema> {
    return this.apiService.get<YearLoanHistoryOverviewSchema>(
      this.service,
      `/loans/${loanId}/history/years/${year}`
    );
  }

  public getLoanHistoryYearsAvailable(loanId: string): Observable<number[]> {
    return this.apiService.get<number[]>(
      this.service,
      `/loans/${loanId}/history/years`
    );
  }

  public getCreditLineYearlyHistory(
    creditLineId: string,
    year: number
  ): Observable<YearCreditLineHistoryOverviewSchema> {
    return this.apiService.get<YearCreditLineHistoryOverviewSchema>(
      this.service,
      `/credit-lines/${creditLineId}/history/years/${year}`
    );
  }

  public getCreditLineHistoryYearsAvailable(
    creditLineId: string
  ): Observable<number[]> {
    return this.apiService.get<number[]>(
      this.service,
      `/credit-lines/${creditLineId}/history/years`
    );
  }

  public getLoanById(loanId: string): Observable<DetailedLoanCompoundSchema> {
    return this.apiService.get<DetailedLoanCompoundSchema>(
      this.service,
      `/loans/${loanId}`
    );
  }

  public getLoanStatements(
    loanId: string,
    options: PaginatedApiQueryOptions = {}
  ): Observable<LoanStatementBaseSchema[]> {
    const { page, pageSize, sort, sortDirection, ...rest } = options ?? {};

    const params = omitBy(
      {
        ...rest,
        page: page?.toString(),
        pageSize: pageSize?.toString(),
        sort: sort,
        sortDirection: sortDirection,
      },
      isUndefined
    );

    return this.apiService.get<LoanStatementBaseSchema[]>(
      this.service,
      `/loans/${loanId}/statements`,
      params
    );
  }

  public getCreditLineStatements(
    creditLineId: string,
    options: PaginatedApiQueryOptions = {}
  ): Observable<CreditLineStatementBaseSchema[]> {
    const { page, pageSize, sort, sortDirection, ...rest } = options ?? {};

    const params = omitBy(
      {
        ...rest,
        page: page?.toString(),
        pageSize: pageSize?.toString(),
        sort: sort,
        sortDirection: sortDirection,
      },
      isUndefined
    );

    return this.apiService.get<CreditLineStatementBaseSchema[]>(
      this.service,
      `/credit-lines/${creditLineId}/statements`,
      params
    );
  }

  public createCreditLine(creditLine: CreditLine): Observable<ApiMessage> {
    return this.apiService.post<ApiMessage>(
      this.service,
      `/credit-lines/masterline`,
      creditLine
    );
  }

  // LOANS / CREDIT LINES USERS MANAGEMENT

  addUserToLoan(
    loanId: string,
    userId: string,
    role: UserRoles,
    userType: UserTypes
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.service,
      `/loans/${loanId}/users`,
      {
        userId,
        role,
        userType,
      }
    );
  }

  deleteUserFromLoan(loanId: string, userId: string): Observable<ApiMessage> {
    return this.apiService.delete<ApiMessage>(
      this.service,
      `/loans/${loanId}/users/${userId}`
    );
  }

  addUserToCreditLine(
    loanId: string,
    userId: string,
    role: UserRoles,
    userType: UserTypes
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.service,
      `/credit-lines/${loanId}/users`,
      {
        userId,
        role,
        userType,
      }
    );
  }

  deleteUserFromCreditLine(
    creditLineId: string,
    userId: string
  ): Observable<ApiMessage> {
    return this.apiService.delete<ApiMessage>(
      this.service,
      `/credit-lines/${creditLineId}/users/${userId}`
    );
  }

  // EXPORT DATA

  public startExportData() {
    return this.apiService.post<StartExportBatchResponse>(
      this.service,
      '/exports/batches?mode=local',
      {
        entities: [],
      }
    );
  }

  public getExportStatus(exportId: string) {
    return this.apiService.get<PollExportBatchResponse>(
      this.service,
      `/exports/batches/${exportId}/status`
    );
  }
}
