/* eslint-disable @angular-eslint/directive-class-suffix */

/**
 * We must style mat-select to match the design system.
 * But we are not setting a material theme yet, so we need to force it.
 * When we get select outside MUI, we can set this back to a component
 */

import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { ZoomService } from '../../../services/ui/zoom.service';

const getStyle = (borderless?: boolean) =>
  ({
    'font-family': 'Inter',
    'font-size': '14px',
    'font-style': 'normal',
    'font-weight': '400',
    'line-height': '20px',
    width: '100%',
    height: 'var(--input-height, 40px)',
    padding: 'var(--padding-default) var(--padding-comfortable)',
    'border-radius': '6px',
    border: borderless ? 'none' : '1px solid var(--border-base, lightgray)',
  }) as const;

@Directive({
  selector: '[lj-select]',
  standalone: true,
  host: {
    '[attr.disable-ripple]': 'true',
  },
})
export class LjSelectComponent implements AfterViewInit {
  private element = inject(ElementRef);
  private renderer = inject(Renderer2);
  private zoomService = inject(ZoomService);

  private matSelect = inject(MatSelect, { optional: true });

  // LOOP THROUGH MAT OPTIONS

  borderless = input(false, { transform: Boolean });

  ngAfterViewInit() {
    // Set disableRipple on the MatSelect component if it exists
    if (this.matSelect) {
      this.matSelect.disableRipple = true;
    }
    
    const options = document.getElementsByTagName('option');
    // eslint-disable-next-line
    for (let i = 0; i < options.length; i++) {
      options[i]?.setAttribute(
        'style',
        `${this.zoomService.selectItemStyle()}`
      );
    }
    // TODO: Remove this when we move from MUI or find a better way
    const el = this.element.nativeElement;
    const trigger = el.querySelector('.mat-mdc-select-trigger');

    if (!trigger) return;

    Object.entries(getStyle(this.borderless())).forEach(([key, value]) => {
      this.renderer.setStyle(trigger, key, value);
    });
  }
}
