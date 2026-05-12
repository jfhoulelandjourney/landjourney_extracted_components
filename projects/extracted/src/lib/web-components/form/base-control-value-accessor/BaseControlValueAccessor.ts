import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  OnDestroy,
  OnInit,
  Renderer2,
  signal,
  untracked,
} from '@angular/core';
import {
  ControlContainer,
  ControlValueAccessor,
  FormControl,
  FormControlDirective,
  FormControlName,
  FormGroup,
  FormGroupDirective,
  NG_VALUE_ACCESSOR,
  NgControl,
  NgModel,
  Validators,
} from '@angular/forms';
import { isUndefined, noop } from 'es-toolkit';
import { debounce, filter, Subject, takeUntil, timer } from 'rxjs';

/**
 * Custom error type for form control errors
 */
export class FormControlError extends Error {
  public readonly errorCode: string;
  public readonly controlName?: string;

  constructor(
    message: string,
    options?: {
      cause?: unknown;
      errorCode?: string;
      controlName?: string;
    }
  ) {
    super(message, options);
    this.name = 'FormControlError';
    this.errorCode = options?.errorCode ?? '';
    this.controlName = options?.controlName;
  }
}

/** Events that trigger validation */
export type ValidationEventTrigger = 'input' | 'change' | 'submit';

/** Internal events that trigger validation */
export type InternalValidationEventTrigger =
  | 'immediate'
  | ValidationEventTrigger;

/** Configuration for validation triggers and timing */
export type ValidationConfiguration = {
  triggers: ValidationEventTrigger[];
  /* Debounce time for input validation in milliseconds */
  inputDebounceTime: number;
};

export type ValidationConfigurationInput =
  | ValidationConfiguration
  | ValidationEventTrigger[];

/**
 * Base component implementing ControlValueAccessor for Angular forms compatibility.
 * This component serves as a foundation for creating custom form controls that work seamlessly
 * with both Reactive Forms and Template-driven Forms in Angular.
 *
 * @template T The type of value this control handles
 *
 * Features:
 * - Compatible with Reactive and Template-driven forms
 * - Handles validation states and errors
 * - Supports custom validation
 * - Manages form control states (pristine/dirty, touched/untouched)
 * - Configurable validation triggers
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-input',
 *   template: `
 *     <input
 *       [value]="value()"
 *       [disabled]="disabled()"
 *       (input)="onInputChange($event.target.value)"
 *       (blur)="onBlur()"
 *     />
 *     <div *ngIf="errors" class="error-messages">
 *       <span *ngFor="let error of errors | keyvalue">
 *         {{ getErrorMessage(error.key, error.value) }}
 *       </span>
 *     </div>
 *   `
 * })
 * export class CustomInputComponent extends BaseControlValueAccessorComponent<string> {
 *   // Override getErrorMessage for custom error messages
 *   protected override getErrorMessage(errorKey: string, errorValue: any): string {
 *     switch (errorKey) {
 *       case 'required':
 *         return 'This field is required';
 *       case 'minlength':
 *         return `Minimum length is ${errorValue.requiredLength}`;
 *       default:
 *         return super.getErrorMessage(errorKey, errorValue);
 *     }
 *   }
 * }
 * ```
 *
 * @example
 * ```html
 * <!-- Template-driven form usage -->
 * <form #form="ngForm" (ngSubmit)="onSubmit()">
 *   <app-custom-input
 *     [(ngModel)]="value"
 *     name="customInput"
 *     required
 *     [validationConfiguration]="{ triggers: ['change'], inputDebounceTime: 300 }"
 *   ></app-custom-input>
 * </form>
 *
 * <!-- Reactive form usage -->
 * <form [formGroup]="form" (ngSubmit)="onSubmit()">
 *   <app-custom-input
 *     formControlName="customInput"
 *     [validationConfiguration]="{ triggers: ['input', 'submit'] }"
 *   ></app-custom-input>
 * </form>
 * ```
 *
 * @implements {ControlValueAccessor}
 * @implements {OnInit}
 * @implements {OnDestroy}
 */
