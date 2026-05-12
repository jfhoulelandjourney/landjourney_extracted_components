import {
  ChangeDetectionStrategy,
  Component,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  MatRadioModule,
} from '@angular/material/radio';
import { FieldDirective } from '../../../../../directives/field.directive';
import { RequestUserTypes } from '../../../../../models/requestModels';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { LabelFieldComponent } from '../../../../../web-components/typography/label-field/label-field.component';

import { SmsComplianceComponent } from '../../../../../web-components/web-components';
import type {
  BorrowerModel,
  BorrowersFieldModel,
} from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import { BorrowerInformationComponent } from './borrower-information/borrower-information.component';

@Component({
  selector: 'lj-df-borrowers-field',
  imports: [
    FormsModule,
    MatCheckboxModule,
    LabelFieldComponent,
    MatIconModule,
    LjButtonComponent,
    BorrowerInformationComponent,
    MatRadioModule,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
    EditableInputComponent,
    SmsComplianceComponent,
  ],
  templateUrl: './borrowers-field.component.html',
  styleUrl: './borrowers-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: BorrowersFieldComponent },
    { provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' } },
  ],
})
export class BorrowersFieldComponent extends AbstractFieldComponent<BorrowersFieldModel> {
  confirmationCheck = model(true);

  mainBorrower = signal<BorrowerModel>({
    firstName: 'John',
    lastName: 'Deere',
    email: 'john@deere.com',
    phone: '555555551',
    isBusiness: true,
    businessName: 'Farm Equipment LLC',
    businessType: RequestUserTypes.LLC,
  });

  coBorrowers = signal<Array<BorrowerModel>>([
    {
      firstName: 'William',
      lastName: 'Deere',
      email: 'william@deere.com',
      phone: '555555555',
      isBusiness: false,
    },
  ]);

  isPhoneNumberValid(): boolean {
    return true;
  }
}
