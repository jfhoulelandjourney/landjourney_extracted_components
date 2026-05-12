
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import type { IdDocumentType } from '../../../../services/data/enums/identity-verification.enums';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-identity-id-choice',
  templateUrl: './identity-id-choice.component.html',
  styleUrls: ['./identity-id-choice.component.scss'],
  imports: [MatIconModule, ActivateDirective],
})
export class IdentityIdChoiceComponent {
  isMobile = input(false);
  name = input.required<string>();

  readonly onBack = output();
  readonly onIdDocumentTypeClick = output<IdDocumentType>();
}
