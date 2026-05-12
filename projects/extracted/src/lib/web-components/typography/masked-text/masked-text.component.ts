import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { MaskitoOptions } from '@maskito/core';
import { MaskitoPipe } from '@maskito/angular';
import { type Mask, toMaskitoMask } from '../../../constants/masks';

@Component({
  selector: 'lj-masked-text',
  imports: [MaskitoPipe],
  templateUrl: './masked-text.component.html',
  styleUrls: ['./masked-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaskedTextComponent {
  mask = input.required<Mask>();
  text = input.required<string>();

  protected maskitoMask = computed<MaskitoOptions | null>(() => {
    return toMaskitoMask(this.mask());
  });
}
