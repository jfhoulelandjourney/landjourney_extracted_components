import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import type { LoanSourceFieldModel } from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';

@Component({
  selector: 'lj-df-loan-sources-field',
  templateUrl: './loan-sources-field.component.html',
  styleUrls: ['./loan-sources-field.component.scss'],
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    LjInputFieldComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
    EditableInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: LoanSourcesFieldComponent },
  ],
})
export class LoanSourcesFieldComponent
  extends AbstractFieldComponent<LoanSourceFieldModel>
  implements OnInit
{
  ngOnInit() {
    if (this.field().label === 'New field') {
      this.handleLabelChange('Loan Sources');
    }
  }
}
