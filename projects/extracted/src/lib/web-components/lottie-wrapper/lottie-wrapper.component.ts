import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';

@Component({
  selector: 'lj-lottie-wrapper',
  imports: [LottieComponent],
  templateUrl: './lottie-wrapper.component.html',
  styleUrl: './lottie-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LottieWrapperComponent implements OnInit {
  jsonPath = input.required<string>();
  width = input<string>('100%');
  height = input<string>('100%');

  options = signal<AnimationOptions>({});

  ngOnInit() {
    this.options.set({
      path: this.jsonPath(),
    });
  }
}
