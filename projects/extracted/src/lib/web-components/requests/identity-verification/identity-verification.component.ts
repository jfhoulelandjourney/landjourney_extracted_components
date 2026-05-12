
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
import { lastValueFrom } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { type Request } from '../../../models/requestModels';
import {
  SectionStatuses,
  TaskStatuses,
  type Section,
} from '../../../models/sectionModels';
import type { IdDocumentType } from '../../../services/data/enums/identity-verification.enums';
import { IdentityVerificationService } from '../../../services/data/identity-verification.service';
import {
  AuthenticateStatuses,
  type IdentityVerificationDetails,
  type IdentityVerificationInput,
} from '../../../services/data/models/identity-verification.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { getAliasesForEntity } from '../../../utils/requestUtils/entity-status';
import { isSectionInTodo } from '../../../utils/requestUtils/section-status';
import { isReviewApplicationTask } from '../../../utils/requestUtils/sections';
import { LottieWrapperComponent } from '../../web-components';
import { IdentityCameraComponent } from './identity-camera/identity-camera.component';
import { IdentityConsentComponent } from './identity-consent/identity-consent.component';
import { IdentityDetailsComponent } from './identity-details/identity-details.component';
import { IdentityFileChoiceComponent } from './identity-file-choice/identity-file-choice.component';
import { IdentityIdChoiceComponent } from './identity-id-choice/identity-id-choice.component';
import { IdentityManualReviewComponent } from './identity-manual-review/identity-manual-review.component';
import { IdentitySuccessComponent } from './identity-success/identity-success.component';
import { IdentityUploadComponent } from './identity-upload/identity-upload.component';

