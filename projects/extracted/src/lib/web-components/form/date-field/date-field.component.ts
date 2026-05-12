import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { type ValidationErrors, type ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInputEvent,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { isNil } from 'es-toolkit';
import { takeUntil } from 'rxjs';
import { getUUID4 } from '../../../utils/stringUtil';
import { BaseControlValueAccessorComponent } from '../base-control-value-accessor/BaseControlValueAccessor';
import {
  MDY_APP_DATE_FORMATS,
  MDYDateAdapter,
} from './custom-adapters/mdy-date-adapter';

@Component({
  selector: 'lj-date-field',
  imports: [MatButtonModule, MatDatepickerModule, MatIconModule, MatMenuModule],
  providers: [
    { provide: DateAdapter, useClass: MDYDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MDY_APP_DATE_FORMATS },
  ],
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.required]': 'required() || null',
    '[attr.disabled]': 'disabled() || null',
    '[attr.aria-invalid]': 'invalid() || null',
  },
})
export class LjDateFieldComponent
  extends BaseControlValueAccessorComponent<Date>
  implements OnInit, OnDestroy, AfterViewInit
{
  private dateAdapter = inject(DateAdapter<Date>);
  private dateFormats = inject(MAT_DATE_FORMATS);

  override value = model<Date | null>(null);
  minDate = input<number | Date | null>(null);
  maxDate = input<number | Date | null>(null);
  protected invalid = signal(false);
  protected errorsEntries = signal<Array<[string, unknown]>>([]);

  // Tracks the input field to enforce values based on the user input
  // Every time this changes, we have an effect that updates the element value
  private inputFieldValue = signal<string>('');

  // This flag avoids the datepicker from setting random dates when the user
  // enters an invalid format on the input field.
  // It is set to true when the datepicker is opened
  // and set to false when the datepicker is closed.
  private calendarMode = false;

  datePicker = viewChild(MatDatepicker<Date>);
  inputField = viewChild<HTMLInputElement, ElementRef<HTMLInputElement>>(
    'textInput',
    {
      read: ElementRef<HTMLInputElement>,
    }
  );

  type = 'text';
  id = input(getUUID4());
  triggerId = getUUID4();
  label = input<string>();
  placeholder = input<string | null>(this.dateFormats.display.dateInput);
  showError = input(true);
  customErrorMessage = input<string | undefined>();
  stripped = input<boolean>(false);
  customCssStyle = input<string>('');
  customCssTitleStyle = input<string>('');
  after = input<string>();
  before = input<string>();
  style = input<'normal' | 'gray'>('normal');
  readonly = input(false, {
    transform: (value: unknown) => Boolean(value),
  });
  readonly dateSelected = output<Date | null>();
  readonly inputBlur = output<void>();

  startAtDate = computed<Date>(() => {
    const innerValue = this.inputFieldValue();
    if (this.isValidStringDate(innerValue)) {
      return this.control?.value;
    }
    return new Date();
  });

  // Validations
  override required = input(false, {
    transform: (value: unknown) => {
      return value === '' || Boolean(value);
    },
  });

  minDateAsNumber = computed(() => {
    const minDate = this.minDate();
    return this.toNumericValue(minDate);
  });

  maxDateAsNumber = computed(() => {
    const maxDate = this.maxDate();
    return this.toNumericValue(maxDate);
  });

  minDateAsDate = computed(() => {
    const minDate = this.minDate();
    return this.toDateValue(minDate);
  });

  maxDateAsDate = computed(() => {
    const maxDate = this.maxDate();
    return this.toDateValue(maxDate);
  });

  constructor() {
    super();
    effect(() => {
      const value = this.value();
      const innerValue = this._innerFormControl?.value;
      const inputField = this.inputField()?.nativeElement;

      if (value?.getTime() !== innerValue?.getTime() && inputField) {
        const stringValue = this.toStringValue(value);
        inputField.setAttribute('value', stringValue);
        this.onInputChange({ target: inputField });
      }
    });

    effect(() => {
      const stringValue = this.inputFieldValue();
      const inputField = this.inputField();
      const element = inputField?.nativeElement;

      if (!element) {
        return;
      }

      // Update the input field value only if it has changed
      if (element.value !== stringValue) {
        element.value = stringValue;
      }
    });
  }

  ngAfterViewInit() {
    const initialNumericValue = this.value();
    const inputField = this.inputField();

    if (!inputField) {
      return;
    }

    try {
      const dateValue = this.toDateValue(initialNumericValue);
      const stringValue = this.toStringValue(dateValue);
      this.syncControlValue(dateValue);
      this.inputFieldValue.set(stringValue);
    } catch (e) {
      console.error('Error initializing date field in ngAfterViewInit:', e);
      // Fallback to a clean state
      this.syncControlValue(null);
      this.inputFieldValue.set('');
    }

    this.datePicker()
      ?.closedStream.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calendarMode = false;
      });

    this.datePicker()
      ?.openedStream.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calendarMode = true;
      });
  }

  private syncControlValue(value: Date | null) {
    const control = this.control;
    const innerValue = this.inputFieldValue();

    // Update the control value only if it has changed
    if (control && control.value?.getTime() !== value?.getTime()) {
      control.setValue(value, { emitEvent: false });
      control.markAsDirty();
      control.markAsTouched();
      this.dirty.set(true);
      this.touched.set(true);
      if (innerValue && value && this.isValidStringDate(innerValue)) {
        this.datePicker()?.select(value);
      }
    }
  }

  private isValidStringDate(date: string | null): boolean {
    if (isNil(date) || date === '') {
      return true;
    }
    const regex = /^\d{1,2}[/\-., ]\d{1,2}[/\-., ]\d{4}$/;
    const validFormat = regex.test(date);

    if (!validFormat) {
      return false;
    }

    const isValidDate = this.dateAdapter.isValid(new Date(date));
    return isValidDate;
  }

  private isValidDate(date: Date | number | null): boolean {
    if (isNil(date)) {
      return false;
    }
    if (date instanceof Date) {
      return this.dateAdapter.isValid(date);
    }
    if (typeof date === 'number') {
      return this.dateAdapter.isValid(new Date(date));
    }
    return false;
  }

  private toStringValue(date: Date | number | null): string {
    const dateValue = this.toDateValue(date);
    if (isNil(dateValue)) {
      return '';
    }
    try {
      const format = this.dateFormats.parse.dateInput;
      const value = this.dateAdapter.format(dateValue, format);
      const [month, day, year] = value.split('/');
      const paddedMonth = month?.padStart(2, '0');
      const paddedDay = day?.padStart(2, '0');
      const paddedDate =
        paddedMonth && paddedDay
          ? `${paddedMonth}/${paddedDay}/${year}`
          : value;
      return paddedDate || '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  private toNumericValue(date: Date | number | null): number | null {
    if (isNil(date) || !this.isValidDate(date)) {
      return null;
    }
    if (date instanceof Date) {
      return date.getTime();
    }
    return date;
  }

  private toDateValue(date: Date | number | null): Date | null {
    if (isNil(date) || !this.isValidDate(date)) {
      return null;
    }
    if (typeof date === 'number') {
      // TODO: This may cause errors. We should use Timezone here
      return new Date(date);
    }
    return date;
  }

  private valueChanged(value: number | null): boolean {
    const currentValue = this.value();
    if (isNil(currentValue) && isNil(value)) {
      return false;
    }
    return currentValue?.getTime() !== value;
  }

  private updateValidators(
    currentFormattedDate: string | null,
    currentDate: number | null
  ) {
    const control = this.control;
    const internalValidator: ValidatorFn = () =>
      this.validateDate(currentFormattedDate, currentDate);
    control?.setValidators([internalValidator]);
  }

  override registerOnChange(onChange: (value: Date | null) => unknown) {
    this.onChange = (value: Date | null) => {
      if (!this.calendarMode) {
        onChange(value);
      }
    };
  }

  override writeValue(value: Date | number | null): void {
    const dateValue = this.toDateValue(value);
    super.writeValue(dateValue);

    // Update the model
    this.value.set(dateValue);
    this.dirty.set(true);
    this.syncControlValue(dateValue);
  }

  private updateValue(
    stringValue: string | null,
    numericValue: number | null,
    dateValue: Date | null
  ) {
    const validationError = this.validateDate(stringValue, numericValue);
    this.updateValidators(stringValue, numericValue);

    // Update the model and notify ControlValueAccessor only if the parsed date is different
    // Avoid updating if the input string just changed but resulted in the same date object
    if (this.valueChanged(numericValue)) {
      if (this.inputFieldValue() !== stringValue) {
        this.inputFieldValue.set(stringValue ?? '');
      }
      this.dirty.set(true);
      this.value.set(validationError ? null : dateValue);
      this.control?.setValue(dateValue, { emitEvent: false });
      this.onChange(validationError ? null : dateValue);
      this.dateSelected.emit(validationError ? null : dateValue);
    }

    this._innerFormControl?.setErrors(
      validationError ? { ...validationError } : null
    );
    this.control?.setErrors(validationError ? { ...validationError } : null);
    this.invalid.set(validationError ? true : false);
    this.errorsEntries.set(Object.entries(validationError ?? {}));
  }

  /**
   * Handles date selection FROM the MatDatepicker calendar/toggle.
   */
  dateChanged(event: MatDatepickerInputEvent<Date>) {
    if (!this.calendarMode) {
      return;
    }
    const dateValue = this.toDateValue(event.value);
    const numericValue = this.toNumericValue(event.value);
    const stringValueForInput = this.toStringValue(dateValue);
    this.updateValue(stringValueForInput, numericValue, dateValue);

    // Check if the value actually changed to avoid redundant updates
    if (this.valueChanged(numericValue)) {
      this.runValidation('change');
    }
  }

  private parseStringValue(rawValue: string | null): {
    dateValue: Date | null;
    numericValue: number | null;
  } {
    const dateCanBeParsed = this.isValidStringDate(rawValue);
    const format = this.dateFormats.parse.dateInput;
    const valueFromDateAdapter = dateCanBeParsed
      ? this.dateAdapter.parse(rawValue, format)
      : null;

    const dateValue = this.toDateValue(valueFromDateAdapter);
    const numericValue = this.toNumericValue(valueFromDateAdapter);
    return { dateValue, numericValue };
  }

  /**
   * Handles direct user input INTO the text field.
   */
  override onInputChange(event: Event | { target: HTMLInputElement }): void {
    const inputElement = event.target as HTMLInputElement;
    const rawValue = inputElement.value;

    if (this.inputFieldValue() !== rawValue) {
      this.inputFieldValue.set(rawValue);
    }

    const { dateValue, numericValue } = this.parseStringValue(rawValue);
    this.updateValue(rawValue, numericValue, dateValue);

    // Trigger validation after a short delay
    setTimeout(() => this.runValidation('input'), 0);
  }

  validateDate(
    formattedDate: string | null,
    numericDate: number | null
  ): ValidationErrors | null {
    const required = this.required();
    const minDate = this.minDateAsNumber();
    const maxDate = this.maxDateAsNumber();

    if (!this.isValidStringDate(formattedDate)) {
      return { invalidDate: true };
    }
    if (minDate && numericDate && numericDate < minDate) {
      return { minDate: true };
    }
    if (maxDate && numericDate && numericDate > maxDate) {
      return { maxDate: true };
    }
    if (required && !numericDate) {
      return { required: true };
    }
    return null;
  }

  protected override getErrorMessage(
    errorKey: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorValue: any
  ): string {
    switch (errorKey) {
      case 'required':
        return 'This field is required';
      case 'minDate':
        return `Date must be on or after ${this.dateAdapter.format(
          this.minDateAsDate(),
          this.dateFormats.display.dateInput
        )}`;
      case 'maxDate':
        return `Date must be on or before ${this.dateAdapter.format(
          this.maxDateAsDate(),
          this.dateFormats.display.dateInput
        )}`;
      case 'invalidDate':
        return 'Invalid date format';
    }
    return super.getErrorMessage(errorKey, errorValue);
  }

  handleOnBlur(): void {
    const inputField = this.inputField()?.nativeElement;
    const rawValue = this.inputFieldValue();
    const stringValue = this.isValidStringDate(rawValue)
      ? this.toStringValue(this.value())
      : rawValue;
    const { numericValue } = this.parseStringValue(stringValue);

    if (inputField) {
      /** Avoid the value from being changed when the user leaves the input field. */
      inputField.value = stringValue;
    }

    this.onTouched();
    this.inputBlur.emit();

    const validationError = this.validateDate(stringValue, numericValue);
    this.updateValidators(stringValue, numericValue);
    this._innerFormControl?.setErrors(
      validationError ? { ...validationError } : null
    );
    this.control?.setErrors(validationError ? { ...validationError } : null);
    this.invalid.set(validationError ? true : false);
    this.errorsEntries.set(Object.entries(validationError ?? {}));

    this.runValidation('change');
  }
}
