import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SpacingDirective } from '../../../directives/spacing/spacing.directive';

@Component({
  selector: 'lj-box',
  imports: [],
  templateUrl: './box.component.html',
  styleUrl: './box.component.scss',
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
    '[class.box-wrapper]': 'true',
  },
})
export class BoxComponent {}
