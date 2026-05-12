// draggable-annotation.component.ts
import { CdkDrag, CdkDragPreview } from '@angular/cdk/drag-drop';
import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import type { RegisteredFieldType } from '../../pdf/field-framework';
import type {
  SigneeInfo,
  SignerInfo,
} from '../../pdf/field-framework/types/field-data';
import {
  AnnotationData,
  AnnotationType,
  createAnnotationData,
} from '../annotation.types';

/**
 * Drag-data shape attached to the dragged DOM element via `cdkDrag.data`.
 * The drop directive reads only common fields (`type`, `signee`, `signer`,
 * `width`, `height`) and dispatches to either the v2 `FIELD_PLUGINS` registry
 * (when `isRegisteredFieldType(type)`) or the v1 factory.
 *
 * v2 types may carry a `type` value that's not in the v1 `AnnotationType`
 * union, so the drag-data shape is a discriminated union.
 */
type V2DragData = {
  readonly type: RegisteredFieldType;
  readonly width?: number;
  readonly height?: number;
  readonly readonly: boolean;
  readonly isTemplate: boolean;
  readonly signee: SigneeInfo | null;
  readonly signer: SignerInfo | null;
};

export type DragData = AnnotationData | V2DragData;

export interface AnnotationDragEvent {
  readonly annotation: DragData;
  readonly element: HTMLElement;
}

/**
 * Universal draggable annotation component.
 * Handles all annotation types with type-specific rendering and behavior.
 */
@Component({
  selector: 'lj-draggable-annotation',
  imports: [CdkDragPreview, MatIcon, TitleCasePipe],
  templateUrl: './draggable-annotation.component.html',
  styleUrls: ['./draggable-annotation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.draggable]': 'draggable() && !disabled()',
    '[attr.tabindex]': 'disabled() ? "-1" : "0"',
    role: 'button',
    '[attr.disabled]': 'disabled() ? "true" : null',
  },
  hostDirectives: [
    {
      directive: CdkDrag,
      inputs: ['cdkDragDisabled: isDragDisabled'],
    },
  ],
})
export class DraggableAnnotationComponent {
  private readonly cdkDrag = inject(CdkDrag);

  // Core inputs - required
  readonly id = input.required<string>();
  readonly type = input.required<AnnotationType | RegisteredFieldType>();

  // Content inputs - type-specific
  readonly name = input<string | null>(null);
  readonly date = input<number | null>(null);
  readonly signee = input<SigneeInfo | null>(null); // For placeholders
  readonly signer = input<SignerInfo | null>(null); // Actual customer

  // Behavior inputs
  readonly draggable = input(true);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly isTemplate = input(false);

  // Dimension inputs
  readonly width = input<number>();
  readonly height = input<number>();

  // State
  readonly dragging = signal(false);

  // Computed properties
  protected readonly isDragDisabled = computed(
    () => this.disabled() || !this.draggable()
  );

  readonly dragData = computed((): DragData => {
    const baseData = {
      width: this.width(),
      height: this.height(),
      readonly: this.readonly(),
      isTemplate: this.isTemplate(),
      signee: this.signee(),
      signer: this.signer(),
    };

    const type = this.type();
    switch (type) {
      case 'name':
        return createAnnotationData('name', {
          ...baseData,
          name: this.name(),
        });
      case 'signature':
        return createAnnotationData('signature', baseData);
      case 'initials':
        return createAnnotationData('initials', baseData);
      case 'date':
        return createAnnotationData('date', {
          ...baseData,
          date: this.date(),
        });
      case 'custom':
        return createAnnotationData('custom', {
          ...baseData,
          name: this.name(),
        });
      // v2-only types: drop directive routes via FIELD_PLUGINS using only the
      // common fields below; no v1 `createAnnotationData` factory call needed.
      case 'text-input':
      case 'textarea':
      case 'number':
      case 'currency':
      case 'dropdown':
      case 'checkbox':
      case 'radio':
        return { ...baseData, type };
    }
  });

