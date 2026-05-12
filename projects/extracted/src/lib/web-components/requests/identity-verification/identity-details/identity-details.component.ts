
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
  IDENTITY_VERIFICATION_PREFILL_FIELDS,
  PrefillSourceTypes,
} from '../../../../services/data/enums/prefill-data.enums';
import type { IdentityVerificationDetails } from '../../../../services/data/models/identity-verification.models';
import type { PrefillDataQuerySchema } from '../../../../services/data/models/prefill-data-unit-query.models';
import type { BasePrefillDataUnitSchema } from '../../../../services/data/models/prefill-data-unit.models';
import { PrefillDataService } from '../../../../services/data/prefill-data.service';
import { OrganizationService } from '../../../../services/organization/organization.service';
import { US_STATES_DROPDOWN } from '../../../../utils/statesUtils';
import { InlineEditAddressFieldComponent } from './inline-edit-address-fields.components';
import { InlineEditTextFieldComponent } from './inline-edit-text-field.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-identity-details',
  templateUrl: './identity-details.component.html',
  styleUrls: ['./identity-details.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    FormsModule,
    InlineEditTextFieldComponent,
    NgxSkeletonLoaderModule,
    InlineEditAddressFieldComponent
],
})
export class IdentityDetailsComponent implements OnInit {
  organizationService = inject(OrganizationService);
  prefillDataService = inject(PrefillDataService);
  prefillTargetUserId = input<string | undefined>(undefined);

  loading = signal(true);

  isMobile = input(false);
  name = input.required<string>();
  readonly onIdentityDetailsProvided = output<IdentityVerificationDetails>();
  readonly onBack = output();

  isFormComplete = signal(false);

  [key: string]: unknown;

  firstName = '';
  lastName = '';
  middleName = '';
  phoneNumber = '';
  dateOfBirth = 0;
  ssn = '';
  email = '';
  streetNumber = '';
  streetName = '';
  city = '';
  state = '';
  zipCode = '';
  country = '';

  enable_firstName = true;
  enable_lastName = true;
  enable_middleName = true;
  enable_phoneNumber = true;
  enable_dateOfBirth = true;
  enable_ssn = true;
  enable_streetNumber = true;
  enable_streetName = true;
  enable_city = true;
  enable_state = true;
  enable_zipCode = true;
  enable_country = true;

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
      | 'email'
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
        Boolean(this.email) &&
        Boolean(this.dateOfBirth)
    );
  }

  start() {
    this.onIdentityDetailsProvided.emit({
      organizationUserId: this.prefillTargetUserId() ?? '',
      firstName: this.firstName ?? '',
      lastName: this.lastName ?? '',
      middleName: this.middleName ?? null,
      phoneNumber: this.phoneNumber ?? null,
      dateOfBirth: this.dateOfBirth ?? 0,
      ssn: this.ssn ?? null,
      streetNumber: this.streetNumber ?? null,
      streetName: this.streetName ?? null,
      city: this.city ?? null,
      state: this.state ?? null,
      zipCode: this.zipCode ?? null,
      country: this.country ?? null,
      email: this.email ?? '',
    });

    this.updatePrefillData();
  }

  // DATA API INTERACTIONS
  loadPrefillData() {
    const prefillTargetId = this.prefillTargetUserId();

    const searchParams: PrefillDataQuerySchema = {
      userId: prefillTargetId ?? '',
      keys: IDENTITY_VERIFICATION_PREFILL_FIELDS,
    };

    this.prefillDataService.searchPrefillData(searchParams).subscribe({
      next: dataUnits => {
        for (const dataUnit of dataUnits) {
          if (dataUnit.value) {
            if (dataUnit.key === 'state') {
              // Look up state abbreviation from US_STATES_DROPDOWN
              const stateValue = String(dataUnit.value).toLowerCase();
              const stateEntry = US_STATES_DROPDOWN.find(
                (state: { label: string; value: string }) =>
                  state.value.toLowerCase() === stateValue ||
                  state.label.toLowerCase() === stateValue
              );
              this.state = stateEntry?.value ?? String(dataUnit.value);
            } else {
              this[dataUnit.key] = dataUnit.value;
            }

            this['enable_' + dataUnit.key] = false;
          } else {
            this['enable_' + dataUnit.key] = true;
          }
        }

        this.checkFormCompletion();
        this.loading.set(false);
      },
      error: _ => {
        this.loading.set(false);
      },
    });

    this.email = `identity-verification+${prefillTargetId}@landjourney.ai`;
  }

  updatePrefillData() {
    const prefillTargetId = this.prefillTargetUserId();
    const data: BasePrefillDataUnitSchema[] = [];

    for (const fieldName of IDENTITY_VERIFICATION_PREFILL_FIELDS) {
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
            sourceId: `${prefillTargetId}-ID_VERIFICATION`,
          });
        }
      }
    }

    this.prefillDataService.upsertPrefillData(data).subscribe();
  }
}
