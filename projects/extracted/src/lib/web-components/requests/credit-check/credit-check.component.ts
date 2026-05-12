
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';

import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { isNotNil } from 'es-toolkit';
import { lastValueFrom } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { type Request } from '../../../models/requestModels';
import { TaskStatuses, type Section } from '../../../models/sectionModels';
import { CreditCheckService } from '../../../services/data/credit-check.service';
import type {
  CreditCheckDetails,
  CreditCheckInput,
} from '../../../services/data/models/credit-check.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { LottieWrapperComponent } from '../../web-components';
import { CreditCheckConsentComponent } from './credit-check-consent/credit-check-consent.component';
import { CreditCheckDetailsComponent } from './credit-check-details/credit-check-details.component';
import { CreditCheckSuccessComponent } from './credit-check-success/credit-check-success.component';

const CREDIT_CHECK_STEPS = {
  CONSENT: 'CONSENT',
  CREDIT_CHECK_DETAILS: 'CREDIT_CHECK_DETAILS',
  CREDIT_CHECK_IN_PROGRESS: 'CREDIT_CHECK_IN_PROGRESS',
  SUCCESS: 'SUCCESS',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-check',
  templateUrl: './credit-check.component.html',
  styleUrls: ['./credit-check.component.scss'],
  imports: [
    MatIconModule,
    CreditCheckDetailsComponent,
    ActivateDirective,
    CreditCheckSuccessComponent,
    CreditCheckConsentComponent,
    LottieWrapperComponent
],
})
export class CreditCheckComponent implements OnInit {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);

  private router = inject(Router);
  private readonly organizationService = inject(OrganizationService);
  private readonly creditCheckService = inject(CreditCheckService);

  CreditCheckSteps = CREDIT_CHECK_STEPS;

  request = input.required<Request>();
  section = input.required<Section>();
  name = input.required<string>();
  isMobile = input(false);

  creditCheckDetails = signal<CreditCheckDetails | undefined>(undefined);
  creditCheckScore = signal<number | undefined>(undefined);

  currentStep = signal(CREDIT_CHECK_STEPS.CONSENT);

  constructor() {
    this.matIconRegistry.addSvgIcon(
      'green-check',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icons/app/green-check.svg'
      )
    );
    this.matIconRegistry.addSvgIcon(
      'red-cross',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icons/app/red-cross.svg'
      )
    );
    this.matIconRegistry.addSvgIcon(
      'yellow-warning',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icons/app/yellow-warning.svg'
      )
    );
  }

  // eslint-disable-next-line @angular-eslint/no-async-lifecycle-method
  async ngOnInit() {
    const creditCheckScore = await lastValueFrom(
      this.creditCheckService.getCreditCheckData(
        this.section().assigneeId ?? ''
      )
    );

    if (isNotNil(creditCheckScore)) {
      this.creditCheckScore.set(creditCheckScore);
      this.currentStep.set(CREDIT_CHECK_STEPS.SUCCESS);
    }
  }

  onConsentGiven() {
    this.currentStep.set(CREDIT_CHECK_STEPS.CREDIT_CHECK_DETAILS);
  }

  back() {
    if (this.currentStep() === CREDIT_CHECK_STEPS.CONSENT) {
      if (this.isMobile()) {
        this.router.navigateByUrl(
          `/tabs/requests/${this.request().id}/sections`
        );
      } else {
        this.router.navigate(['requests', this.request().id, 'sections']);
      }
    } else if (this.currentStep() === CREDIT_CHECK_STEPS.CREDIT_CHECK_DETAILS) {
      this.currentStep.set(CREDIT_CHECK_STEPS.CONSENT);
    }
  }

  creditCheckProvided(event: CreditCheckDetails) {
    this.creditCheckDetails.set(event);
    this.currentStep.set(CREDIT_CHECK_STEPS.CREDIT_CHECK_IN_PROGRESS);
    this.startCreditCheck();
  }

  startCreditCheck() {
    const details = this.creditCheckDetails();
    const payload: CreditCheckInput = {
      organizationUserId: this.section().assigneeId ?? '',
      firstName: details?.firstName ? `${details?.firstName}` : '',
      lastName: details?.lastName ? `${details?.lastName}` : '',
      middleName: details?.middleName ? `${details?.middleName}` : '',
      phoneNumber: details?.phoneNumber ? `${details?.phoneNumber}` : '',
      dateOfBirth: details?.dateOfBirth ?? 0,
      ssn: details?.ssn ? `${details?.ssn}` : '',
      streetNumber: details?.streetNumber ? `${details?.streetNumber}` : '',
      streetName: details?.streetName ? `${details?.streetName}` : '',
      city: details?.city ? `${details?.city}` : '',
      state: details?.state ? `${details?.state}` : '',
      zipCode: details?.zipCode ? `${details?.zipCode}` : '',
      country:
        !details?.country || details?.country === ''
          ? 'USA'
          : `${details?.country}`,
    };

    this.creditCheckService.check(payload).subscribe({
      next: result => {
        this.creditCheckScore.set(result);
        this.currentStep.set(CREDIT_CHECK_STEPS.SUCCESS);
      },
    });
  }

  isTaskProvidedByClient(): boolean {
    return this.section().tasks?.[0]?.status === TaskStatuses.PROVIDED;
  }

  isTaskApproved(): boolean {
    return this.section().tasks?.[0]?.status === TaskStatuses.APPROVED;
  }

  isTaskRejected(): boolean {
    return this.section().tasks?.[0]?.status === TaskStatuses.REJECTED;
  }

  isTaskCancelled(): boolean {
    return this.section().tasks?.[0]?.status === TaskStatuses.CANCELLED;
  }
}
