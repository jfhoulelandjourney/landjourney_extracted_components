import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';

@Component({
  selector: 'lj-df-submit-button',
  imports: [
    LjButtonComponent,
    EditableInputComponent,
    FieldConfigurationComponent,
  ],
  templateUrl: './submit-button.component.html',
  styleUrl: './submit-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: SubmitButtonComponent }],
})
export class SubmitButtonComponent extends AbstractFieldComponent<void> {
  getButtonText(): string {
    if (this.field().label && this.field().label.trim() !== '') {
      return this.field().label;
    }

    return 'Submit';
  }
}
