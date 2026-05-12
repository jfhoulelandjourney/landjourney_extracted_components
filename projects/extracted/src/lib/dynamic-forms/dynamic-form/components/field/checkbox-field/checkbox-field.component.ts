import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import { CopyToClipboardButtonComponent } from '../../../../../web-components/copy-to-clipboard-button/copy-to-clipboard-button.component';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-checkbox-field',
  templateUrl: './checkbox-field.component.html',
  styleUrls: ['./checkbox-field.component.scss'],
  imports: [
    ActivateDirective,
    FormsModule,
    MatIconModule,
    CopyToClipboardButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: CheckboxFieldComponent }],
})
export class CheckboxFieldComponent
  extends AbstractFieldComponent<boolean>
  implements OnInit
{
  ngOnInit() {
    if (this.field().value === undefined) {
      this.field().value = false;
    }
  }

  override isValid(): boolean {
    return true;
  }
}
