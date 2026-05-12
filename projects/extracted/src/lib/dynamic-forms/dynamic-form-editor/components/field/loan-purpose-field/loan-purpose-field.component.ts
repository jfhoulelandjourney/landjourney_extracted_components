import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import type { LoanPurposeFieldModel } from '../../../../models/fields.models';

@Component({
  selector: 'lj-df-loan-purpose-field',
  templateUrl: './loan-purpose-field.component.html',
  styleUrls: ['./loan-purpose-field.component.scss'],
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    LjInputFieldComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
    EditableInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: LoanPurposeFieldComponent },
  ],
})
export class LoanPurposeFieldComponent
  extends AbstractFieldComponent<LoanPurposeFieldModel[]>
  implements OnInit
{
  ngOnInit() {
    if (this.field().label === 'New field') {
      this.handleLabelChange('Loan Purpose');
    }
  }
}
