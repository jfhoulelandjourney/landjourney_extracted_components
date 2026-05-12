import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SpacingDirective } from '../../../directives/spacing/spacing.directive';

@Component({
  selector: 'lj-box-row',
  imports: [],
  templateUrl: './box-row.component.html',
  styleUrl: './box-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: SpacingDirective,
      inputs: [
        'padding',
        'paddingInline',
        'paddingInlineStart',
        'paddingInlineEnd',
        'paddingBlock',
        'paddingBlockStart',
        'paddingBlockEnd',
      ],
    },
  ],
  host: {
    '[class.box-row]': 'true',
  },
})
export class BoxRowComponent {}
