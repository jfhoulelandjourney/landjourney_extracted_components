import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  NgZone,
  Renderer2,
} from '@angular/core';
import { LjSliderTabItemComponent } from '../slider-tab-item/slider-tab-item.component';

export type SliderTabOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'lj-slider-tab-group',
  imports: [],
  templateUrl: './slider-tab-group.component.html',
  styleUrl: './slider-tab-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lj-slider-tab-group',
    '[class.lj-slider-tab-group--horizontal]': 'mode() === "horizontal"',
    '[class.lj-slider-tab-group--vertical]': 'mode() === "vertical"',
    '(click)': 'handleTabClick($event)',
    '(keydown.Enter)': 'handleTabClick($event)',
    '(keydown.Space)': 'handleTabClick($event)',
    '(keydown.ArrowRight)': 'handleNavigateTabFocus($event, 1)',
    '(keydown.ArrowLeft)': 'handleNavigateTabFocus($event, -1)',
  },
})
export class LjSliderTabGroupComponent implements AfterContentInit {
  // Injections
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private renderer = inject<Renderer2>(Renderer2);

  // Inputs
  readonly mode = input<SliderTabOrientation>('horizontal');
  readonly selectedTab = model<number>(0);

  // Internal state
  protected tabs = contentChildren(LjSliderTabItemComponent);
  protected $tabs = contentChildren(LjSliderTabItemComponent, {
    read: ElementRef,
  });
  // protected selectionIndicator = viewChild.required('indicator', {
  //   read: ElementRef,
  // });

  // Lifecycle
  ngAfterContentInit() {
    const tabs = this.tabs();
    const selectedTabIndex = tabs.findIndex(tab => tab.selected()) ?? 0;
    this.selectTab(selectedTabIndex);

    /*
     * We have some conflicts when tabs have scale applied
     * and it caused the boundingBox sizes to be incorrect
     * so we will not use this feature for now
     */
    // merge(...tabs.map(tab => tab.updated$))
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(({ tab, rect }) => {
    //     if (tab.selected() && rect) {
    //       this.ngZone.runOutsideAngular(() => {
    //         this.updateSelectionIndicator(rect);
    //       });
    //     }
    //   });
  }

  // Methods
  handleTabClick(event: Event) {
    const $tabs = this.$tabs();
    const $target = event.target as HTMLElement;
    const $tab =
      $target.tagName.toLowerCase() === 'lj-slider-tab' ? $target : null;

    if (!$tab) {
      return;
    }

    const index = $tabs.findIndex(tab => tab.nativeElement === $tab);
    this.selectTab(index);
  }

  handleNavigateTabFocus(event: Event, direction: number) {
    const $tabs = this.$tabs();
    const $target = event.target as HTMLElement;
    const $tab =
      $target.tagName.toLowerCase() === 'lj-slider-tab' ? $target : null;

    if (!$tab) {
      return;
    }

    const index = $tabs.findIndex(tab => tab.nativeElement === $tab);
    const nextTabIndex = index + direction;

    if (nextTabIndex >= $tabs.length) {
      return;
    }

    const $nextTab = $tabs.at(nextTabIndex);

    if (!$nextTab || $nextTab.nativeElement.hasAttribute('disabled')) {
      return;
    }

    $nextTab.nativeElement.focus();
  }

  selectTab(index: number) {
    const tabs = this.tabs();

    if (index < 0 || index >= tabs.length) {
      return;
    }

    const nextTab = tabs.at(index);

    if (!nextTab || nextTab.disabled()) {
      return;
    }

    tabs.forEach(tab => {
      tab.selected.set(tab === nextTab);
    });
    this.selectedTab.set(index);
  }

  /*
   * We have some conflicts when tabs have scale applied
   * and it caused the boundingBox sizes to be incorrect
   * so we will not use this feature for now
   */
  // private updateSelectionIndicator(
  //   tabRect: {
  //     width: number;
  //     height: number;
  //     top: number;
  //     left: number;
  //   } | null
  // ): void {
  //   const mode = this.mode();
  //   const $indicator = this.selectionIndicator().nativeElement;

  //   if (!tabRect) {
  //     this.renderer.setStyle($indicator, 'width', '0');
  //     this.renderer.setStyle($indicator, 'transform', `translate(0, 0)`);
  //     return;
  //   }

  //   const { width, height, translateX, translateY } = {
  //     width: tabRect.width,
  //     height: tabRect.height,
  //     translateX: mode === 'horizontal' ? tabRect.left : 0,
  //     translateY: mode === 'vertical' ? tabRect.top : 0,
  //   };

  //   this.renderer.setStyle($indicator, 'width', `${width}px`);
  //   this.renderer.setStyle($indicator, 'height', `${height}px`);
  //   this.renderer.setStyle(
  //     $indicator,
  //     'transform',
  //     `translate(${translateX}px, ${translateY}px)`
  //   );
  //   requestAnimationFrame(() => {
  //     this.renderer.setStyle($indicator, 'transition', 'all 0.3s');
  //   });
  // }
}
