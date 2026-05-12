// THIS CAROUSEL MESSES WITH THE WIDTH OF THE PAGE DO NOT USE WITHOUT FIXING

import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { AfterContentInit, booleanAttribute, ChangeDetectionStrategy, Component, ContentChildren, Directive, Input, QueryList, signal, TemplateRef, inject } from '@angular/core';
import { LjRoundHeaderChipComponent } from '../../../web-components/chip/lj-round-header-chip/lj-round-header-chip.component';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[carousel-item]',
  standalone: true,
})
class CarouselDirective {
  template = inject<TemplateRef<unknown>>(TemplateRef);

  @Input() stepTitle?: string;
}

@Component({
  selector: 'lj-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, CommonModule, LjRoundHeaderChipComponent],
})
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class CarouselComponent implements AfterContentInit {
  @ContentChildren(CarouselDirective)
  carouselDirectives!: QueryList<CarouselDirective>;

  @Input({ transform: booleanAttribute }) showStepHeaders = false;

  items = signal<TemplateRef<unknown>[]>([]);
  stepTitles = signal<string[]>([]);
  activeIndex = signal(0);

  ngAfterContentInit(): void {
    this.items.set(this.carouselDirectives.map(item => item.template));
    if (this.showStepHeaders) {
      this.stepTitles.set(
        this.carouselDirectives.map(item => item.stepTitle || '')
      );
    }
  }

  hasNext() {
    return this.activeIndex() !== this.items().length - 1;
  }

  hasPrev() {
    return this.activeIndex() !== 0;
  }

  next(): void {
    if (this.hasNext()) {
      this.activeIndex.set((this.activeIndex() + 1) % this.items().length);
    }
  }

  prev(): void {
    if (this.hasPrev()) {
      this.activeIndex.set(
        (this.activeIndex() - 1 + this.items().length) % this.items().length
      );
    }
  }

  reset() {
    this.activeIndex.set(0);
  }
}
