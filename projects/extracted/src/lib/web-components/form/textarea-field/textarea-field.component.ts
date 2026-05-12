import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { getUUID4 } from '../../../utils/stringUtil';
import { BaseControlValueAccessorComponent } from '../base-control-value-accessor/BaseControlValueAccessor';

@Component({
  selector: 'lj-textarea-field',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './textarea-field.component.html',
  styleUrl: './textarea-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.required]': 'required() || null',
    '[attr.disabled]': 'disabled() || null',
  },
})
export class LjTextareaFieldComponent
  extends BaseControlValueAccessorComponent<string>
  implements AfterViewInit
{
  private textAreaWrapper = viewChild.required('textAreaWrapper', {
    read: ElementRef,
  });

  override value = model<string | null>(null);

  id = input(getUUID4());
  label = input<string>();
  placeholder = input<string | null>(null);
  after = input<string>();
  before = input<string>();
  minRows = input<number>(2);
  maxRows = input<number>(10);
  customCssStyle = input<string>('');
  customCssTitleStyle = input<string>('');
  style = input<'normal' | 'gray'>('normal');
  showCounter = input(false, {
    transform: (value: unknown) => Boolean(value),
  });
  readonly = input(false, {
    transform: (value: unknown) => Boolean(value),
  });
  readonly onInputBlur = output<void>();
  readonly onInputFocus = output<void>();

  showError = input(true);
  customErrorMessage = input<string | undefined>();

  // Validations
  override required = input(false, {
    transform: (value: unknown) => {
      return Boolean(value);
    },
  });
  pattern = input<string | null>(null);
  minlength = input<number | null>(null);
  maxlength = input<number | null>(null);

  hint = computed(() => {
    if (!this.showCounter()) {
      return null;
    }

    if (this.maxlength() === null) {
      return `Character count: ${this.value()?.length ?? 0}`;
    }

    return `${this.value()?.length ?? 0}/${this.maxlength()}`;
  });

  override writeValue(value: string | null): void {
    super.writeValue(value);
    this.value.set(value);
  }

  override onInputChange(event: Event): void {
    super.onInputChange(event);
    this.textAreaWrapper().nativeElement.dataset.replicatedValue = (
      event.target as HTMLTextAreaElement
    ).value;
  }

  ngAfterViewInit(): void {
    this.textAreaWrapper().nativeElement.dataset.replicatedValue =
      this.value() ?? '';
  }

  handleOnBlur() {
    this.onInputBlur.emit();
  }

  handleOnFocus() {
    this.onInputFocus.emit();
  }
}
