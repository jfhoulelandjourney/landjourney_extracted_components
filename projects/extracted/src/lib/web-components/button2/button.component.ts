import { CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isString } from 'es-toolkit';

export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonVariants =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'icon';
export type ButtonIntent =
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';
export type ButtonSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonFluid = 'width' | 'height' | 'both' | 'none' | false;
export type ButtonTarget = '_self' | '_blank' | '_parent' | '_top';

/**
 * Button component supporting standard buttons, links, and Angular Router navigation.
 *
 * @example
 * ```html
 * <!-- Standard button -->
 * <lj-button (click)="save()" [loading]="saving">Save</lj-button>
 *
 * <!-- External link -->
 * <lj-button href="https://example.com" target="_blank">External Link</lj-button>
 *
 * <!-- Router link -->
 * <lj-button routerLink="/users" [queryParams]="{page: 1}">Users</lj-button>
 *
 * <!-- With icons -->
 * <lj-button beforeIcon="save" afterIcon="arrow_forward">Save & Continue</lj-button>
 * ```
 */
@Component({
  selector: 'lj-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  imports: [
    CommonModule,
    MatIcon,
    MatProgressSpinnerModule,
    NgClass,
    NgTemplateOutlet,
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.fluid-width]': "fluid() === 'width' || fluid() === 'both'",
    '[class.fluid-height]': "fluid() === 'height' || fluid() === 'both'",
    '[class.is-loading]': 'loading()',
    '[attr.disabled]': 'disabled() || loading() ? true : null',
    '[attr.aria-disabled]': 'disabled() || loading() ? true : null',
    '[attr.aria-busy]': 'loading() ? true : null',
  },
})
export class LjButton2Component implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private afterContentContainer =
    viewChild<ElementRef<HTMLDivElement>>('afterContent');
  private beforeContentContainer =
    viewChild<ElementRef<HTMLDivElement>>('beforeContent');

  // Signals to track actual projected content presence
  private hasBeforeProjectedContent = signal(false);
  private hasAfterProjectedContent = signal(false);

  type = input('button', {
    transform: (value: unknown): ButtonType => {
      const validTypes = ['button', 'submit', 'reset'];
      return isString(value) && validTypes.includes(value)
        ? (value as ButtonType)
        : 'button';
    },
  });
  variant = input<ButtonVariants>('primary');
  intent = input<ButtonIntent | ''>('');
  size = input<ButtonSize>('md');
  align = input<'start' | 'center' | 'end'>('center');

  /** Remove the padding for extreme cases */
  compact = input<boolean>(false);

  /**
   * Make the button 100% width/height
   * If false, the button size will depend on the content (auto size)
   */
  fluid = input<'width' | 'height' | 'both' | 'none' | false>(false);

  // States
  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  // Icons
  afterIcon = input<string>('');
  beforeIcon = input<string>('');

  // Link option
  href = input<string>('');
  target = input<ButtonTarget>('_self');

  // Angular Router properties
  routerLink = input<string | string[] | null>(null);
  queryParams = input<Record<string, unknown> | null>(null);
  fragment = input<string | null>(null);
  queryParamsHandling = input<'merge' | 'preserve' | ''>('');
  preserveFragment = input<boolean>(false);
  skipLocationChange = input<boolean>(false);
  replaceUrl = input<boolean>(false);
  state = input<Record<string, unknown> | null>(null);
  relativeTo = input<ActivatedRoute | null>(null);

  // Accessibility
  ariaLabel = input<string>('');
  ariaDescribedBy = input<string>('');

  // Computed properties
  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading()
  );

  protected readonly isRouterLink = computed(() => {
    const routerLink = this.routerLink();
    return routerLink !== null && routerLink !== undefined && routerLink !== '';
  });

  protected readonly isExternalLink = computed(() => {
    const href = this.href();
    return href !== '' && !this.isRouterLink();
  });

  protected readonly isButton = computed(() => {
    return !this.isRouterLink() && !this.isExternalLink();
  });

  protected classes = computed(() => ({
    [`align-${this.align()}`]: true,
    [`variant-${this.variant()}`]: true,
    [`intent-${this.intent()}`]: true,
    [`size-${this.size()}`]: true,
    'fluid-width': this.fluid() === 'width' || this.fluid() === 'both',
    'fluid-height': this.fluid() === 'height' || this.fluid() === 'both',
    compact: this.compact(),
    loading: this.loading(),
    disabled: this.isDisabled(),
  }));

  // Computed signals for visibility based on icons AND detected projection
  protected showBeforeContent = computed(() => {
    // Show if beforeIcon is provided OR if content was detected
    return Boolean(this.beforeIcon() || this.hasBeforeProjectedContent());
  });

  protected showAfterContent = computed(() => {
    // Show if afterIcon is provided OR if content was detected
    return Boolean(this.afterIcon() || this.hasAfterProjectedContent());
  });

  // Outputs for events that will be forwarded
  public readonly click = output<MouseEvent>();
  public readonly keydown = output<KeyboardEvent>();
  public readonly keyup = output<KeyboardEvent>();
  public readonly focus = output<FocusEvent>();
  public readonly blur = output<FocusEvent>();

  // Additional mouse event outputs
  public readonly mousedown = output<MouseEvent>();
  public readonly mouseup = output<MouseEvent>();
  public readonly mouseenter = output<MouseEvent>();
  public readonly mouseleave = output<MouseEvent>();
  public readonly mouseover = output<MouseEvent>();
  public readonly dblclick = output<MouseEvent>();
  public readonly contextmenu = output<MouseEvent>();

  // Additional focus events
  public readonly focusin = output<FocusEvent>();
  public readonly focusout = output<FocusEvent>();

  // Check projected content after view initializes
  ngAfterViewInit(): void {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => this.checkProjectedContent(), 0);
  }

  private checkProjectedContent(): void {
    const beforeContainerEl = this.beforeContentContainer()?.nativeElement;
    const afterContainerEl = this.afterContentContainer()?.nativeElement;

    if (beforeContainerEl) {
      // Check if there are any child nodes
      // A simple check is for any element children or significant text nodes.
      // Check if ng-content actually rendered nodes.
      const hasBeforeNodes = Array.from(beforeContainerEl.childNodes).some(
        node =>
          node.nodeType === Node.ELEMENT_NODE || // Check for non-icon elements
          (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) // Check for non-empty text nodes
      );
      this.hasBeforeProjectedContent.set(hasBeforeNodes);
    }

    if (afterContainerEl) {
      // Similar check for the after container
      const hasAfterNodes = Array.from(afterContainerEl.childNodes).some(
        node =>
          node.nodeType === Node.ELEMENT_NODE ||
          (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
      );
      this.hasAfterProjectedContent.set(hasAfterNodes);
    }
  }

  // Add a handler for click that respects disabled state
  handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.click.emit(event);
    }
  }

  // Calculate spinner diameter (80% of button height)
  getSpinnerDiameter(): number {
    // Map button sizes to approximate heights in pixels
    const sizeToHeight = {
      xxs: 20,
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 56,
    };

    // Get the current size and calculate 80% of height
    return Math.round(sizeToHeight[this.size()] * 0.8);
  }

  // Scale stroke width proportionally
  getSpinnerStrokeWidth(): number {
    const diameter = this.getSpinnerDiameter();
    // Scale stroke width based on diameter
    return Math.max(2, Math.round(diameter / 10));
  }
}
