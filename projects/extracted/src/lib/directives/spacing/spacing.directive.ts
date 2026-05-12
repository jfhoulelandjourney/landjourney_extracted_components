import { computed, Directive, effect, ElementRef, input, Renderer2, inject } from '@angular/core';
import { isNil, isNonNullable } from '../../utils/nullishUtil';

type CssProperty = 'margin' | 'padding';
type LogicalDirection = 'inline' | 'block';
type LogicalDirectionPart = 'start' | 'end';

type SpacingProperty =
  | 'margin'
  | 'padding'
  | `${CssProperty}-${LogicalDirection}`
  | `${CssProperty}-${LogicalDirection}-${LogicalDirectionPart}`;

@Directive({
  selector: '[lj-spacing]',
  standalone: true,
  exportAs: 'ljSpacing',
})
export class SpacingDirective {
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);

  margin = input<number>();
  marginInline = input<number>();
  marginInlineStart = input<number>();
  marginInlineEnd = input<number>();
  marginBlock = input<number>();
  marginBlockStart = input<number>();
  marginBlockEnd = input<number>();

  padding = input<number>();
  paddingInline = input<number>();
  paddingInlineStart = input<number>();
  paddingInlineEnd = input<number>();
  paddingBlock = input<number>();
  paddingBlockStart = input<number>();
  paddingBlockEnd = input<number>();

  private marginStyle = computed(() =>
    this.convertToStyle('margin', this.margin())
  );
  private marginInlineStyle = computed(() =>
    this.convertToStyle('margin-inline', this.marginInline())
  );
  private marginInlineStartStyle = computed(() =>
    this.convertToStyle('margin-inline-start', this.marginInlineStart())
  );
  private marginInlineEndStyle = computed(() =>
    this.convertToStyle('margin-inline-end', this.marginInlineEnd())
  );
  private marginBlockStyle = computed(() =>
    this.convertToStyle('margin-block', this.marginBlock())
  );
  private marginBlockStartStyle = computed(() =>
    this.convertToStyle('margin-block-start', this.marginBlockStart())
  );
  private marginBlockEndStyle = computed(() =>
    this.convertToStyle('margin-block-end', this.marginBlockEnd())
  );
  private paddingStyle = computed(() =>
    this.convertToStyle('padding', this.padding())
  );
  private paddingInlineStyle = computed(() =>
    this.convertToStyle('padding-inline', this.paddingInline())
  );
  private paddingInlineStartStyle = computed(() =>
    this.convertToStyle('padding-inline-start', this.paddingInlineStart())
  );
  private paddingInlineEndStyle = computed(() =>
    this.convertToStyle('padding-inline-end', this.paddingInlineEnd())
  );
  private paddingBlockStyle = computed(() =>
    this.convertToStyle('padding-block', this.paddingBlock())
  );
  private paddingBlockStartStyle = computed(() =>
    this.convertToStyle('padding-block-start', this.paddingBlockStart())
  );
  private paddingBlockEndStyle = computed(() =>
    this.convertToStyle('padding-block-end', this.paddingBlockEnd())
  );

  constructor() {
    effect(() => {
      const styles = [
        this.marginStyle(),
        this.marginInlineStyle(),
        this.marginInlineStartStyle(),
        this.marginInlineEndStyle(),
        this.marginBlockStyle(),
        this.marginBlockStartStyle(),
        this.marginBlockEndStyle(),
        this.paddingStyle(),
        this.paddingInlineStyle(),
        this.paddingInlineStartStyle(),
        this.paddingInlineEndStyle(),
        this.paddingBlockStyle(),
        this.paddingBlockStartStyle(),
        this.paddingBlockEndStyle(),
      ].filter(isNonNullable);

      styles.forEach(style => {
        this.renderer.setStyle(
          this.elementRef.nativeElement,
          style[0],
          style[1]
        );
      });
    });
  }

  private convertToStyle(
    property: SpacingProperty,
    value?: number | number[] | null
  ): [string, string] | undefined {
    if (isNil(value)) return;
    const propertyValue = Array.isArray(value)
      ? value.map(v => `var(--spacing-${v})`).join(' ')
      : `var(--spacing-${value})`;
    return [property, propertyValue];
  }
}