const IDENTITY_VERIFICATION_STEPS = {
  PREVIOUSLY_VERIFIED: 'PREVIOUSLY_VERIFIED',
  CONSENT: 'CONSENT',
  IDENTITY_DETAILS: 'IDENTITY_DETAILS',
  ID_CHOICE: 'ID_CHOICE',
  FILE_CHOICE: 'FILE_CHOICE',
  UPLOAD: 'UPLOAD',
  CAMERA: 'CAMERA',
  IDENTITY_VERIFICATION_IN_PROGRESS: 'IDENTITY_VERIFICATION_IN_PROGRESS',
  SUCCESS: 'SUCCESS',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  FALLBACK_MANUAL_REVIEW: 'FALLBACK_MANUAL_REVIEW',
  NONE: 'NONE',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-identity-verification',
  templateUrl: './identity-verification.component.html',
  styleUrls: ['./identity-verification.component.scss'],
  imports: [
    IdentityFileChoiceComponent,
    MatIconModule,
    IdentityUploadComponent,
    IdentityCameraComponent,
    IdentityIdChoiceComponent,
    IdentityDetailsComponent,
    IdentityManualReviewComponent,
    ActivateDirective,
    IdentitySuccessComponent,
    IdentityConsentComponent,
    LottieWrapperComponent
],
})
export class IdentityVerificationComponent implements OnInit {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);

  private router = inject(Router);
  private readonly organizationService = inject(OrganizationService);
  private readonly identityVerificationService = inject(
    IdentityVerificationService
  );

  IdentityVerificationSteps = IDENTITY_VERIFICATION_STEPS;

  request = input.required<Request>();
  section = input.required<Section>();
  name = input.required<string>();
  isMobile = input(false);

  identityVerificationDetails = signal<IdentityVerificationDetails | undefined>(
    undefined
  );
  idDocumentType = signal<IdDocumentType | undefined>(undefined);

  currentStep = signal(IDENTITY_VERIFICATION_STEPS.NONE);

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
    const response = await lastValueFrom(
      this.identityVerificationService.isUserPreviouslyVerified()
    );

    if (this.section().status === SectionStatuses.APPROVED) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.SUCCESS);
    } else if (
      this.section().status === SectionStatuses.INCOMPLETE &&
      response.status === AuthenticateStatuses.VERIFIED
    ) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.PREVIOUSLY_VERIFIED);
    } else if (
      !this.organizationService.isFeatureFlagActivated(
        'IDENTITY_VERIFICATION_EXTERN'
      ) &&
      this.section().status === SectionStatuses.SUBMITTED
    ) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.MANUAL_REVIEW);
    } else if (
      this.organizationService.isFeatureFlagActivated(
        'IDENTITY_VERIFICATION_EXTERN'
      ) &&
      this.section().status === SectionStatuses.SUBMITTED
    ) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.FALLBACK_MANUAL_REVIEW);
    } else {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.CONSENT);
    }
  }

  onUploadClick() {
    this.currentStep.set(IDENTITY_VERIFICATION_STEPS.UPLOAD);
  }

  onCameraClick() {
    this.currentStep.set(IDENTITY_VERIFICATION_STEPS.CAMERA);
  }

  onIdDocumentTypeClick(event: IdDocumentType) {
    this.idDocumentType.set(event);
    this.currentStep.set(IDENTITY_VERIFICATION_STEPS.FILE_CHOICE);
  }

  onConsentGiven() {
    this.currentStep.set(IDENTITY_VERIFICATION_STEPS.IDENTITY_DETAILS);
  }

  back() {
    if (this.currentStep() === IDENTITY_VERIFICATION_STEPS.CONSENT) {
      if (this.isMobile()) {
        this.router.navigateByUrl(
          `/tabs/requests/${this.request().id}/sections`
        );
      } else {
        this.router.navigate(['requests', this.request().id, 'sections']);
      }
    } else if (
      this.currentStep() === IDENTITY_VERIFICATION_STEPS.IDENTITY_DETAILS
    ) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.CONSENT);
    } else if (this.currentStep() === IDENTITY_VERIFICATION_STEPS.ID_CHOICE) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.IDENTITY_DETAILS);
    } else if (this.currentStep() === IDENTITY_VERIFICATION_STEPS.FILE_CHOICE) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.ID_CHOICE);
    } else if (this.currentStep() === IDENTITY_VERIFICATION_STEPS.UPLOAD) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.FILE_CHOICE);
    } else if (this.currentStep() === IDENTITY_VERIFICATION_STEPS.CAMERA) {
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.FILE_CHOICE);
    }
  }

  identityVerificationProvided(event: IdentityVerificationDetails) {
    this.identityVerificationDetails.set(event);
    this.currentStep.set(IDENTITY_VERIFICATION_STEPS.ID_CHOICE);
  }

  next() {
    // Check if there's a review task that should be navigated to automatically
    const reviewSection = this.findReviewTaskForUser();

    if (reviewSection && this.shouldRedirectToReviewTask(reviewSection)) {
      // Navigate directly to review task
      const reviewUrl = this.isMobile()
        ? `/tabs/requests/${this.request().id}/sections/submission`
        : `/requests/${this.request().id}/sections/submission`;

      const queryParams = { sectionId: reviewSection.id };

      this.router.navigate([reviewUrl], { queryParams });
    } else {
      // Default behavior - navigate back to sections page
      setTimeout(() => {
        if (this.isMobile()) {
          this.router.navigateByUrl(
            `/tabs/requests/${this.request().id}/sections`
          );
        } else {
          this.router.navigate(['requests', this.request().id, 'sections']);
        }
      }, 500);
    }
  }

  startVerification(
    idFrontDocumentId: string,
    idBackDocumentId: string | undefined
  ) {
    if (
      this.organizationService.isFeatureFlagActivated(
        'IDENTITY_VERIFICATION_EXTERN'
      )
    ) {
      const idDocumentType = this.idDocumentType() ?? 'PASSPORT';

      this.currentStep.set(
        IDENTITY_VERIFICATION_STEPS.IDENTITY_VERIFICATION_IN_PROGRESS
      );

      const details = this.identityVerificationDetails();
      const payload: IdentityVerificationInput = {
        organizationUserId: this.organizationService.getOrganizationUserId(),
        idDocumentType,
        idFrontDocumentId,
        firstName: details?.firstName ? `${details?.firstName}` : '',
        lastName: details?.lastName ? `${details?.lastName}` : '',
        middleName: details?.middleName ? `${details?.middleName}` : null,
        phoneNumber: details?.phoneNumber ? `${details?.phoneNumber}` : null,
        dateOfBirth: details?.dateOfBirth ?? 0,
        ssn: details?.ssn ? `${details?.ssn}` : null,
        email: details?.email ? `${details?.email}` : '',
        streetNumber: details?.streetNumber ? `${details?.streetNumber}` : null,
        streetName: details?.streetName ? `${details?.streetName}` : null,
        city: details?.city ? `${details?.city}` : null,
        state: details?.state ? `${details?.state}` : null,
        zipCode: details?.zipCode ? `${details?.zipCode}` : null,
        country:
          !details?.country || details?.country === ''
            ? 'USA'
            : `${details?.country}`,
      };

      if (idDocumentType === 'OTHER_GOVERNMENT_ID') {
        payload.idBackDocumentId = idBackDocumentId;
      }

      this.identityVerificationService.verify(payload).subscribe({
        next: result => {
          if (result?.status === AuthenticateStatuses.VERIFIED) {
            this.currentStep.set(IDENTITY_VERIFICATION_STEPS.SUCCESS);
          } else {
            // Any other status (FAILED, ERROR, etc.) goes to manual review
            this.currentStep.set(
              IDENTITY_VERIFICATION_STEPS.FALLBACK_MANUAL_REVIEW
            );
          }
        },
        error: () => {
          // Manual review flow fallback
          this.currentStep.set(
            IDENTITY_VERIFICATION_STEPS.FALLBACK_MANUAL_REVIEW
          );
        },
      });
    } else {
      // Manual review flow
      this.currentStep.set(IDENTITY_VERIFICATION_STEPS.MANUAL_REVIEW);
    }
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

  /**
   * Find a review task for the current user in the same stage as the ID verification task
   */
  private findReviewTaskForUser(): Section | undefined {
    const currentRequest = this.request();
    const currentSection = this.section();
    if (!currentRequest || !currentSection) return undefined;

    const currentUserId = this.organizationService.getOrganizationUserId();
    const aliases = getAliasesForEntity(
      currentRequest.users ?? [],
      currentUserId
    );

    // Find review task for current user in the same stage
    return currentRequest.sections?.find(
      section =>
        aliases.includes(section.assigneeId ?? '') &&
        section.step === currentSection.step &&
        isReviewApplicationTask(section)
    );
  }

  /**
   * Check if we should automatically redirect to the review task
   */
  private shouldRedirectToReviewTask(reviewSection: Section): boolean {
    const currentRequest = this.request();
    if (!currentRequest || !reviewSection) return false;

    const currentUserId = this.organizationService.getOrganizationUserId();
    const aliases = getAliasesForEntity(
      currentRequest.users ?? [],
      currentUserId
    );

    // Get all sections for the same assignee in the same stage (excluding the review section)
    const userSectionsInStage =
      currentRequest.sections?.filter(
        s =>
          aliases.includes(s.assigneeId ?? '') &&
          s.step === reviewSection.step &&
          s.id !== reviewSection.id &&
          !isReviewApplicationTask(s)
      ) ?? [];

    // Review task should be available if all other tasks in the stage are completed
    return userSectionsInStage.every(s => !isSectionInTodo(s));
  }
}
