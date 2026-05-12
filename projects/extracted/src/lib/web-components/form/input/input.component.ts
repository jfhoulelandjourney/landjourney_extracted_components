import { ChangeDetectionStrategy, Component } from '@angular/core';
import { getRandomString } from '../../../utils/stringUtil';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[lj-input]:not([type="radio"]), [lj-input]:not([type="checkbox"])',
  imports: [],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lj-input]': 'true',
    id: 'generatedId',
  },
})
export class LjInputComponent {
  generatedId = getRandomString();
}
