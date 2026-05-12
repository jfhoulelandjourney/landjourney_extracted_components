import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivateDirective } from '../../directives/activate/activate.directive';
import { SidePanelComponent } from '../../web-components/side-panel/side-panel.component';
import { GuideContentService } from '../guide-content.service';

@Component({
  selector: 'lj-guide-panel',
  imports: [
    SidePanelComponent,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ActivateDirective,
  ],
  templateUrl: './guide-panel.component.html',
  styleUrl: './guide-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidePanelComponent {
  protected guideService = inject(GuideContentService);

  isOpen = input<boolean>(false);
  readonly closed = output<void>();

  readonly lightboxSrc = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.guideService.loadForCurrentRoute();
      }
    });
  }

  onClose() {
    this.closed.emit();
  }

  onContentClick(event: MouseEvent) {
    this.openLightboxFromEventTarget(event.target);
  }

  onContentKeydown(event: Event) {
    this.openLightboxFromEventTarget(event.target);
  }

  private openLightboxFromEventTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.tagName === 'IMG' && target.closest('.guide-markdown-content')) {
      this.lightboxSrc.set((target as HTMLImageElement).src);
    }
  }

  closeLightbox() {
    this.lightboxSrc.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.lightboxSrc()) {
      this.closeLightbox();
    }
  }

  navigateToPage(sectionSlug: string, pageSlug: string) {
    this.guideService.loadPage(sectionSlug, pageSlug);
  }

  showToc() {
    this.guideService.showTableOfContents();
  }
}
