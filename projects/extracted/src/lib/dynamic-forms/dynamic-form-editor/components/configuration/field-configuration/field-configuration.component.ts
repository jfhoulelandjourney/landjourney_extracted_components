import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import type { Field } from '../../../../../services/products/fields/fields.models';
import { FieldsService } from '../../../../../services/products/fields/fields.service';
import { LjSelectComponent } from '../../../../../web-components/form/select/select.component';
import {
  DynamicFormFieldTypes,
  type ComputedOutputType,
  type DynamicFormField,
} from '../../../../models/dynamic-forms.models';
import type {
  NoteFieldModel,
  NoteVariant,
} from '../../../../models/fields.models';
import { EditableInputComponent } from '../editable-input/editable-input.component';

type PrefillKeyOption = {
  id: string;
  value: string;
  label: string;
};

@Component({
  selector: 'lj-field-configuration',
  imports: [
    MatIcon,
    MatButtonModule,
    ActivateDirective,
    MatTooltipModule,
    MatSlideToggle,
    EditableInputComponent,
    MatSelectModule,
    MatMenuModule,
    LjSelectComponent,
  ],
  templateUrl: './field-configuration.component.html',
  styleUrl: './field-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldConfigurationComponent implements OnDestroy {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger | undefined;
  private fieldsService = inject(FieldsService);
  private prefillSearch$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  field = input.required<DynamicFormField<unknown>>();
  options = input.required<{
    required: boolean;
    inputType: boolean;
    minMaxLength: boolean;
    minMaxValue: boolean;
    conditionalLogic: boolean;
    decimalPrecision: boolean;
    validator: boolean;
    privacy?: boolean;
    prefillable: boolean;
    visible: boolean;
    dateRestriction?: boolean;
    computedOutputType?: boolean;
    variant?: boolean;
  }>();

  readonly handleFieldChange = output<DynamicFormField<unknown>>();
  readonly addConditionalLogic = output<void>();
  readonly remove = output<void>();
  prefillKeySearchTerm = signal<string>('');
  prefillKeyOptions = signal<PrefillKeyOption[]>([]);
  prefillKeyLoading = signal<boolean>(false);
  showPrefillDropdown = signal<boolean>(false);
  prefillKeyFocusIndex = signal<number>(-1);
  private prefillBlurTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.prefillSearch$
      .pipe(
        map(term => term.trim()),
        distinctUntilChanged(),
        debounceTime(200),
        switchMap(term => this.searchPrefillKeys(term)),
        takeUntil(this.destroy$)
      )
      .subscribe(options => {
        this.prefillKeyOptions.set(options);
        this.prefillKeyFocusIndex.set(-1);
      });
  }

  handleRequiredChange(checked: boolean) {
    this.handleFieldChange.emit({
      ...this.field(),
      required: checked,
    });
  }

  handleVisibleChange(checked: boolean) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: { ...this.field().parameters, visible: checked },
    });
  }

  handlePrefillableChange(checked: boolean) {
    if (!checked) {
      this.prefillKeySearchTerm.set('');
      this.prefillKeyOptions.set([]);
      this.prefillKeyLoading.set(false);
      this.showPrefillDropdown.set(false);
    }

    this.handleFieldChange.emit({
      ...this.field(),
      prefillable: checked,
      prefillSourceKey: checked ? this.field().prefillSourceKey : undefined,
    });
  }

  handlePrefillSourceKeyChange(value: string | number) {
    const prefillSourceKey = `${value}`.trim() || undefined;

    this.handleFieldChange.emit({
      ...this.field(),
      prefillSourceKey: prefillSourceKey,
    });

    this.prefillKeySearchTerm.set(prefillSourceKey ?? '');
  }

  handlePrefillSourceKeySearch(value: string | null) {
    const searchTerm = value ?? '';
    this.prefillKeySearchTerm.set(searchTerm);
    this.showPrefillDropdown.set(true);
    if (searchTerm.trim() === '') {
      this.prefillKeyOptions.set([]);
      this.prefillKeyLoading.set(false);
      return;
    }
    this.prefillSearch$.next(searchTerm);
  }

  handlePrefillSourceKeyDown(event: KeyboardEvent) {
    const options = this.getPrefillSourceKeyOptions();
    const current = this.prefillKeyFocusIndex();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      const next = Math.min(current + 1, options.length - 1);
      this.prefillKeyFocusIndex.set(next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      const prev = Math.max(current - 1, 0);
      this.prefillKeyFocusIndex.set(prev);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      const focused = options[current];
      if (focused) {
        this.handlePrefillSourceKeyOptionClick(focused.value);
      }
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      this.showPrefillDropdown.set(false);
      this.prefillKeyOptions.set([]);
      this.prefillKeySearchTerm.set('');
      this.prefillKeyFocusIndex.set(-1);
    } else {
      event.stopPropagation();
    }
  }

  handlePrefillSourceKeyFocus() {
    if (this.prefillBlurTimeout) {
      clearTimeout(this.prefillBlurTimeout);
      this.prefillBlurTimeout = undefined;
    }
    this.prefillKeySearchTerm.set(this.field().prefillSourceKey ?? '');
    this.showPrefillDropdown.set(true);
  }

  handlePrefillSourceKeyBlur(event: FocusEvent) {
    this.prefillBlurTimeout = setTimeout(() => {
      this.showPrefillDropdown.set(false);
      this.prefillKeyOptions.set([]);
    }, 150);
    const target = event.target;
    const value = target instanceof HTMLInputElement ? target.value : '';
    this.handlePrefillSourceKeyChange(value);
  }

  handlePrefillSourceKeyOptionClick(value: string) {
    if (this.prefillBlurTimeout) {
      clearTimeout(this.prefillBlurTimeout);
      this.prefillBlurTimeout = undefined;
    }
    this.handleFieldChange.emit({
      ...this.field(),
      prefillSourceKey: value.trim() || undefined,
    });
    this.prefillKeySearchTerm.set('');
    this.prefillKeyOptions.set([]);
    this.showPrefillDropdown.set(false);
  }

  getPrefillSourceKeyInputValue(): string {
    if (this.showPrefillDropdown()) {
      return this.prefillKeySearchTerm();
    }
    return this.field().prefillSourceKey ?? '';
  }

  getPrefillSourceKeyOptions(): PrefillKeyOption[] {
    if (this.prefillKeySearchTerm().trim() === '') {
      return [];
    }

    return this.prefillKeyOptions();
  }

  private searchPrefillKeys(term: string) {
    this.prefillKeyLoading.set(true);
    return this.fieldsService.getFields({ search: term }).pipe(
      map(response =>
        (response.items ?? []).map((field: Field) => ({
          id: field.id ?? field.name,
          value: field.name,
          label: field.label,
        }))
      ),
      map(options => {
        this.prefillKeyLoading.set(false);
        return options;
      }),
      catchError(() => {
        this.prefillKeyLoading.set(false);
        return of([] as PrefillKeyOption[]);
      })
    );
  }

  handleNameChange(name: string | number) {
    this.handleFieldChange.emit({
      ...this.field(),
      name: `${name}`,
    });
  }

  handleValidatorChange(validator: string | number) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        validator: `${validator}`.trim() || undefined,
      },
    });
  }

  handlePrivacyChange(value: string) {
    const privacy = value === 'true';

    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        privacy: privacy || undefined,
      },
    });
  }

  handleInputTypeChange(type: 'text' | 'email' | 'tel' | 'ssn') {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        type: type,
        minimumLength:
          type !== 'text' ? undefined : this.field().parameters.minimumLength,
        maximumLength:
          type !== 'text' ? undefined : this.field().parameters.maximumLength,
      },
    });
  }

  handleMinLengthChange(minimumLength: string | number) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        minimumLength:
          typeof minimumLength === 'string'
            ? parseInt(minimumLength, 10)
            : minimumLength,
      },
    });
  }

  handleMaxLengthChange(maximumLength: string | number) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        maximumLength:
          typeof maximumLength === 'string'
            ? parseInt(maximumLength, 10)
            : maximumLength,
      },
    });
  }

  handleMinValueChange(minimumValue: string | number) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        minimumValue:
          typeof minimumValue === 'string'
            ? parseInt(minimumValue, 10)
            : minimumValue,
      },
    });
  }

  handleMaxValueChange(maximumValue: string | number) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        maximumValue:
          typeof maximumValue === 'string'
            ? parseInt(maximumValue, 10)
            : maximumValue,
      },
    });
  }

  handleDecimalPrecisionChange(decimalPrecision: string | number) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        decimalPrecision:
          typeof decimalPrecision === 'string'
            ? parseInt(decimalPrecision, 10)
            : decimalPrecision,
      },
    });
  }

  handleVariantChange(value: NoteVariant) {
    const f = this.field();
    if (f.fieldType === DynamicFormFieldTypes.NOTE) {
      const current = (f.value as NoteFieldModel | undefined) ?? {
        variant: 'neutral',
        note: '',
      };
      this.handleFieldChange.emit({
        ...f,
        value: {
          ...current,
          variant: value === 'neutral' ? 'neutral' : value,
        },
      });
      return;
    }
  }

  noteFieldVariant(f: DynamicFormField<unknown>): NoteVariant {
    if (f.fieldType !== DynamicFormFieldTypes.NOTE) {
      return 'neutral';
    }
    const v = f.value as NoteFieldModel | undefined;
    return v?.variant ?? 'neutral';
  }

  handleDateRestrictionChange(
    value: 'PAST_ONLY' | 'FUTURE_ONLY' | 'AGE_18_PLUS' | 'AGE_21_PLUS' | ''
  ) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        dateRestriction: value || undefined,
      },
    });
  }

  handleComputedOutputTypeChange(value: ComputedOutputType) {
    this.handleFieldChange.emit({
      ...this.field(),
      parameters: {
        ...this.field().parameters,
        computedOutputType: value,
      },
    });
  }

  addDisplayCondition() {
    this.trigger?.closeMenu();
    this.addConditionalLogic.emit();
  }

  removeItem() {
    this.trigger?.closeMenu();
    this.remove.emit();
  }

  ngOnDestroy() {
    if (this.prefillBlurTimeout) {
      clearTimeout(this.prefillBlurTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
    this.prefillSearch$.complete();
  }
}
