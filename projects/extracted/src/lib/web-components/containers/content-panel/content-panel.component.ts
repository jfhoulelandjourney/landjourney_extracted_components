import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'lj-content-panel',
  imports: [],
  templateUrl: './content-panel.component.html',
  styleUrl: './content-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPanelComponent {
  title = input<string | undefined>(undefined);
  titleColor = input<'gray' | 'white'>('gray');
  panelPosition = input<'left' | 'center' | 'right'>('center');
}
