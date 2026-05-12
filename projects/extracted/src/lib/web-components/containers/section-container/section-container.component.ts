
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'lj-section-container',
  templateUrl: './section-container.component.html',
  styleUrls: ['./section-container.component.scss'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionContainerComponent {
  title = input<string | undefined>(undefined);
  odd = input<boolean>(false);
}
