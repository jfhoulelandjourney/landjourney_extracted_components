import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  signal,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionSelectionChange } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MaskitoDirective } from '@maskito/angular';
import { MaskitoOptions, maskitoTransform } from '@maskito/core';
import { isNil, isString } from 'es-toolkit';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AvatarComponent } from '../../../design-system';
import { ContainerDimensionsDirective } from '../../../directives/container-dimensions/container-dimensions.directive';
import { getUUID4 } from '../../../utils/stringUtil';
import { BaseControlValueAccessorComponent } from '../base-control-value-accessor/BaseControlValueAccessor';

export interface AutocompleteOption<T = string> {
  id: string;
  value: T;
  avatarUri?: string;
  icon?: string;
  disabled?: boolean;
}

export interface AutocompleteOptionGroup<T = string> {
  group: string;
  disabled?: boolean;
  options: AutocompleteOption<T>[];
}

@Component({
  selector: 'lj-input-field',
  imports: [
    MatButtonModule,
    MatIconModule,
    MaskitoDirective,
    MatMenuModule,
    MatAutocompleteModule,
    AvatarComponent,
    NgxSkeletonLoaderModule,
    ContainerDimensionsDirective,
  ],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.required]': 'isRequired()',
    '[attr.disabled]': 'disabled() || null',
  },
})
export class LjInputFieldComponent<T = string>
  extends BaseControlValueAccessorComponent<string>
  implements OnInit, OnChanges, OnDestroy
{
  private isFirstRun = true;
  protected NO_GROUP_HOLDER = '__no-group-holder__';
  override value = model<string | null>(null);
  maskDirective = viewChild(MaskitoDirective);

  id = input(getUUID4());
  triggerId = getUUID4();
  label = input<string>();
  placeholder = input<string | null>(null);
  showError = input(true);
  customErrorMessage = input<string | undefined>();
  stripped = input<boolean>(false);
  autocomplete = input<boolean>(false);
  autocompleteDisplayWith = input<(value: T) => string | undefined>();
  autocompleteOptionsLoading = input<boolean>(false);
  autocompleteOptions = input<
    (AutocompleteOption<T> | AutocompleteOptionGroup<T>)[]
  >([]);
  readonly autocompleteOptionClick = output<AutocompleteOption<T>>();
  customCssStyle = input<string>('');
  customCssTitleStyle = input<string>('');
  data1PasswordIgnore = input<boolean>(false, {
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: 'data-1p-ignore',
  });
  dataLpIgnore = input<boolean>(false, {
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: 'data-lp-ignore',
  });

  normalizedOptions = computed(() => {
    const options = this.autocompleteOptions();
    const noGroup = {
      group: this.NO_GROUP_HOLDER,
      options: [] as AutocompleteOption<T>[],
    };
    const response = [];
    for (const option of options) {
      if ('group' in option) {
        response.push({
          group: option.group,
          options: option.options.map(
            opt =>
              ({
                ...opt,
                disabled: opt.disabled ?? option.disabled ?? false,
                value:
                  typeof opt.value === 'string'
                    ? (opt.value.trim() as T)
                    : opt.value,
              }) satisfies AutocompleteOption<T>
          ),
        });
      } else {
        noGroup.options.push({
          ...option,
          value:
            typeof option.value === 'string'
              ? (option.value.trim() as T)
              : option.value,
        } satisfies AutocompleteOption<T>);
      }
    }
    if (noGroup.options.length > 0) {
      response.push(noGroup);
    }
    return response;
  });

  // TODO: Allow other types
  type = input<'text' | 'email' | 'tel' | 'number' | 'date'>('text');
  after = input<string>();
  before = input<string>();
  style = input<'normal' | 'gray'>('normal');
  readonly = input(false, {
    transform: (value: unknown) => Boolean(value),
  });
  readonly onInputFocus = output<FocusEvent>();
  readonly onInputBlur = output<FocusEvent>();

  inputField = viewChild<HTMLInputElement, ElementRef<HTMLInputElement>>(
    'inputField',
    {
      read: ElementRef,
    }
  );

  // Validations
  override required = input(false, {
    transform: (value: unknown) => {
      return Boolean(value);
    },
  });
  pattern = input<string | null>(null);
  minlength = input<number | null>(null);
  maxlength = input<number | null>(null);

  minValue = input<number | null>(null);
  maxValue = input<number | null>(null);
  previousValue = signal<string>('');

  // Mask-related inputs
  mask = input<MaskitoOptions | null>(null);

  override writeValue(value: string | null): void {
    // Maskito doesn't format value before some interaction
    // so we force it manually here
    // Also, formatting against ngModel may not work correctly, so we also need this on this case

    if (!isNil(value) && this.isFirstRun) {
      const maskOptions = this.mask();
      const formattedValue =
        isNil(value) || value === '' || !maskOptions
          ? value
          : maskitoTransform(value, maskOptions);
      super.writeValue(formattedValue);
      this.value.set(formattedValue);
      this.isFirstRun = false;
      return;
    }

    super.writeValue(value);
    this.value.set(value);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mask']) {
      // Trigger validation when mask-related inputs change
      this.runValidation('immediate');
    }
  }

  setEventTargetValue(event: Event, value: string) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if ('value' in target) {
      target.value = value;
    }
  }

  getParsedNumberValue(event: Event): number | null {
    try {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return null;
      }

      const value = 'value' in target ? (target.value as number) : null;

      const minValue = this.minValue();
      const maxValue = this.maxValue();

      if (value && minValue) {
        if (value < minValue) {
          return null;
        }
      }

      if (value && maxValue) {
        if (value > maxValue) {
          return null;
        }
      }

      return value;
    } catch (error) {
      console.error('Invalid number input', error);
      return null;
    }
  }

  isValidNumber(event: Event) {
    try {
      const value = this.getParsedNumberValue(event);

      if (!value) {
        return false;
      }

      const minValue = this.minValue();
      const maxValue = this.maxValue();

      if (minValue) {
        if (value < minValue) {
          return false;
        }
      }

      if (maxValue) {
        if (value > maxValue) {
          return false;
        }
      }

      const formattedValue = parseInt(`${value}`).toString();

      this.previousValue.set(formattedValue);
      this.setEventTargetValue(event, formattedValue);

      return true;
    } catch (error) {
      console.error('Invalid number input', error);
      return false;
    }
  }

  onInput(event: Event) {
    if (this.type() === 'number') {
      if (!this.isValidNumber(event)) {
        this.value.set(this.previousValue());
        this.setEventTargetValue(event, this.previousValue());
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
  }

  override onInputChange(event: Event): void {
    if (this.type() === 'email') {
      const target = event.target as HTMLInputElement | null;
      if (target?.value) {
        const trimmed = target.value.trim();
        if (trimmed !== target.value) {
          target.value = trimmed;
        }
      }
    }
    super.onInputChange(event);

    if (this.mask()) {
      // Trigger validation after a short delay to ensure mask has been applied
      setTimeout(() => {
        this.runValidation('input');
      }, 0);
    }
  }

  override onBlur(event: Event): void {
    if (this.type() === 'email') {
      const target = event.target as HTMLInputElement | null;
      if (target?.value) {
        const trimmed = target.value.trim();
        if (trimmed !== target.value) {
          target.value = trimmed;
        }
      }
    }
    super.onBlur(event);
  }

  handleOnBlur(event: FocusEvent) {
    this.onInputBlur.emit(event);
  }

  handleOptionChange(
    event: MatOptionSelectionChange,
    option: AutocompleteOption<T>
  ) {
    if (event.isUserInput && event.source.selected) {
      this.autocompleteOptionClick.emit(option);
    }
  }

  handleOnFocus(event: FocusEvent) {
    this.onInputFocus.emit(event);
  }

  setSelectionRange(start: number, end: number) {
    this.inputField()?.nativeElement?.setSelectionRange(start, end);
  }

  isRequired(): boolean {
    if (this.required()) {
      return true;
    }

    const control = this.control;

    if (control?.disabled) {
      return false;
    }

    if (control && control.validator) {
      const validator = control.validator({} as AbstractControl);
      if (validator && validator.required) {
        return true;
      }
    }

    return false;
  }

  getAvatarName(value?: T): string {
    if (isNil(value)) {
      return '';
    }

    if (isString(value)) {
      return value;
    }

    return '';
  }
}