  readonly iconName = computed(() => {
    const iconMap: Record<AnnotationType | RegisteredFieldType, string> = {
      signature: 'signature',
      name: 'person',
      initials: 'text_fields_alt',
      date: 'calendar_today',
      custom: 'build_circle',
      number: 'tag',
      currency: 'attach_money',
      dropdown: 'arrow_drop_down_circle',
      'text-input': 'short_text',
      textarea: 'subject',
      checkbox: 'check_box',
      radio: 'radio_button_checked',
    };
    return iconMap[this.type()] || 'help_outline';
  });

  readonly displayTitle = computed(() => {
    const type = this.type();
    if (type === 'custom' && this.name()) {
      return this.name();
    }

    return type.charAt(0).toUpperCase() + type.slice(1);
  });

  readonly ariaLabel = computed(() => {
    const title = this.displayTitle();
    const status = this.disabled() ? 'disabled' : 'draggable';

    return `${title} (${status})`;
  });

  /**
   * Generates accessible description for screen readers.
   */
  getAccessibleDescription(): string {
    const type = this.type();
    const isTemplate = this.isTemplate();
    const disabled = this.disabled();

    let description = `Draggable ${type} annotation`;

    if (isTemplate) {
      description += ' template';
    }

    if (disabled) {
      description += ' (currently disabled)';
    } else {
      description += ' (drag to place on document)';
    }

    return description;
  }

  /**
   * Generates detailed annotation description for aria-describedby.
   */
  getAnnotationDescription(): string {
    const parts: string[] = [];

    if (this.name()) {
      parts.push(`Name: ${this.name()}`);
    }

    const signee = this.signee();
    if (signee) {
      parts.push(`Assigned to: ${signee.name}`);
    }

    const signer = this.signer();
    if (signer) {
      parts.push(`Signed by: ${signer.name}`);
    }

    const date = this.date();
    if (date) {
      const dateStr = new Date(date).toLocaleDateString();
      parts.push(`Date: ${dateStr}`);
    }

    const width = this.width();
    const height = this.height();
    if (width && height) {
      parts.push(`Size: ${width}x${height}px`);
    }

    return parts.join(', ') || 'No additional details';
  }

  // Outputs
  readonly dragStarted = output<AnnotationDragEvent>();
  readonly dragEnded = output<AnnotationDragEvent>();
  readonly dragError = output<{ error: string; annotation: DragData }>();

  constructor() {
    this.setupDragEventListeners();
    this.setupCdkDragConfiguration();
  }

  /**
   * Sets up CDK drag configuration with reactive updates.
   */
  private setupCdkDragConfiguration(): void {
    effect(() => {
      // Ensure we have the CDK instance
      if (this.cdkDrag) {
        // CDK should be disabled if either disabled is true OR draggable is false
        const shouldDisable = this.disabled() || !this.draggable();
        this.cdkDrag.disabled = shouldDisable;

        // Update drag data
        const data = this.dragData();
        if (data) {
          this.cdkDrag.data = data;
        }
      }
    });
  }

  /**
   * Sets up drag event listeners with proper cleanup.
   */
  private setupDragEventListeners(): void {
    this.cdkDrag.started.pipe(takeUntilDestroyed()).subscribe(() => {
      this.onDragStart();
    });

    this.cdkDrag.ended
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.onDragEnd());
  }

  /**
   * Handles drag start with error handling.
   */
  private onDragStart(): void {
    try {
      this.dragging.set(true);

      this.dragStarted.emit({
        annotation: this.dragData(),
        element: this.cdkDrag.element.nativeElement,
      });
    } catch (error) {
      console.error('Error during drag start:', error);
      this.dragError.emit({
        error: 'Failed to start drag operation',
        annotation: this.dragData(),
      });
    }
  }

  /**
   * Handles drag end with cleanup.
   */
  private onDragEnd(): void {
    try {
      this.dragging.set(false);

      this.dragEnded.emit({
        annotation: this.dragData(),
        element: this.cdkDrag.element.nativeElement,
      });
    } catch (error) {
      console.error('Error during drag end:', error);
    }
  }
}
