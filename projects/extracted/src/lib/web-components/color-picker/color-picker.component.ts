
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  output,
  signal,
  type OnDestroy,
} from '@angular/core';
import { ColorPickerDirective } from 'ngx-color-picker';
import { BrandColors } from '../../services/organization/tenant.models';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  imports: [ColorPickerDirective],
})
export class ColorPickerComponent implements OnInit, OnDestroy {
  label = input('Color');
  defaultColor = input('');
  readonly onColorChange = output<BrandColors>();

  color = '#06C1B8';
  colorShades = signal<string[]>([]);

  destroy$ = new Subject<void>();

  constructor() {
    toObservable(this.defaultColor)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleColorChange(this.defaultColor());
        },
      });
  }

  ngOnInit() {
    this.color = this.defaultColor();
    this.updateShades();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleColorChange(newColor: string) {
    this.color = newColor.toUpperCase();
    this.updateShades();

    this.onColorChange.emit({
      color: this.color,
      variations: {
        '100': this.colorShades()[0] ?? newColor,
        '200': this.colorShades()[1] ?? newColor,
        '300': this.colorShades()[2] ?? newColor,
        '400': this.colorShades()[3] ?? newColor,
        '500': this.colorShades()[4] ?? newColor,
        '600': this.colorShades()[5] ?? newColor,
        '700': this.colorShades()[6] ?? newColor,
        '800': this.colorShades()[7] ?? newColor,
      },
    });
  }

  updateShades() {
    const colorShades = [];
    for (let i = 1; i <= 8; i++) {
      colorShades.push(this.shadeColor(this.color, (i - 4.5) * 10));
    }
    this.colorShades.set(colorShades);
  }

  shadeColor(color: string, percent: number): string {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);
    if (percent < 0) {
      // lighten
      R = Math.round(R + (255 - R) * (-percent / 100));
      G = Math.round(G + (255 - G) * (-percent / 100));
      B = Math.round(B + (255 - B) * (-percent / 100));
    } else {
      // darken
      R = Math.round(R * (1 - percent / 100));
      G = Math.round(G * (1 - percent / 100));
      B = Math.round(B * (1 - percent / 100));
    }
    return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
  }
}
