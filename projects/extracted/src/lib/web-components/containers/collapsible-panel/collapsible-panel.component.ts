import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'lj-collapsible-panel',
  imports: [MatIconModule, ActivateDirective],
  templateUrl: './collapsible-panel.component.html',
  styleUrl: './collapsible-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapsiblePanelComponent {
  expanded = model<boolean>(false);
}
