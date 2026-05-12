
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'landjourney-card-container',
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.scss'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardContainerComponent {
  @Input() title: string | null = null;
  @Input() subTitle: string | null = null;
  @Input() carousel = false;
}
