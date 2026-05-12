import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'lj-thumbnail-viewer',
  imports: [ActivateDirective],
  host: {
    '[class.small]': 'size() === "small"',
    '[class.tiny]': 'size() === "tiny"',
  },
  templateUrl: './thumbnail-viewer.component.html',
  styleUrl: './thumbnail-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThumbnailViewerComponent {
  pageCount = input<number>(1);
  src = input.required<string>();
  size = input<'small' | 'normal' | 'tiny'>('small');

  readonly activate = output<void>();
}
