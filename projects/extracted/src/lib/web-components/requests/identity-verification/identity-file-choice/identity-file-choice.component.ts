
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-identity-file-choice',
  templateUrl: './identity-file-choice.component.html',
  styleUrls: ['./identity-file-choice.component.scss'],
  imports: [MatIconModule, ActivateDirective],
})
export class IdentityFileChoiceComponent {
  isMobile = input(false);
  name = input.required<string>();

  readonly onBack = output();
  readonly onUploadClick = output();
  readonly onCameraClick = output();
}
