import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import type { Business } from '../../../models/businessModels';
import { BusinessTypes } from '../../../models/businessModels';
import type { InviteCoApplicantPayload } from '../../../models/coApplicantModels';
import { RequestUserRoles } from '../../../models/requestModels';
import { CoApplicantsService } from '../../../services/co-applicants/co-applicants.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { formatEnumValue, isValidEmail } from '../../../utils/stringUtil';
import { LjInputFieldComponent } from '../../form/input-field/input-field.component';
import { LjSelectFieldComponent } from '../../form/select-field/select-field.component';

export type AddCoApplicantDialogMode = 'authenticated' | 'public';
export type AddCoApplicantDialogStep =
  | 'type-selector'
  | 'myself-form'
  | 'business-form'
  | 'someone-else-form';

export type BusinessFormMode = 'none' | 'existing' | 'new';

export interface AddCoApplicantDialogData {
  requestId: string;
  mode: AddCoApplicantDialogMode;
  currentUserId: string;
  canShowMyself: boolean;
  canDirectAddBusiness: boolean;
  currentUserProfile: { firstName: string; lastName: string; email: string };
}

export interface AddCoApplicantDialogResult {
  success: boolean;
  source: 'direct' | 'invited';
  payload?: InviteCoApplicantPayload;
}

