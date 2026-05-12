import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ZoomService } from '../../../services/ui/zoom.service';
import { getUUID4 } from '../../../utils/stringUtil';
import { BaseControlValueAccessorComponent } from '../base-control-value-accessor/BaseControlValueAccessor';

export interface SelectOption<T> {
  label: string;
  value: T;
  disabled?: boolean;
}

@Component({
  selector: 'lj-select-field',
  imports: [MatButtonModule, MatIconModule, MatSelectModule, MatOptionModule],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.required]': 'required() || null',
    '[attr.disabled]': 'disabled() || null',
  },
})
export class LjSelectFieldComponent<
  T = string,
> extends BaseControlValueAccessorComponent<T> {
  zoomService = inject(ZoomService);

  override value = model<T | null>(null);
  options = input<SelectOption<T>[] | readonly SelectOption<T>[]>([]);

  id = input(getUUID4());
  label = input<string>();
  placeholder = input<string | null>(null);
  after = input<string>();
  before = input<string>();
  hint = input<string>();
  style = input<'normal' | 'gray'>('normal');
  readonly = input(false, {
    transform: (value: unknown) => Boolean(value),
  });
  showErrors = input(true, {
    transform: (value: unknown) => Boolean(value),
  });

  /** Shown below the field; also applies the same error border as invalid state. */
  customErrorMessage = input<string | undefined>();

  readonly change = output<T>();

  // Validations
  override required = input(false, {
    transform: (value: unknown) => {
      return Boolean(value);
    },
  });

  override writeValue(value: T | null): void {
    super.writeValue(value);
    this.value.set(value);
  }

  onSelectionChange(value: T): void {
    this.value.set(value);
    this.onChange(value);
    this.runValidation('input');
    this.change.emit(value);
  }
}
