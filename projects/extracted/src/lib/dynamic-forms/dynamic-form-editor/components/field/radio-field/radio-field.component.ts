
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FieldDirective } from '../../../../../directives/field.directive';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import { OptionsConfigurationComponent } from '../../configuration/options-configuration/options-configuration.component';
import { QuickRequiredConfigurationComponent } from '../../configuration/quick-required-configuration/quick-required-configuration.component';

@Component({
  selector: 'lj-df-radio-field',
  templateUrl: './radio-field.component.html',
  styleUrls: ['./radio-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    FieldConfigurationComponent,
    ConditionalLogicComponent,
    EditableInputComponent,
    QuickRequiredConfigurationComponent,
    OptionsConfigurationComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: RadioFieldComponent }],
})
export class RadioFieldComponent extends AbstractFieldComponent<string> {}