@Component({
  selector: 'lj-add-co-applicant-dialog',
  templateUrl: './add-co-applicant-dialog.component.html',
  styleUrl: './add-co-applicant-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    NgxSkeletonLoaderModule,
    ActivateDirective,
    LjInputFieldComponent,
    LjSelectFieldComponent,
  ],
})
export class AddCoApplicantDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<AddCoApplicantDialogComponent, AddCoApplicantDialogResult>>(
      MatDialogRef
    );
  readonly data = inject<AddCoApplicantDialogData>(MAT_DIALOG_DATA);
  private readonly coApplicantsService = inject(CoApplicantsService);
  private readonly organizationService = inject(OrganizationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal<AddCoApplicantDialogStep>('type-selector');
  readonly submitError = signal<string | null>(null);

  readonly role = signal<RequestUserRoles | null>(null);

  readonly selectedBusiness = signal<Business | null>(null);
  readonly businessName = signal('');
  readonly businessUniqueIdentifier = signal('');
  readonly businessType = signal<BusinessTypes | null>(null);

  readonly businesses = signal<Business[]>([]);
  readonly businessesLoading = signal(false);
  readonly businessFormMode = signal<BusinessFormMode>('none');

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');

  readonly confirmationCheck = signal(false);

  readonly roleOptions = [
    { value: RequestUserRoles.CO_BORROWER, label: 'Co-borrower' },
    { value: RequestUserRoles.GUARANTOR, label: 'Guarantor' },
  ];

  readonly businessTypeOptions = Object.values(BusinessTypes).map(value => ({
    value,
    label: formatEnumValue(value, false),
  }));

  readonly excludedBusinessIds = computed(() =>
    this.coApplicantsService
      .coApplicants()
      .filter(c => c.entityType === 'business' && c.userId)
      .map(c => c.userId as string)
  );

  readonly availableBusinesses = computed(() => {
    const excluded = new Set(this.excludedBusinessIds());
    return this.businesses().filter(b => b.id && !excluded.has(b.id));
  });

  readonly canSubmitMyself = computed(
    () =>
      this.role() !== null &&
      this.confirmationCheck() &&
      this.data.currentUserProfile.email.trim().length > 0
  );

  readonly canSubmitSomeoneElse = computed(
    () =>
      this.firstName().trim().length >= 1 &&
      this.lastName().trim().length >= 1 &&
      isValidEmail(this.email().trim()) &&
      this.role() !== null &&
      this.confirmationCheck()
  );

  readonly canSubmitBusiness = computed(
    () =>
      this.businessFormMode() !== 'none' &&
      this.businessName().trim().length > 0 &&
      this.businessType() !== null &&
      this.role() !== null &&
      this.confirmationCheck() &&
      this.data.currentUserProfile.email.trim().length > 0
  );

  constructor() {
    const d = this.data;
    if (d.mode === 'public' || (!d.canShowMyself && !d.canDirectAddBusiness)) {
      this.step.set('someone-else-form');
    }
  }

  goToStep(step: AddCoApplicantDialogStep): void {
    this.resetFormState();
    this.step.set(step);
    if (step === 'business-form') {
      this.loadMyBusinesses();
    }
  }

  goBack(): void {
    const d = this.data;
    if (d.mode === 'public' || (!d.canShowMyself && !d.canDirectAddBusiness)) {
      return;
    }
    this.resetFormState();
    this.step.set('type-selector');
  }

  onFirstNameChange(value: string | null): void {
    this.firstName.set(value ?? '');
  }

  onLastNameChange(value: string | null): void {
    this.lastName.set(value ?? '');
  }

  onEmailChange(value: string | null): void {
    this.email.set((value ?? '').trim());
  }

  onBusinessNameChange(value: string | null): void {
    this.businessName.set(value ?? '');
  }

  onBusinessUniqueIdentifierChange(value: string | null): void {
    this.businessUniqueIdentifier.set(value ?? '');
  }

  onBusinessTypeChange(value: BusinessTypes): void {
    this.businessType.set(value);
  }

  onRoleChange(value: RequestUserRoles): void {
    this.role.set(value);
  }

  selectExistingBusiness(business: Business): void {
    this.selectedBusiness.set(business);
    this.businessFormMode.set('existing');
    this.businessName.set(business.name ?? '');
    this.businessUniqueIdentifier.set(business.uniqueBusinessIdentifier ?? '');
    this.businessType.set(business.businessType ?? null);
  }

  startNewBusiness(): void {
    this.selectedBusiness.set(null);
    this.businessFormMode.set('new');
    this.businessName.set('');
    this.businessUniqueIdentifier.set('');
    this.businessType.set(null);
  }

  submitMyself(): void {
    if (!this.canSubmitMyself()) return;
    const p = this.data.currentUserProfile;
    const payload: InviteCoApplicantPayload = {
      requestId: this.data.requestId,
      invitationType: 'USER_INVITATION',
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      role: this.role() as RequestUserRoles,
    };
    this.doSubmit(payload, 'direct');
  }

  submitSomeoneElse(): void {
    if (!this.canSubmitSomeoneElse()) return;
    const payload: InviteCoApplicantPayload = {
      requestId: this.data.requestId,
      invitationType: 'USER_INVITATION',
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      email: this.email().trim(),
      role: this.role() as RequestUserRoles,
    };
    this.doSubmit(payload, 'invited');
  }

  submitBusiness(): void {
    if (!this.canSubmitBusiness()) return;
    const p = this.data.currentUserProfile;
    const existing =
      this.businessFormMode() === 'existing' ? this.selectedBusiness() : null;
    const payload: InviteCoApplicantPayload = {
      requestId: this.data.requestId,
      invitationType: 'BUSINESS_INVITATION',
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      role: this.role() as RequestUserRoles,
      businessName: this.businessName().trim(),
      businessType: this.businessType() ?? undefined,
      businessUniqueIdentifier:
        this.businessUniqueIdentifier().trim() || undefined,
      businessId: existing?.id,
      businessContactId: existing?.primaryContactId,
    };
    this.doSubmit(payload, existing ? 'direct' : 'invited');
  }

  cancel(): void {
    this.dialogRef.close();
  }

  toggleDisclaimer(event: Event): void {
    if ((event.target as HTMLElement).closest('mat-checkbox')) return;
    this.confirmationCheck.set(!this.confirmationCheck());
  }

  getOrganizationName(): string {
    return this.organizationService.uiConfiguration.name;
  }

  getTermsOfUse(): string {
    return this.organizationService.uiConfiguration.termsOfUseUrl ?? '';
  }

  getPrivacyPolicy(): string {
    return this.organizationService.uiConfiguration.privacyPolicyUrl ?? '';
  }

  showTermsOfUse(): boolean {
    const url = this.organizationService.uiConfiguration.termsOfUseUrl;
    return url !== undefined && url !== null && url.trim() !== '';
  }

  showPrivacyPolicy(): boolean {
    const url = this.organizationService.uiConfiguration.privacyPolicyUrl;
    return url !== undefined && url !== null && url.trim() !== '';
  }

  getConditionalString(condition: boolean, value: string): string {
    return condition ? value : '';
  }

  private loadMyBusinesses(): void {
    this.businessesLoading.set(true);
    this.organizationService
      .getBusinessesForUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.businesses.set(list ?? []);
          this.businessesLoading.set(false);
        },
        error: () => {
          this.businesses.set([]);
          this.businessesLoading.set(false);
        },
      });
  }

  private doSubmit(
    payload: InviteCoApplicantPayload,
    source: 'direct' | 'invited'
  ): void {
    this.dialogRef.close({ success: true, source, payload });
  }

  private resetFormState(): void {
    this.role.set(null);
    this.selectedBusiness.set(null);
    this.businessName.set('');
    this.businessUniqueIdentifier.set('');
    this.businessType.set(null);
    this.businessFormMode.set('none');
    this.firstName.set('');
    this.lastName.set('');
    this.email.set('');
    this.confirmationCheck.set(false);
    this.submitError.set(null);
  }

}
