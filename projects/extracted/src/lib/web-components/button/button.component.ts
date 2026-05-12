import { ChangeDetectionStrategy, Component, computed, ElementRef, input, inject } from '@angular/core';

export type ButtonVariant = 'cta' | 'inverse-cta' | 'ghost' | 'warn' | 'row';
export type ButtonColor = 'primary' | 'secondary';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[lj-button], a[lj-button]',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'buttonClassName()',
    '[class.full-width]': 'fullWidth()',
    '[class.compact]': 'compact()',
    '[class.small]': 'size() === "small"',
    '[type]': 'normalizedType()',
    'role': 'button',
    '[attr.aria-disabled]': '(disabled() || loading()) ? true : null',
    '[attr.disabled]': '(disabled() || loading()) ? true : null',
  },
})
export class LjButtonComponent {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  variant = input<ButtonVariant | ''>('cta', {
    alias: 'lj-button',
  });
  color = input<string>('primary');
  type = input<'button' | 'submit' | 'reset'>('button');
  compact = input<boolean>(false);
  fullWidth = input<boolean>(false);
  size = input<'small' | 'normal' | 'large'>('normal');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  applyFullStyle = input<boolean>(true);

  protected normalizedType = computed(() => {
    if (
      this.elementRef.nativeElement.tagName.toLocaleLowerCase() === 'button'
    ) {
      return this.type();
    }
    return null;
  });

  buttonClassName = computed(() => {
    const variant = this.variant() || 'cta';
    const applyFullStyle = this.applyFullStyle() ? 'lj-button' : '';
    return `${applyFullStyle} lj-button__${variant}`;
  });
}
