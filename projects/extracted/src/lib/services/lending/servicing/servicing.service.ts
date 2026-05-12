import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';

import { formatAmountFromCents } from '../../../utils/numberUtil';
import { ApiService, ServiceConfiguration } from '../../api/api.service';
import { OrganizationService } from '../../organization/organization.service';

@Injectable({
  providedIn: 'root',
})
export class ServicingService implements OnDestroy {
  private apiService = inject(ApiService);
  private organizationService = inject(OrganizationService);
  private readonly serviceConfiguration: ServiceConfiguration;

  private destroy$ = new Subject<void>();

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Discussion;
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  public sendPaymentRequest(
    userName: string,
    loanNumber: string,
    loanType: string,
    amount: number
  ) {
    const payload = {
      url: null,
      methods: ['EMAIL'],
      sendNow: true,
      extra: {
        message: `${userName} initiated a ${amount} payment for ${loanType} ${loanNumber}.`,
        subject: `Loan payment initiated for ${loanType} ${loanNumber}.`,
      },
    };

    const servicingEmail =
      this.organizationService.getEmailAddress('servicing');

    return this.apiService.post(this.serviceConfiguration, `/notifications`, {
      workflowName: 'simple-message',
      recipients: [servicingEmail],
      payload,
      overrides: {},
    });
  }

  public sendPayDownRequest(
    userName: string,
    loanNumber: string,
    amount: number,
    date: string
  ) {
    const payload = {
      url: null,
      methods: ['EMAIL'],
      sendNow: true,
      extra: {
        message: `${userName} initiated a paydown for Loan ${loanNumber}. Requested date: ${date}. Paydown amount: ${formatAmountFromCents(
          amount,
          {
            zeroFormat: formatter => formatter(0),
          }
        )}.`,
        subject: `Loan paydown initiated for Loan ${loanNumber}.`,
      },
    };

    const servicingEmail =
      this.organizationService.getEmailAddress('servicing');

    return this.apiService.post(this.serviceConfiguration, `/notifications`, {
      workflowName: 'simple-message',
      recipients: [servicingEmail],
      payload,
      overrides: {},
    });
  }

  public sendPayOffRequest(
    userName: string,
    loanNumber: string,
    currentBalance: number,
    reason: string,
    date: string,
    statementDestination: string,
    loanType: string
  ) {
    const payload = {
      url: null,
      methods: ['EMAIL'],
      sendNow: true,
      extra: {
        message: `${userName} initiated a payoff for ${loanType} ${loanNumber}. Requested date: ${date}. Current balance: ${formatAmountFromCents(
          currentBalance,
          {
            zeroFormat: formatter => formatter(0),
          }
        )}. Reason: ${reason}. Send statement to: ${statementDestination}`,
        subject: `Loan payoff initiated for Loan ${loanNumber}.`,
      },
    };

    const servicingEmail =
      this.organizationService.getEmailAddress('servicing');

    return this.apiService.post(this.serviceConfiguration, `/notifications`, {
      workflowName: 'simple-message',
      recipients: [servicingEmail],
      payload,
      overrides: {},
    });
  }

  public sendDrawFundsRequest(
    userName: string,
    loanNumber: string,
    amount: number,
    date: string,
    authorizationCode: string
  ) {
    const payload = {
      url: null,
      methods: ['EMAIL'],
      sendNow: true,
      extra: {
        message: `${userName} requested a ${amount} draw from Line of Credit ${loanNumber}. Funds have been requested for ${date}. Authorization PIN: ${authorizationCode}.`,
        subject: `Draw request initiated for Line of Credit ${loanNumber}.`,
      },
    };

    const servicingEmail =
      this.organizationService.getEmailAddress('servicing');

    return this.apiService.post(this.serviceConfiguration, `/notifications`, {
      workflowName: 'simple-message',
      recipients: [servicingEmail],
      payload,
      overrides: {},
    });
  }
}
