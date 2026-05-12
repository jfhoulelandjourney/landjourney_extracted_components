import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjSelectFieldComponent } from '../../../../../web-components/form/select-field/select-field.component';
import { type OnScreenApprovalFieldModel } from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';

@Component({
  selector: 'lj-df-on-screen-approval',
  imports: [
    MatIconModule,
    FormsModule,
    MatButtonModule,
    LjSelectFieldComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
  ],
  templateUrl: './on-screen-approval.component.html',
  styleUrl: './on-screen-approval.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: OnScreenApprovalComponent },
  ],
})
export class OnScreenApprovalComponent extends AbstractFieldComponent<OnScreenApprovalFieldModel> {
  handleInternalValueChange(value: Partial<OnScreenApprovalFieldModel>) {
    const field = this.field();

    if (field.value) {
      Object.assign(field.value, value);
      this.field.set(field);
      this.handleValueChange(field.value);
    }
  }
}