@Component({
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => BaseControlValueAccessorComponent),
    },
  ],
})
export class BaseControlValueAccessorComponent<T>
  implements ControlValueAccessor, OnInit, OnDestroy
{
  protected renderer = inject(Renderer2);
  protected elementRef = inject(ElementRef);
  protected injector = inject(Injector);
  protected cdr = inject(ChangeDetectorRef);

  protected _innerFormControl: FormControl | null = null;
  protected destroy$ = new Subject<void>();
  private abortController: AbortController | null = null;
  private valueChangeSubject = new Subject<{
    value: T | null;
    eventType: InternalValidationEventTrigger;
    configuration: ValidationConfiguration;
    control: FormControl | null;
  }>();

  /**
   * Default validation configuration
   * @private
   */
  private defaultValidationConfig = () =>
    ({
      triggers: ['change', 'input', 'submit'],
      inputDebounceTime: 0,
    }) satisfies ValidationConfiguration;

  /** Current value of the control */
  value = model<T | null>(null);

  protected ngControl: NgControl | null = null;
  protected controlContainer: ControlContainer | null = null;

  protected get control(): FormControl | null {
    return this.getControl() as FormControl | null;
  }

  /** Disabled state of the control */
  disabled = model(false);

  /** Required name for the control */
  name = input.required<string>();

  /** Whether the control is required */
  required = input(false, {
    transform: (value: unknown) => Boolean(value),
  });
  private _previousRequiredValue?: boolean;

  /** Configuration for validation behavior */
  validationConfiguration = input(this.defaultValidationConfig(), {
    transform: (
      value: ValidationConfigurationInput
    ): ValidationConfiguration => {
      let _value = {};

      if (Array.isArray(value)) {
        _value = { triggers: value };
      }

      if (typeof value === 'object') {
        _value = value ?? {};
      }

      return {
        ...this.defaultValidationConfig(),
        ..._value,
      } satisfies ValidationConfiguration;
    },
  });

  /** Internal touched state */
  protected touched = signal<boolean>(false);

  /** Internal dirty state */
  protected dirty = signal<boolean>(false);

  /** Get current validation errors */
  get errors() {
    return this.control?.errors;
  }

  get errorsList() {
    return Object.entries(this.errors ?? {});
  }

  constructor() {
    effect(() => {
      if (this.required() !== this._previousRequiredValue) {
        /** Skip the first run as values are being set */
        if (!isUndefined(this._previousRequiredValue)) {
          untracked(() => {
            this.runValidation('immediate');
          });
        }
        this._previousRequiredValue = this.required();
      }
    });
  }

  ngOnInit() {
    try {
      this.ngControl = this.injector.get(NgControl, null);
      this.controlContainer = this.injector.get(ControlContainer, null);

      if (this.ngControl) {
        this.ngControl.valueAccessor = this;
      }

      this.initControl();
      this.addEventListeners();
      this.addValidationSubscription();
      this.addFormSubmitListener();

      this.ngControl?.statusChanges
        ?.pipe(
          filter(() => Boolean(this.ngControl?.control?.touched)),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.cdr.markForCheck();
        });

      if (
        this.elementRef.nativeElement
          ?.getAttribute('type')
          ?.toLocaleLowerCase() === 'email'
      ) {
        const control = this.getControl();
        control.addValidators(Validators.email);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.abortController?.abort();
  }

  /** TODO: Review this as inputs may not be form children */
  /** TODO: Use Angular query instead of closest */
  protected addFormSubmitListener() {
    const form = this.elementRef.nativeElement.closest('form');
    if (form) {
      const unlistenSubmit = this.renderer.listen(form, 'submit', () => {
        this.markAllControlsAsTouchedAndDirty();
      });
      this.abortController?.signal.addEventListener('abort', unlistenSubmit);
    }
  }

  protected markAllControlsAsTouchedAndDirty() {
    const control = this.control;
    if (control) {
      control.markAsTouched();
      control.markAsDirty();
      this.markAsTouched();
      this.markAsDirty();
      this.setAriaAttributes();
    }
  }

  /** Manually triggers validation on the control */
  validate(eventType: InternalValidationEventTrigger = 'immediate'): void {
    this.runValidation(eventType);
  }

  /**
   * Gets a human-readable error message for a given error key and value
   * Override this method in derived classes for custom error messages
   * @param {string} errorKey - The key of the error
   * @param {any} errorValue - The value associated with the error
   * @returns {string} A human-readable error message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getErrorMessage(errorKey: string, errorValue: any): string {
    switch (errorKey) {
      case 'required':
        return 'This field is required';
      case 'min':
        return `Value must be at least ${errorValue.min}`;
      case 'max':
        return `Value must be at most ${errorValue.max}`;
      case 'minlength':
        return `Minimum length is ${errorValue.requiredLength}`;
      case 'maxlength':
        return `Maximum length is ${errorValue.requiredLength}`;
      case 'pattern':
        return 'Please enter a valid value';
      case 'email':
        return 'Please enter a valid email address';
      default: {
        return 'Invalid value';
      }
    }
  }

  /**
   * Handles errors that occur during component lifecycle
   * @param {unknown} error - The error to handle
   * @throws {FormControlError} Rethrows the error as a FormControlError
   */
  protected handleError(error: unknown): void {
    if (error instanceof FormControlError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    throw new FormControlError(errorMessage, {
      cause: error,
      errorCode: 'CONTROL_ERROR',
      controlName: this.name(),
    });
  }

  private addEventListeners() {
    const abortController = new AbortController();
    this.abortController = abortController;

    try {
      const unlistenInput = this.renderer.listen(
        this.elementRef.nativeElement,
        'input',
        event => {
          this.onInputChange(event);
        }
      );

      const unlistenBlur = this.renderer.listen(
        this.elementRef.nativeElement,
        'focusout',
        event => {
          this.onBlur(event);
        }
      );

      abortController.signal.addEventListener('abort', () => {
        unlistenInput();
        unlistenBlur();
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  onInputChange(event: Event) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const value = 'value' in target ? (target.value as T) : null;

    if (!('value' in target)) {
      return;
    }

    this.value.set(value);
    this.onChange(value);
    this.runValidation('input');
  }

  onBlur(event: Event) {
    this.markAsTouched();
    this.onTouched();

    const target = event.target;

    if (
      !(target instanceof HTMLInputElement) ||
      !(target instanceof HTMLTextAreaElement) ||
      !(target instanceof HTMLSelectElement)
    ) {
      return;
    }

    const value = 'value' in target ? (target.value as T) : null;

    if (!('value' in target)) {
      return;
    }

    this.value.set(value);
    this.runValidation('change');
  }

  private isControlTouched(control?: FormControl | null) {
    return control?.touched ?? false;
  }
  private isControlDirty(control?: FormControl | null) {
    return control?.dirty ?? false;
  }

  protected addValidationSubscription() {
    this.valueChangeSubject
      .pipe(
        filter(({ eventType, configuration, control }) => {
          return (
            Boolean(control) &&
            (eventType === 'submit' ||
              this.isControlTouched(control) ||
              this.isControlDirty(control)) &&
            !this.disabled() &&
            (eventType === 'immediate' ||
              configuration.triggers.includes(eventType))
          );
        }),
        debounce(({ configuration, eventType }) => {
          return timer(
            eventType === 'input' ? configuration.inputDebounceTime : 0
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ control }) => {
        this.validateValue(control);
      });
  }

  protected runValidation(eventType: InternalValidationEventTrigger) {
    this.valueChangeSubject.next({
      value: this.value(),
      configuration: this.validationConfiguration(),
      control: this.control,
      eventType,
    });
  }

  protected setAriaAttributes() {
    const element = this.elementRef.nativeElement;
    const errors = this.errors;
    if (errors && Object.keys(errors).length > 0) {
      this.renderer.setAttribute(element, 'aria-invalid', 'true');
    } else {
      this.renderer.removeAttribute(element, 'aria-invalid');
    }

    if (this.disabled()) {
      this.renderer.setAttribute(element, 'aria-disabled', 'true');
    } else {
      this.renderer.removeAttribute(element, 'aria-disabled');
    }
  }

  private validateValue(control: FormControl | null) {
    if (!control) return;
    try {
      control.markAsTouched();
      control.updateValueAndValidity();
      this.setAriaAttributes();
    } catch (error) {
      // TODO: Handle error gracefully
      console.error(error);
    }
  }

  protected getControl() {
    const ngControl = this.ngControl;

    if (!ngControl) {
      this._innerFormControl ??= new FormControl();
      return this._innerFormControl;
    }

    if (ngControl instanceof NgModel) {
      return ngControl.control;
    }

    if (ngControl instanceof FormGroupDirective) {
      const controlName = this.name();
      const controlContainer = this.controlContainer?.control;
      const control =
        controlName && controlContainer && controlContainer instanceof FormGroup
          ? controlContainer.controls[controlName]
          : new FormControl();
      return control as FormControl;
    }

    if (ngControl instanceof FormControlDirective) {
      return ngControl.control;
    }

    if (ngControl instanceof FormControlName) {
      const controlName = ngControl.name;
      const container = this.controlContainer?.control;
      const containerControl =
        controlName && container && container instanceof FormGroup
          ? (container.controls[controlName] as FormControl)
          : null;

      if (!containerControl) {
        this._innerFormControl ??= new FormControl();
        return this._innerFormControl;
      }

      return containerControl;
    }

    this._innerFormControl ??= new FormControl();
    return this._innerFormControl;
  }

  private initControl() {
    const { ngControl } = this;
    if (ngControl instanceof NgModel) {
      ngControl.control.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(value => {
          if (ngControl.model !== value || ngControl.viewModel !== value) {
            ngControl.viewToModelUpdate(value);
            this.dirty.set(true);
          }
        });
    }
  }

  onChange: (value: T | null) => unknown = noop;
  onTouched: VoidFunction = noop;

  registerOnChange(onChange: (value: T | null) => unknown) {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: VoidFunction) {
    this.onTouched = onTouched;
  }

  markAsTouched() {
    if (!this.touched()) {
      this.onTouched();
      this.touched.set(true);
      this.control?.markAsTouched();
    }
  }

  markAsDirty() {
    if (!this.dirty()) {
      this.dirty.set(true);
      this.control?.markAsDirty();
    }
  }

  writeValue(value: T | null): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(value);
    this.onChange(value);
  }

  setDisabledState?(disabled: boolean): void {
    this.disabled.set(disabled);
  }
}
