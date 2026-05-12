import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
} from '@angular/core';

@Component({
  selector: 'lj-custom-tool-tip',
  imports: [NgTemplateOutlet],
  templateUrl: './custom-tool-tip.component.html',
  styleUrl: './custom-tool-tip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomToolTipComponent {
  text = input<string>('');
  contentTemplate = input<TemplateRef<unknown> | undefined>(undefined);
}
