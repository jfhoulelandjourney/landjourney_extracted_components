import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LottieWrapperComponent } from '../lottie-wrapper/lottie-wrapper.component';

@Component({
  selector: 'landjourney-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LottieWrapperComponent],
})
export class LoadingComponent {
  @Input() inline = false;
}
