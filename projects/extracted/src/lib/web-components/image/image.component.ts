import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
} from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'lj-image',
  imports: [CommonModule, NgxSkeletonLoaderModule],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.width]': 'width()',
    '[attr.height]': 'height()',
    '[class.is-loading]': 'loadingState()',
    '[class.has-error]': 'errorState()',
  },
})
export class LjImageComponent {
  src = input.required<string>();
  alt = input<string>('');
  width = input<string | number | null>(null);
  height = input<string | number | null>(null);
  errorTemplateRef = input<TemplateRef<unknown> | null>(null);
  loadingTemplateRef = input<TemplateRef<unknown> | null>(null);

  protected loadingState = signal(true);
  protected errorState = signal<Event | null>(null);
  // We need this to force reload the image when retrying
  // as input signals are readonly-ish
  protected innerSrc = signal<string | null>(null);

  readonly load = output<Event>();
  readonly error = output<Event>();

  constructor() {
    // Synchronize src and innerSrc
    effect(() => {
      const src = this.src();
      const innerSrc = this.innerSrc();
      untracked(() => {
        if (src !== innerSrc) {
          this.innerSrc.set(src);
        }
      });
    });

    // Reset loading state when src changes
    effect(() => {
      const innerSrc = this.innerSrc();
      untracked(() => {
        if (innerSrc) {
          this.setLoadingState();
        }
      });
    });
  }

  private setLoadingState() {
    this.loadingState.set(true);
    this.errorState.set(null);
  }

  private setCompleteState() {
    this.loadingState.set(false);
    this.errorState.set(null);
  }

  private setErrorState(errorEvent: Event) {
    this.loadingState.set(false);
    this.errorState.set(errorEvent);
  }

  onImageLoad(event: Event) {
    this.setCompleteState();
    this.load.emit(event);
  }

  onImageError(event: Event) {
    this.setErrorState(event);
    this.error.emit(event);
  }

  retryLoad() {
    // Force reload by appending timestamp
    const timestamp = new Date().getTime();
    this.innerSrc.update(currentSrc => {
      if (!currentSrc) {
        return null;
      }
      return `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}t=${timestamp}`;
    });
  }
}
