import { Directive, TemplateRef, ElementRef, OnInit, HostListener, ComponentRef, OnDestroy, input, inject } from '@angular/core';
import {
  Overlay,
  OverlayPositionBuilder,
  OverlayRef,
} from '@angular/cdk/overlay';
import { CustomToolTipComponent } from './custom-tool-tip/custom-tool-tip.component';
import { ComponentPortal } from '@angular/cdk/portal';
import { filter, fromEvent, map, scan, Subscription } from 'rxjs';

@Directive({
  selector: '[lj-custom-tooltip]',
  standalone: true,
})
export class CustomTooltipDirective implements OnInit, OnDestroy {
  private _overlay = inject(Overlay);
  private _overlayPositionBuilder = inject(OverlayPositionBuilder);
  private _elementRef = inject(ElementRef);

  showToolTip = input<boolean>(true);
  customToolTip = input<string>('');
  contentTemplate = input<TemplateRef<unknown> | undefined>(undefined);

  private _overlayRef: OverlayRef | undefined = undefined;
  private mouseMoveSubscription: Subscription | undefined = undefined;

  ngOnInit() {
    if (!this.showToolTip()) {
      return;
    }

    const positionStrategy = this._overlayPositionBuilder
      .flexibleConnectedTo(this._elementRef)
      .withPositions([
        {
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetY: 5,
        },
      ]);

    this._overlayRef = this._overlay.create({ positionStrategy });
  }

  @HostListener('mouseenter')
  show() {
    if (this._overlayRef && !this._overlayRef.hasAttached()) {
      const tooltipRef: ComponentRef<CustomToolTipComponent> =
        this._overlayRef.attach(new ComponentPortal(CustomToolTipComponent));
      tooltipRef.instance.text = this.customToolTip;
      tooltipRef.instance.contentTemplate = this.contentTemplate;

      const nativeElementBoundingBox =
        this._elementRef.nativeElement.getBoundingClientRect();

      // Using mousemove instead of mouseleave
      // to allow the tooltip to appear omn top of the element w/o closing it
      this.mouseMoveSubscription = fromEvent<MouseEvent>(window, 'mousemove')
        .pipe(
          map(event => {
            return {
              x: event.clientX,
              y: event.clientY,
            };
          }),
          filter(position => {
            const leftX = Math.ceil(position.x);
            const rightX = Math.floor(position.x);
            const topY = Math.ceil(position.y);
            const bottomY = Math.floor(position.y);

            const elLeft = Math.floor(nativeElementBoundingBox.left);
            const elRight = Math.ceil(nativeElementBoundingBox.right);
            const elTop = Math.floor(nativeElementBoundingBox.top);
            const elBottom = Math.ceil(nativeElementBoundingBox.bottom);

            const insideBoundaries =
              leftX >= elLeft &&
              rightX <= elRight &&
              topY >= elTop &&
              bottomY <= elBottom;

            return !insideBoundaries;
          }),
          scan(acc => {
            return acc + 1;
          }, 0),
          filter(count => count > 2)
        )
        .subscribe(() => {
          this.closeToolTip();
          this.mouseMoveSubscription?.unsubscribe();
          this.mouseMoveSubscription = undefined;
        });
    }
  }

  ngOnDestroy() {
    this.closeToolTip();
  }

  closeToolTip() {
    if (this._overlayRef) {
      this._overlayRef.detach();
    }
  }
}
