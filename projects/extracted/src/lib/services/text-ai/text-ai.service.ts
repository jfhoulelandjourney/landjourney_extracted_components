import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService, ServiceConfiguration } from '../api/api.service';

export interface GenerateFollowUpInput {
  loanOfficerName: string;
  requestName: string;
  requestType: string;
  customerName: string;
  sections?: { name: string; status: string }[];
  tasks?: { name: string; status: string }[];
}

@Injectable({ providedIn: 'root' })
export class TextAiService {
  private apiService = inject(ApiService);
  private httpClient = inject(HttpClient);

  private readonly serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  generateFollowUpMessage(input: GenerateFollowUpInput): Observable<string> {
    return this.apiService
      .post<{
        message: string;
      }>(this.serviceConfiguration, `/ai-text-prompts/generate-follow-up`, input)
      .pipe(map(res => res.message));
  }
}
