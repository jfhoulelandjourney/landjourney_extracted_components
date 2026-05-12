import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { FormTypes } from '../../../../models/dynamic-forms.models';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-submit-button',
  imports: [LjButtonComponent, ActivateDirective],
  templateUrl: './submit-button.component.html',
  styleUrl: './submit-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: SubmitButtonComponent }],
})
export class SubmitButtonComponent extends AbstractFieldComponent<void> {
  // WE'LL NEED TO DISABLE THE BUTTON BASED ON THE STATUS OF THE FORM...
  // DISABLED ALREADY EXIST, AS WELL AS isValid FOR EACH COMPONENT (BLANK)
  // WE NEED TO IMPLEMENT THE isValid AND CONNECT THE DOTS.

  FormTypes = FormTypes;
  formType = input.required<FormTypes>();

  override isValid(): boolean {
    return true;
  }

  handleSubmit() {
    this.submit.emit();
  }

  getButtonText(): string {
    if (this.field().label && this.field().label.trim() !== '') {
      return this.field().label;
    }

    return 'Submit';
  }
}
