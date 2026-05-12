
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toMaskitoMask } from '../../../../constants/masks';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import { isPhoneNumber, phoneNumberMask } from '../../../../models/phoneNumber';
import {
  formatSSN,
  formatSSNForApi,
  isValidSSN,
  ssnMaskitoMask,
} from '../../../../models/ssn';
import { isValidEmail } from '../../../../utils/stringUtil';
import {
  readableDateFromTimestamp,
  TimeUtil,
} from '../../../../utils/timeUtil';
import { LjDateFieldComponent } from '../../../form/date-field/date-field.component';
import { LjInputFieldComponent } from '../../../form/input-field/input-field.component';

@Component({
  selector: 'lj-inline-edit-text-field',
  template: `
    <div>
      <div class="details-label">{{ label }}</div>
      @if (!enabled || !editing) {
        <div class="details-value">
          @if (type === 'date') {
            <p>{{ getDisplayDate() }}</p>
          } @else {
            <p>{{ getDisplayText() }}</p>
          }
          @if (enabled) {
            <div (activate)="editing = true" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </div>
          }
        </div>
      } @else {
        <form class="inline-edit-form">
          @if (type === 'date') {
            <lj-date-field
              type="date"
              placeholder="MM/DD/YYYY"
              [name]="name"
              [required]="required"
              [value]="valueAsDate()"
              (onInputBlur)="handleOnBlur()"
              (dateSelected)="handleDateChange($event)"
              [maxDate]="getMaxDate()"
              [customErrorMessage]="
                touched() ? getErrorMessage() : undefined
              " />
          } @else if (type === 'tel') {
            <lj-input-field
              [(ngModel)]="editValue"
              [name]="name"
              [required]="required"
              [type]="type"
              placeholder="Ex.: +1 (555) 555-5555"
              pattern="+1 ([0-9]{3}) [0-9]{3}-[0-9]{4}"
              [mask]="phoneNumberMask"
              (onInputBlur)="handleOnBlur()"
              [customErrorMessage]="
                touched() ? getErrorMessage() : undefined
              " />
          } @else if (type === 'ssn') {
            <lj-input-field
              [ngModel]="
                typeof editValue === 'string' && !editValue.includes('-')
                  ? formatSSN(editValue)
                  : editValue
              "
              (ngModelChange)="editValue = $event"
              [name]="name"
              [required]="required"
              type="text"
              placeholder="Ex.: 123-45-6789"
              [mask]="ssnMask"
              (onInputBlur)="handleOnBlur()"
              [customErrorMessage]="
                touched() ? getErrorMessage() : undefined
              " />
          } @else {
            <lj-input-field
              [(ngModel)]="editValue"
              [name]="name"
              [required]="required"
              [type]="type"
              (onInputBlur)="handleOnBlur()"
              [customErrorMessage]="
                touched() ? getErrorMessage() : undefined
              " />
          }
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
    LjDateFieldComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineEditTextFieldComponent implements OnChanges {
  private dateAdapter = inject(DateAdapter<Date>);
  phoneNumberMask = toMaskitoMask(phoneNumberMask);
  ssnMask = ssnMaskitoMask;
  formatSSN = formatSSN;

  @Input() label = '';
  @Input() required = false;
  @Input() value: string | number = '';
  @Input() name = '';
  @Input() type: 'text' | 'email' | 'tel' | 'date' | 'ssn' = 'text';
  @Input() enabled = true;
  @Output() readonly valueChange = new EventEmitter<string | number>();

  editing = false;
  editValue: string | number = '';
  touched = signal(false);

  getMaxDate(): Date {
    const today = new Date();
    return new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
  }

  valueAsDate = computed((): Date | null => {
    if (!this.editValue) {
      return null;
    }
    return TimeUtil.convertSecondTimestampToDate(
      (this.editValue as number) ?? 0
    );
  });

  getDisplayDate() {
    if (!this.value) {
      return '-';
    }

    return readableDateFromTimestamp(this.value as number);
  }

  getDisplayText() {
    if (
      !this.value ||
      (typeof this.value === 'string' && this.value.trim() === '')
    ) {
      return '-';
    }

    // Format SSN for display if it's stored without dashes
    if (this.type === 'ssn' && typeof this.value === 'string') {
      return formatSSN(this.value);
    }

    return this.value;
  }

  handleDateChange(date: Date | null) {
    this.editValue = date
      ? `${TimeUtil.convertDateToSecondTimestamp(date)}`
      : '';
  }

  handleOnBlur() {
    this.touched.set(true);

    // For SSN, strip dashes on blur (after user finishes typing)
    // This allows the mask to show dashes during typing, but we store unformatted
    if (
      this.type === 'ssn' &&
      typeof this.editValue === 'string' &&
      this.editValue
    ) {
      const unformatted = formatSSNForApi(this.editValue);
      if (unformatted !== this.editValue) {
        this.editValue = unformatted;
      }
    }
  }

  ngOnChanges() {
    if (this.type === 'date') {
      this.editValue = this.value;
    } else if (this.type === 'ssn' && this.value) {
      // Format SSN for editing if it's stored without dashes
      const formatted = formatSSN(String(this.value));
      this.editValue = formatted || '';
    } else {
      this.editValue = !this.value ? '' : this.value;
    }
  }

  getErrorMessage() {
    if (
      this.required &&
      ((typeof this.editValue === 'string' && this.editValue.trim() === '') ||
        !this.editValue)
    ) {
      return 'This field is required';
    }

    if (this.type === 'tel' && !isPhoneNumber(this.editValue)) {
      return 'This phone number is not valid';
    }

    if (this.type === 'email' && !isValidEmail(`${this.editValue}`)) {
      return 'This email is not valid';
    }

    if (this.type === 'ssn' && this.editValue) {
      const formatted = formatSSN(String(this.editValue));
      if (!isValidSSN(formatted)) {
        return 'Please enter a valid SSN';
      }
    }

    if (
      this.type === 'date' &&
      this.editValue &&
      !this.dateAdapter.isValid(
        TimeUtil.convertSecondTimestampToDate(this.editValue as number)
      )
    ) {
      return 'This date is not valid';
    }

    return undefined;
  }

  save() {
    this.touched.set(true);
    // equals no error
    if (this.getErrorMessage() === undefined) {
      // For SSN, strip dashes before saving
      let valueToSave = this.editValue;
      if (
        this.type === 'ssn' &&
        typeof this.editValue === 'string' &&
        this.editValue
      ) {
        valueToSave = formatSSNForApi(this.editValue);
      }

      this.valueChange.emit(valueToSave);
      this.value = valueToSave;
      this.editing = false;
    }
  }

  cancel() {
    this.editValue = this.value;
    this.editing = false;
  }
}
