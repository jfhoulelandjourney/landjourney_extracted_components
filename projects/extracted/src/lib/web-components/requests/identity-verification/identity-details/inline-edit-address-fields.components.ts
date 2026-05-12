import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import {
  COUNTRY_DROPDOWN,
  US_STATES_DROPDOWN,
} from '../../../../utils/statesUtils';
import { LjInputFieldComponent } from '../../../form/input-field/input-field.component';
import { LjSelectFieldComponent } from '../../../form/select-field/select-field.component';

@Component({
  selector: 'lj-inline-edit-address-fields',
  template: `
    <div>
      <div class="details-label">Address</div>
      @if (!enabled || !editing) {
        <div class="details-value">
          <p>{{ getDisplayAddress() }}</p>
          @if (enabled) {
            <div (activate)="editing = true" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </div>
          }
        </div>
      } @else {
        <form class="inline-edit-form">
          <div class="address-fields">
            <lj-input-field
              [value]="editValue.streetNumber"
              (valueChange)="editValue.streetNumber = $event ?? ''"
              name="streetNumber"
              type="text"
              placeholder="Street Number" />
            <lj-input-field
              [value]="editValue.streetName"
              (valueChange)="editValue.streetName = $event ?? ''"
              name="streetName"
              type="text"
              placeholder="Street Name" />
            <lj-input-field
              [value]="editValue.city"
              (valueChange)="editValue.city = $event ?? ''"
              name="city"
              type="text"
              placeholder="City" />
            <lj-select-field
              [value]="editValue.state"
              (change)="editValue.state = $event"
              [options]="US_STATES_DROPDOWN"
              name="state"
              [showErrors]="false"
              placeholder="State" />
            <lj-input-field
              [value]="editValue.zipCode"
              (valueChange)="editValue.zipCode = $event ?? ''"
              name="zipCode"
              type="text"
              placeholder="Zip Code" />
            <lj-select-field
              [value]="editValue.country"
              (change)="editValue.country = $event"
              [options]="COUNTRY_DROPDOWN"
              name="country"
              [showErrors]="false"
              placeholder="Country" />
          </div>
          <div (activate)="save()" matTooltip="Save" class="button">
            <mat-icon>check</mat-icon>
          </div>
          <div (activate)="cancel()" matTooltip="Cancel" class="button">
            <mat-icon>close</mat-icon>
          </div>
        </form>
      }
    </div>
  `,
  styles: [
    `
      .inline-edit-form {
        display: flex;
        align-items: flex-start;
        gap: var(--padding-comfortable);
      }
      .address-fields {
        display: flex;
        flex-direction: column;
        gap: var(--padding-comfortable);
        flex-grow: 1;
      }
      .details-label {
        color: var(--accent-black-500, #7d7d7d);
        font-family: Inter;
        font-size: var(--font-size-xxs);
        font-style: normal;
        font-weight: 400;
      }
      .details-value {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: var(--padding-comfortable);
      }
      .details-value p {
        padding-left: var(--padding-comfortable);
        flex-grow: 1;
        color: var(--accent-black-700, #303030);
        font-family: Inter;
        font-size: var(--font-size-sm);
        font-style: normal;
        font-weight: 400;
      }
      mat-icon {
        cursor: pointer;
      }
      .button {
        padding-top: var(--padding-comfortable);
      }
    `,
  ],
  imports: [
    FormsModule,
    MatIconModule,
    LjInputFieldComponent,
    ActivateDirective,
    MatTooltipModule,
    LjSelectFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineEditAddressFieldComponent implements OnInit {
  COUNTRY_DROPDOWN = COUNTRY_DROPDOWN;
  US_STATES_DROPDOWN = US_STATES_DROPDOWN;
  @Input() enabled = true;
  @Input() address: {
    streetNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } = {
    streetNumber: '',
    streetName: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  };

  @Output() readonly valueChange = new EventEmitter<{
    streetNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>();

  editing = false;
  editValue: {
    streetNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } = {
    streetNumber: '',
    streetName: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  };

  ngOnInit() {
    this.editValue = this.address;
  }

  getDisplayAddress() {
    const parts = [
      this.address.streetNumber,
      this.address.streetName,
      this.address.city,
      this.address.state,
      this.address.zipCode,
      this.address.country,
    ].filter(Boolean);
    return parts.join(', ') === '' ? '-' : parts.join(', ');
  }

  save() {
    this.valueChange.emit(this.editValue);
    this.address = this.editValue;
    this.editing = false;
  }

  cancel() {
    this.editValue = this.address;
    this.editing = false;
  }
}
