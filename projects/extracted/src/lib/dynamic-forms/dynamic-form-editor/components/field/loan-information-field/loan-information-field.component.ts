
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  MatRadioModule,
} from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FieldDirective } from '../../../../../directives/field.directive';
import { InterestTypes } from '../../../../../services/lending/models/lending.enums';
import { PaymentFrequencies } from '../../../../../utils/loanUtil';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LabelFieldComponent } from '../../../../../web-components/typography/label-field/label-field.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import type { LoanInformationFieldModel } from '../../../../models/fields.models';

@Component({
  selector: 'lj-df-loan-information-field',
  templateUrl: './loan-information-field.component.html',
  styleUrls: ['./loan-information-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    FormsModule,
    LjInputFieldComponent,
    LabelFieldComponent,
    MatIconModule,
    MatTooltipModule,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
    EditableInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: LoanInformationFieldComponent },
    { provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' } },
  ],
})
export class LoanInformationFieldComponent
  extends AbstractFieldComponent<LoanInformationFieldModel>
  implements OnInit
{
  ngOnInit() {
    if (this.field().label === 'New field') {
      this.handleLabelChange('Loan Information');
    }
  }

  interestTypesOptions = [
    {
      value: InterestTypes.FIXED,
      label: 'Fixed Rate',
      description: 'Interest will stay the same for all the term',
    },
    {
      value: InterestTypes.VARIABLE,
      label: 'Variable Rate',
      description: 'Interest will vary over the course of the term',
    },
  ];

  paymentFrequencyOptions = [
    {
      value: PaymentFrequencies.MONTHLY,
      label: 'Monthly',
      description: 'Payment will be processed on the same day, once a month',
    },
    {
      value: PaymentFrequencies.SEMI_MONTHLY,
      label: 'Semi-monthly',
      description: 'Payment will be processed on the same days, twice a month',
    },
    {
      value: PaymentFrequencies.BI_WEEKLY,
      label: 'Bi-weekly',
      description:
        'Payment will be processed on the same day of the week, every 2 weeks',
    },
    {
      value: PaymentFrequencies.WEEKLY,
      label: 'Weekly',
      description:
        'Payment will be processed on the same day of the week, every week',
    },
  ];
}
