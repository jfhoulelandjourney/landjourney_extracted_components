import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import { DataVisibilityLevels } from '../../../../services/data/enums/data-visibility-levels.enums';
import {
  CREDIT_CHECK_PREFILL_FIELDS,
  PrefillSourceTypes,
} from '../../../../services/data/enums/prefill-data.enums';
import type { CreditCheckDetails } from '../../../../services/data/models/credit-check.models';
import type { PrefillDataQuerySchema } from '../../../../services/data/models/prefill-data-unit-query.models';
import type { BasePrefillDataUnitSchema } from '../../../../services/data/models/prefill-data-unit.models';
import { PrefillDataService } from '../../../../services/data/prefill-data.service';
import { OrganizationService } from '../../../../services/organization/organization.service';
import type { IdentityDetailsComponent } from '../../identity-verification/identity-details/identity-details.component';
import { InlineEditAddressFieldComponent } from './inline-edit-address-fields.components';
import { InlineEditTextFieldComponent } from './inline-edit-text-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-check-details',
  templateUrl: './credit-check-details.component.html',
  styleUrls: ['./credit-check-details.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    FormsModule,
    InlineEditTextFieldComponent,
    NgxSkeletonLoaderModule,
    InlineEditAddressFieldComponent,
  ],
})
export class CreditCheckDetailsComponent implements OnInit {
  organizationService = inject(OrganizationService);
  prefillDataService = inject(PrefillDataService);
  prefillTargetUserId = input<string | undefined>(undefined);

  loading = signal(true);

  isMobile = input(false);
  name = input.required<string>();
  readonly onCreditCheckDetailsProvided = output<CreditCheckDetails>();
  readonly onBack = output();

  isFormComplete = signal(false);

  [key: string]: unknown;

  firstName = '';
  lastName = '';
  middleName = '';
  phoneNumber = '';
  dateOfBirth = 0;
  ssn = '';
  streetNumber = '';
  streetName = '';
  city = '';
  state = '';
  zipCode = '';
  country = '';

  ngOnInit() {
    this.loadPrefillData();
  }

  getAddress() {
    return {
      streetNumber: this.streetNumber,
      streetName: this.streetName,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country,
    };
  }

  handleAddressChanged(address: {
    streetNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) {
    this.streetNumber = address.streetNumber;
    this.streetName = address.streetName;
    this.city = address.city;
    this.state = address.state;
    this.zipCode = address.zipCode;
    this.country = address.country;

    this.checkFormCompletion();
  }

  dateOfBirthChanged(value: string | number) {
    this.dateOfBirth = parseInt(value as string);
    this.checkFormCompletion();
  }

  handleValueChanged(
    field: keyof Pick<
      IdentityDetailsComponent,
      | 'firstName'
      | 'lastName'
      | 'middleName'
      | 'phoneNumber'
      | 'ssn'
      | 'streetNumber'
      | 'streetName'
      | 'city'
      | 'state'
      | 'zipCode'
      | 'country'
    >,
    value: string | number
  ) {
    this[field] = typeof value === 'string' ? value : '';
    this.checkFormCompletion();
  }

  checkFormCompletion() {
    this.isFormComplete.set(
      Boolean(this.firstName) &&
        Boolean(this.lastName) &&
        Boolean(this.phoneNumber) &&
        Boolean(this.ssn) &&
        Boolean(this.dateOfBirth)
    );
  }

  start() {
    this.onCreditCheckDetailsProvided.emit({
      firstName: this.firstName ?? '',
      lastName: this.lastName ?? '',
      middleName: this.middleName ?? null,
      phoneNumber: this.phoneNumber ?? '',
      dateOfBirth: this.dateOfBirth ?? 0,
      ssn: this.ssn ?? '',
      streetNumber: this.streetNumber ?? '',
      streetName: this.streetName ?? '',
      city: this.city ?? '',
      state: this.state ?? '',
      zipCode: this.zipCode ?? '',
      country: this.country ?? '',
    });

    this.updatePrefillData();
  }

  // DATA API INTERACTIONS
  loadPrefillData() {
    const prefillTargetId = this.prefillTargetUserId();

    const searchParams: PrefillDataQuerySchema = {
      userId: prefillTargetId ?? '',
      keys: CREDIT_CHECK_PREFILL_FIELDS,
    };

    this.prefillDataService.searchPrefillData(searchParams).subscribe({
      next: dataUnits => {
        for (const dataUnit of dataUnits) {
          if (dataUnit.value) {
            this[dataUnit.key] = dataUnit.value;
          }
        }
        this.checkFormCompletion();
        this.loading.set(false);
      },
      error: _ => {
        this.loading.set(false);
      },
    });
  }

  updatePrefillData() {
    const prefillTargetId = this.prefillTargetUserId();
    const data: BasePrefillDataUnitSchema[] = [];

    for (const fieldName of CREDIT_CHECK_PREFILL_FIELDS) {
      const value = this[fieldName];
      if (value !== undefined && value !== null) {
        if (
          (typeof value === 'string' && value.trim() !== '') ||
          (typeof value === 'number' && !isNaN(value))
        ) {
          data.push({
            userId: prefillTargetId ?? '',
            key: fieldName,
            value,
            visibilityLevel: DataVisibilityLevels.PRIVATE,
            sourceType: PrefillSourceTypes.TASK,
            sourceId: `${prefillTargetId}-CREDIT_CHECK`,
          });
        }
      }
    }

    this.prefillDataService.upsertPrefillData(data).subscribe();
  }
}
