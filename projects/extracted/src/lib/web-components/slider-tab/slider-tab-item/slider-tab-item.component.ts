import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  model,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface SizeAndPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

@Component({
  selector: 'lj-slider-tab',
  imports: [],
  templateUrl: './slider-tab-item.component.html',
  styleUrl: './slider-tab-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lj-slider-tab',
    '[class.lj-slider-tab--selected]': 'selected()',
    '[class.lj-slider-tab--disabled]': 'disabled()',
    tabindex: '0',
  },
})
export class LjSliderTabItemComponent {
  // Injections
  protected elementRef = inject<ElementRef<HTMLDivElement>>(ElementRef);

  // API
  readonly updated$ = new BehaviorSubject<{
    tab: LjSliderTabItemComponent;
    rect: SizeAndPosition | null;
  }>({
    tab: this,
    rect: null,
  });

  // Inputs
  readonly selected = model<boolean>(false);
  readonly disabled = model<boolean>(false);

  constructor() {
    /*
     * We have some conflicts when tabs have scale applied
     * and it caused the boundingBox sizes to be incorrect
     * so we will not use this feature for now
     */
    // afterEveryRender({
    //   read: () => {
    //     this.emitRect();
    //   },
    // });
  }

  private _emitRect() {
    this.updated$.next({
      tab: this,
      rect: this.getSizeAndPosition(),
    });
  }

  /*
   * We have some conflicts when tabs have scale applied
   * and it caused the boundingBox sizes to be incorrect
   * TODO: Review how to consume the unscaled value
   */
  private getSizeAndPosition() {
    const $el = this.elementRef.nativeElement;
    const { width, height } = $el.getBoundingClientRect();
    const left = $el.offsetLeft;
    const top = $el.offsetTop;

    return {
      top,
      left,
      width,
      height,
    };
  }
}
