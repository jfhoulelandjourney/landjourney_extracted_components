import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';
import {
  ExistingServicerSchema,
  ServicerBaseSchema,
} from './models/servicers.models';
import { EscrowBaseSchema, ExistingEscrowSchema } from './models/escrow.models';
import { ExistingFeeSchema, FeeBaseSchema } from './models/fees.models';
import {
  ExistingFundingEntitySchema,
  FundingEntityBaseSchema,
} from './models/funding-entities.models';

@Injectable({
  providedIn: 'root',
})
export class LendingManagementService {
  private apiService = inject(ApiService);

  private service: ServiceConfiguration;

  constructor() {
    this.service = this.apiService.getEnvironmentConfiguration().APIs.Lending;
  }

  // SERVICERS

  getAllFundingEntities(): Observable<ExistingFundingEntitySchema[]> {
    return this.apiService.get<ExistingFundingEntitySchema[]>(
      this.service,
      `/funding-entities`
    );
  }

  createFundingEntity(
    servicerData: FundingEntityBaseSchema
  ): Observable<ApiMessage> {
    return this.apiService.post<ApiMessage>(
      this.service,
      `/funding-entities`,
      servicerData
    );
  }

  updateFundingEntity(
    servicerData: ExistingFundingEntitySchema
  ): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.service,
      `/funding-entities/${servicerData.id}`,
      servicerData
    );
  }

  deleteFundingEntity(id: string): Observable<ApiMessage> {
    return this.apiService.delete(this.service, `/funding-entities/${id}`);
  }

  // SERVICERS

  getAllServicers(): Observable<ExistingServicerSchema[]> {
    return this.apiService.get<ExistingServicerSchema[]>(
      this.service,
      `/servicers`
    );
  }

  createServicer(servicerData: ServicerBaseSchema): Observable<ApiMessage> {
    return this.apiService.post<ApiMessage>(
      this.service,
      `/servicers`,
      servicerData
    );
  }

  updateServicer(servicerData: ExistingServicerSchema): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.service,
      `/servicers/${servicerData.id}`,
      servicerData
    );
  }

  deleteServicer(id: string): Observable<ApiMessage> {
    return this.apiService.delete(this.service, `/servicers/${id}`);
  }

  // ESCROWS

  getAllEscrows(): Observable<ExistingEscrowSchema[]> {
    return this.apiService.get<ExistingEscrowSchema[]>(
      this.service,
      `/escrows`
    );
  }

  createEscrow(escrowData: EscrowBaseSchema): Observable<ApiMessage> {
    return this.apiService.post<ApiMessage>(
      this.service,
      `/escrows`,
      escrowData
    );
  }

  updateEscrow(escrowData: ExistingEscrowSchema): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.service,
      `/escrows/${escrowData.id}`,
      escrowData
    );
  }

  deleteEscrow(id: string): Observable<ApiMessage> {
    return this.apiService.delete(this.service, `/escrows/${id}`);
  }

  // FEES

  getAllFees(): Observable<ExistingFeeSchema[]> {
    return this.apiService.get<ExistingFeeSchema[]>(this.service, `/fees`);
  }

  createFee(feeData: FeeBaseSchema): Observable<ApiMessage> {
    return this.apiService.post<ApiMessage>(this.service, `/fees`, feeData);
  }

  updateFee(feeData: ExistingFeeSchema): Observable<ApiMessage> {
    return this.apiService.put<ApiMessage>(
      this.service,
      `/fees/${feeData.id}`,
      feeData
    );
  }

  deleteFee(id: string): Observable<ApiMessage> {
    return this.apiService.delete(this.service, `/fees/${id}`);
  }
}
