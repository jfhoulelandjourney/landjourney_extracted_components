import { Directive, effect, ElementRef, inject } from '@angular/core';
import { MobileLayoutStore } from '../../stores/mobile-layout/mobile-layout.store';

@Directive({
  selector: 'input[lj-mobile-search]',
  standalone: true,
})
export class MobileSearchPlaceholderDirective {
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private mobileLayoutStore = inject(MobileLayoutStore);

  constructor() {
    const originalPlaceholder = this.el.nativeElement.getAttribute('placeholder') ?? '';
    effect(() => {
      this.el.nativeElement.placeholder = this.mobileLayoutStore.mobileViewEnabled()
        ? 'Search'
        : originalPlaceholder;
    });
  }
}
