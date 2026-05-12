import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FieldDirective } from '../../../../../directives/field.directive';
import { TimeUtil } from '../../../../../utils/timeUtil';
import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { LjDateFieldComponent } from '../../../../../web-components/form/date-field/date-field.component';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-date-field',
  templateUrl: './date-field.component.html',
  styleUrls: ['./date-field.component.scss'],
  imports: [
    FormsModule,
    LjDateFieldComponent,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatIconModule,
    CopyToClipboardButtonComponent,
  ],
  providers: [{ provide: FieldDirective, useExisting: DateFieldComponent }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateFieldComponent extends AbstractFieldComponent<number> {
  valueAsDate = computed((): Date | null => {
    const field = this.field();
    if (!field.value) {
      return null;
    }
    return TimeUtil.convertSecondTimestampToDate(field.value ?? 0);
  });

  minDate = computed((): Date | null => {
    if (this.field().parameters.dateRestriction === 'FUTURE_ONLY') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
    return null;
  });

  maxDate = computed((): Date | null => {
    if (this.field().parameters.dateRestriction === 'PAST_ONLY') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);
      return yesterday;
    }
    return null;
  });

  override getErrorKey(): ValidationErrorKey | undefined {
    const { required, value, parameters } = this.field();

    if (required && !value) {
      return ValidationErrorKey.REQUIRED;
    }

    if (value && parameters.dateRestriction) {
      const selectedDate = TimeUtil.convertSecondTimestampToDate(value);

      if (parameters.dateRestriction === 'PAST_ONLY') {
        const yesterdayEnd = new Date();
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        if (selectedDate > yesterdayEnd) {
          return ValidationErrorKey.DATE_PAST_ONLY;
        }
      }

      if (parameters.dateRestriction === 'FUTURE_ONLY') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        if (selectedDate < tomorrow) {
          return ValidationErrorKey.DATE_FUTURE_ONLY;
        }
      }

      if (
        parameters.dateRestriction === 'AGE_18_PLUS' ||
        parameters.dateRestriction === 'AGE_21_PLUS'
      ) {
        const minAge = parameters.dateRestriction === 'AGE_18_PLUS' ? 18 : 21;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - minAge);
        cutoff.setHours(23, 59, 59, 999);
        if (selectedDate > cutoff) {
          return parameters.dateRestriction === 'AGE_18_PLUS'
            ? ValidationErrorKey.AGE_18_PLUS
            : ValidationErrorKey.AGE_21_PLUS;
        }
      }
    }

    return undefined;
  }

  handleOnBlur() {
    this.touched.set(true);
  }

  getFormattedDate(): string | undefined {
    if (!this.field().value) {
      return undefined;
    }

    // mat date does not handle the timezones at all
    const formattedDateString = new Date(
      new Date((this.field().value ?? 0) * 1000).toUTCString()
    ).toISOString();

    return formattedDateString;
  }

  getDisplayDate() {
    if (!this.field().value) {
      return undefined;
    }

    return TimeUtil.convertSecondTimestampToDate(
      this.field().value ?? 0
    ).toLocaleDateString();
  }

  handleDateChange(date: Date | null) {
    const field = this.field();

    const previousValue = field.value;
    const updatedValue = date
      ? TimeUtil.convertDateToSecondTimestamp(date)
      : undefined;

    if (previousValue === updatedValue) {
      return;
    }

    this.touched.set(true);

    field.value = updatedValue;
    this.field.set(field);
    this.dataChange.emit(field);
  }
}
