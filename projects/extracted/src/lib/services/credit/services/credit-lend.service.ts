import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  buildApiPathWithOptionalQuery,
  buildApiPathWithPagination,
  type PaginatedApiQueryOptions,
  type PaginatedResponse,
} from '../../api/api.models';
import {
  ApiMessage,
  ApiService,
  type ServiceConfiguration,
} from '../../api/api.service';
import type {
  Lend,
  LendAmountsHistory,
  LendCollateral,
  LendDrawRequest,
  LendFee,
  LendFundingEntity,
  LendInsurance,
  LendNote,
  LendReview,
  LendRiskScoresMonitoring,
  LendRiskScoresMonitoringOverview,
  LendSearchParams,
  LendStatement,
  LendUser,
} from '../credit.models';

type LendCreateBody = Omit<
  Lend,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendUserCreateBody = Omit<
  LendUser,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendStatementCreateBody = Omit<
  LendStatement,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendReviewCreateBody = Omit<
  LendReview,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendNoteCreateBody = Omit<LendNote, 'id' | 'createdAt' | 'updatedAt'>;
type LendInsuranceCreateBody = Omit<
  LendInsurance,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendFundingEntityCreateBody = Omit<
  LendFundingEntity,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendFeeCreateBody = Omit<
  LendFee,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendDrawRequestCreateBody = Omit<
  LendDrawRequest,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendCollateralCreateBody = Omit<
  LendCollateral,
  'id' | 'createdAt' | 'updatedAt' | 'disabled' | 'disabledDate' | 'disabledReason'
>;
type LendRiskOverviewCreateBody = Omit<
  LendRiskScoresMonitoringOverview,
  'id' | 'createdAt' | 'updatedAt'
>;
type LendRiskScoresMonitoringCreateBody = Omit<
  LendRiskScoresMonitoring,
  'id' | 'createdAt' | 'updatedAt'
>;

@Injectable({
  providedIn: 'root',
})
export class CreditLendService {
  private readonly apiService = inject(ApiService);
  private readonly creditApi: ServiceConfiguration;

  constructor() {
    this.creditApi = this.apiService.getEnvironmentConfiguration().APIs.Credit;
  }

  createLend(body: LendCreateBody): Observable<{ id: string }> {
    return this.apiService.post<{ id: string }>(this.creditApi, '/lends', body);
  }

  searchLends(
    search: LendSearchParams,
    options?: PaginatedApiQueryOptions | null
  ): Observable<PaginatedResponse<Lend>> {
    return this.apiService.post<PaginatedResponse<Lend>>(
      this.creditApi,
      buildApiPathWithPagination('/lends/search', options),
      search
    );
  }

  getLendById(lendId: string): Observable<Lend> {
    return this.apiService.get<Lend>(this.creditApi, `/lends/${lendId}`);
  }

  updateLendById(lendId: string, body: LendCreateBody): Observable<Lend> {
    return this.apiService.put<Lend>(this.creditApi, `/lends/${lendId}`, body);
  }

  patchLendById(lendId: string, body: Partial<Lend>): Observable<Lend> {
    return this.apiService.patch<Lend>(this.creditApi, `/lends/${lendId}`, body);
  }

  deleteLendById(lendId: string, deleteReason?: string): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(`/lends/${lendId}`, {
      delete_reason: deleteReason,
    });
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendById(lendId: string): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/disable`,
      {}
    );
  }

  getLendAmountsHistory(lendId: string): Observable<LendAmountsHistory> {
    return this.apiService.get<LendAmountsHistory>(
      this.creditApi,
      `/lends/${lendId}/amounts-history`
    );
  }

  createLendUser(lendId: string, body: LendUserCreateBody): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, `/lends/${lendId}/users`, body);
  }

  getLendUserById(
    lendId: string,
    lendUserId: string
  ): Observable<LendUser> {
    return this.apiService.get<LendUser>(
      this.creditApi,
      `/lends/${lendId}/users/${lendUserId}`
    );
  }

  updateLendUserById(
    lendId: string,
    lendUserId: string,
    body: LendUserCreateBody
  ): Observable<LendUser> {
    return this.apiService.put<LendUser>(
      this.creditApi,
      `/lends/${lendId}/users/${lendUserId}`,
      body
    );
  }

  patchLendUserById(
    lendId: string,
    lendUserId: string,
    body: Partial<LendUser>
  ): Observable<LendUser> {
    return this.apiService.patch<LendUser>(
      this.creditApi,
      `/lends/${lendId}/users/${lendUserId}`,
      body
    );
  }

  deleteLendUserById(
    lendId: string,
    lendUserId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/users/${lendUserId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendUserById(lendId: string, lendUserId: string): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/users/${lendUserId}/disable`,
      {}
    );
  }

  createLendStatement(
    lendId: string,
    body: LendStatementCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/lends/${lendId}/statements`,
      body
    );
  }

  getLendStatementById(
    lendId: string,
    lendStatementId: string
  ): Observable<LendStatement> {
    return this.apiService.get<LendStatement>(
      this.creditApi,
      `/lends/${lendId}/statements/${lendStatementId}`
    );
  }

  updateLendStatementById(
    lendId: string,
    lendStatementId: string,
    body: LendStatementCreateBody
  ): Observable<LendStatement> {
    return this.apiService.put<LendStatement>(
      this.creditApi,
      `/lends/${lendId}/statements/${lendStatementId}`,
      body
    );
  }

  patchLendStatementById(
    lendId: string,
    lendStatementId: string,
    body: Partial<LendStatement>
  ): Observable<LendStatement> {
    return this.apiService.patch<LendStatement>(
      this.creditApi,
      `/lends/${lendId}/statements/${lendStatementId}`,
      body
    );
  }

  deleteLendStatementById(
    lendId: string,
    lendStatementId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/statements/${lendStatementId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendStatementById(
    lendId: string,
    lendStatementId: string
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/statements/${lendStatementId}/disable`,
      {}
    );
  }

  createLendReview(
    lendId: string,
    body: LendReviewCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/lends/${lendId}/reviews`,
      body
    );
  }

  getLendReviewById(
    lendId: string,
    lendReviewId: string
  ): Observable<LendReview> {
    return this.apiService.get<LendReview>(
      this.creditApi,
      `/lends/${lendId}/reviews/${lendReviewId}`
    );
  }

  updateLendReviewById(
    lendId: string,
    lendReviewId: string,
    body: LendReviewCreateBody
  ): Observable<LendReview> {
    return this.apiService.put<LendReview>(
      this.creditApi,
      `/lends/${lendId}/reviews/${lendReviewId}`,
      body
    );
  }

  patchLendReviewById(
    lendId: string,
    lendReviewId: string,
    body: Partial<LendReview>
  ): Observable<LendReview> {
    return this.apiService.patch<LendReview>(
      this.creditApi,
      `/lends/${lendId}/reviews/${lendReviewId}`,
      body
    );
  }

  deleteLendReviewById(
    lendId: string,
    lendReviewId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/reviews/${lendReviewId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendReviewById(
    lendId: string,
    lendReviewId: string
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/reviews/${lendReviewId}/disable`,
      {}
    );
  }

  createLendNote(lendId: string, body: LendNoteCreateBody): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, `/lends/${lendId}/notes`, body);
  }

  getLendNoteById(
    lendId: string,
    lendNoteId: string
  ): Observable<LendNote> {
    return this.apiService.get<LendNote>(
      this.creditApi,
      `/lends/${lendId}/notes/${lendNoteId}`
    );
  }

  updateLendNoteById(
    lendId: string,
    lendNoteId: string,
    body: LendNoteCreateBody
  ): Observable<LendNote> {
    return this.apiService.put<LendNote>(
      this.creditApi,
      `/lends/${lendId}/notes/${lendNoteId}`,
      body
    );
  }

  patchLendNoteById(
    lendId: string,
    lendNoteId: string,
    body: Partial<LendNote>
  ): Observable<LendNote> {
    return this.apiService.patch<LendNote>(
      this.creditApi,
      `/lends/${lendId}/notes/${lendNoteId}`,
      body
    );
  }

  deleteLendNoteById(
    lendId: string,
    lendNoteId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/notes/${lendNoteId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  createLendInsurance(
    lendId: string,
    body: LendInsuranceCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/lends/${lendId}/insurances`,
      body
    );
  }

  getLendInsuranceById(
    lendId: string,
    lendInsuranceId: string
  ): Observable<LendInsurance> {
    return this.apiService.get<LendInsurance>(
      this.creditApi,
      `/lends/${lendId}/insurances/${lendInsuranceId}`
    );
  }

  updateLendInsuranceById(
    lendId: string,
    lendInsuranceId: string,
    body: LendInsuranceCreateBody
  ): Observable<LendInsurance> {
    return this.apiService.put<LendInsurance>(
      this.creditApi,
      `/lends/${lendId}/insurances/${lendInsuranceId}`,
      body
    );
  }

  patchLendInsuranceById(
    lendId: string,
    lendInsuranceId: string,
    body: Partial<LendInsurance>
  ): Observable<LendInsurance> {
    return this.apiService.patch<LendInsurance>(
      this.creditApi,
      `/lends/${lendId}/insurances/${lendInsuranceId}`,
      body
    );
  }

  deleteLendInsuranceById(
    lendId: string,
    lendInsuranceId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/insurances/${lendInsuranceId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendInsuranceById(
    lendId: string,
    lendInsuranceId: string
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/insurances/${lendInsuranceId}/disable`,
      {}
    );
  }

  createLendFundingEntity(
    lendId: string,
    body: LendFundingEntityCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/lends/${lendId}/funding-entities`,
      body
    );
  }

  getLendFundingEntityById(
    lendId: string,
    lendFundingEntityId: string
  ): Observable<LendFundingEntity> {
    return this.apiService.get<LendFundingEntity>(
      this.creditApi,
      `/lends/${lendId}/funding-entities/${lendFundingEntityId}`
    );
  }

  updateLendFundingEntityById(
    lendId: string,
    lendFundingEntityId: string,
    body: LendFundingEntityCreateBody
  ): Observable<LendFundingEntity> {
    return this.apiService.put<LendFundingEntity>(
      this.creditApi,
      `/lends/${lendId}/funding-entities/${lendFundingEntityId}`,
      body
    );
  }

  patchLendFundingEntityById(
    lendId: string,
    lendFundingEntityId: string,
    body: Partial<LendFundingEntity>
  ): Observable<LendFundingEntity> {
    return this.apiService.patch<LendFundingEntity>(
      this.creditApi,
      `/lends/${lendId}/funding-entities/${lendFundingEntityId}`,
      body
    );
  }

  deleteLendFundingEntityById(
    lendId: string,
    lendFundingEntityId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/funding-entities/${lendFundingEntityId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendFundingEntityById(
    lendId: string,
    lendFundingEntityId: string
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/funding-entities/${lendFundingEntityId}/disable`,
      {}
    );
  }

  createLendFee(lendId: string, body: LendFeeCreateBody): Observable<{ id: string }> {
    return this.apiService.post(this.creditApi, `/lends/${lendId}/fees`, body);
  }

  getLendFeeById(
    lendId: string,
    lendFeeId: string
  ): Observable<LendFee> {
    return this.apiService.get<LendFee>(
      this.creditApi,
      `/lends/${lendId}/fees/${lendFeeId}`
    );
  }

  updateLendFeeById(
    lendId: string,
    lendFeeId: string,
    body: LendFeeCreateBody
  ): Observable<LendFee> {
    return this.apiService.put<LendFee>(
      this.creditApi,
      `/lends/${lendId}/fees/${lendFeeId}`,
      body
    );
  }

  patchLendFeeById(
    lendId: string,
    lendFeeId: string,
    body: Partial<LendFee>
  ): Observable<LendFee> {
    return this.apiService.patch<LendFee>(
      this.creditApi,
      `/lends/${lendId}/fees/${lendFeeId}`,
      body
    );
  }

  deleteLendFeeById(
    lendId: string,
    lendFeeId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/fees/${lendFeeId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendFeeById(lendId: string, lendFeeId: string): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/fees/${lendFeeId}/disable`,
      {}
    );
  }

  createLendDrawRequest(
    lendId: string,
    body: LendDrawRequestCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/lends/${lendId}/draw-requests`,
      body
    );
  }

  getLendDrawRequestById(
    lendId: string,
    lendDrawRequestId: string
  ): Observable<LendDrawRequest> {
    return this.apiService.get<LendDrawRequest>(
      this.creditApi,
      `/lends/${lendId}/draw-requests/${lendDrawRequestId}`
    );
  }

  updateLendDrawRequestById(
    lendId: string,
    lendDrawRequestId: string,
    body: LendDrawRequestCreateBody
  ): Observable<LendDrawRequest> {
    return this.apiService.put<LendDrawRequest>(
      this.creditApi,
      `/lends/${lendId}/draw-requests/${lendDrawRequestId}`,
      body
    );
  }

  patchLendDrawRequestById(
    lendId: string,
    lendDrawRequestId: string,
    body: Partial<LendDrawRequest>
  ): Observable<LendDrawRequest> {
    return this.apiService.patch<LendDrawRequest>(
      this.creditApi,
      `/lends/${lendId}/draw-requests/${lendDrawRequestId}`,
      body
    );
  }

  deleteLendDrawRequestById(
    lendId: string,
    lendDrawRequestId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/draw-requests/${lendDrawRequestId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendDrawRequestById(
    lendId: string,
    lendDrawRequestId: string
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/draw-requests/${lendDrawRequestId}/disable`,
      {}
    );
  }

  createLendCollateral(
    lendId: string,
    body: LendCollateralCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/lends/${lendId}/collaterals`,
      body
    );
  }

  getLendCollateralById(
    lendId: string,
    lendCollateralId: string
  ): Observable<LendCollateral> {
    return this.apiService.get<LendCollateral>(
      this.creditApi,
      `/lends/${lendId}/collaterals/${lendCollateralId}`
    );
  }

  updateLendCollateralById(
    lendId: string,
    lendCollateralId: string,
    body: LendCollateralCreateBody
  ): Observable<LendCollateral> {
    return this.apiService.put<LendCollateral>(
      this.creditApi,
      `/lends/${lendId}/collaterals/${lendCollateralId}`,
      body
    );
  }

  patchLendCollateralById(
    lendId: string,
    lendCollateralId: string,
    body: Partial<LendCollateral>
  ): Observable<LendCollateral> {
    return this.apiService.patch<LendCollateral>(
      this.creditApi,
      `/lends/${lendId}/collaterals/${lendCollateralId}`,
      body
    );
  }

  deleteLendCollateralById(
    lendId: string,
    lendCollateralId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/collaterals/${lendCollateralId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  disableLendCollateralById(
    lendId: string,
    lendCollateralId: string
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.creditApi,
      `/lends/${lendId}/collaterals/${lendCollateralId}/disable`,
      {}
    );
  }

  createLendRiskOverview(
    lendId: string,
    body: LendRiskOverviewCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/lends/${lendId}/risks/overview`,
      body
    );
  }

  getLendRiskOverviewById(
    lendId: string,
    riskOverviewId: string
  ): Observable<LendRiskScoresMonitoringOverview> {
    return this.apiService.get<LendRiskScoresMonitoringOverview>(
      this.creditApi,
      `/lends/${lendId}/risks/overview/${riskOverviewId}`
    );
  }

  updateLendRiskOverviewById(
    lendId: string,
    riskOverviewId: string,
    body: LendRiskOverviewCreateBody
  ): Observable<LendRiskScoresMonitoringOverview> {
    return this.apiService.put<LendRiskScoresMonitoringOverview>(
      this.creditApi,
      `/lends/${lendId}/risks/overview/${riskOverviewId}`,
      body
    );
  }

  patchLendRiskOverviewById(
    lendId: string,
    riskOverviewId: string,
    body: Partial<LendRiskScoresMonitoringOverview>
  ): Observable<LendRiskScoresMonitoringOverview> {
    return this.apiService.patch<LendRiskScoresMonitoringOverview>(
      this.creditApi,
      `/lends/${lendId}/risks/overview/${riskOverviewId}`,
      body
    );
  }

  deleteLendRiskOverviewById(
    lendId: string,
    riskOverviewId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/risks/overview/${riskOverviewId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }

  createLendRiskDetailed(
    lendId: string,
    body: LendRiskScoresMonitoringCreateBody
  ): Observable<{ id: string }> {
    return this.apiService.post(
      this.creditApi,
      `/lends/${lendId}/risks/detailed`,
      body
    );
  }

  getLendRiskDetailedById(
    lendId: string,
    riskDetailedId: string
  ): Observable<LendRiskScoresMonitoring> {
    return this.apiService.get<LendRiskScoresMonitoring>(
      this.creditApi,
      `/lends/${lendId}/risks/detailed/${riskDetailedId}`
    );
  }

  updateLendRiskDetailedById(
    lendId: string,
    riskDetailedId: string,
    body: LendRiskScoresMonitoringCreateBody
  ): Observable<LendRiskScoresMonitoring> {
    return this.apiService.put<LendRiskScoresMonitoring>(
      this.creditApi,
      `/lends/${lendId}/risks/detailed/${riskDetailedId}`,
      body
    );
  }

  patchLendRiskDetailedById(
    lendId: string,
    riskDetailedId: string,
    body: Partial<LendRiskScoresMonitoring>
  ): Observable<LendRiskScoresMonitoring> {
    return this.apiService.patch<LendRiskScoresMonitoring>(
      this.creditApi,
      `/lends/${lendId}/risks/detailed/${riskDetailedId}`,
      body
    );
  }

  deleteLendRiskDetailedById(
    lendId: string,
    riskDetailedId: string,
    deleteReason?: string
  ): Observable<ApiMessage> {
    const path = buildApiPathWithOptionalQuery(
      `/lends/${lendId}/risks/detailed/${riskDetailedId}`,
      { delete_reason: deleteReason }
    );
    return this.apiService.delete<ApiMessage>(this.creditApi, path);
  }
}
