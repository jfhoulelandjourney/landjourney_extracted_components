
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import { QuickRequiredConfigurationComponent } from '../../configuration/quick-required-configuration/quick-required-configuration.component';

@Component({
  selector: 'lj-df-input-field',
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    LjInputFieldComponent,
    MatIconModule,
    FieldConfigurationComponent,
    EditableInputComponent,
    QuickRequiredConfigurationComponent,
    ConditionalLogicComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: InputFieldComponent }],
})
export class InputFieldComponent extends AbstractFieldComponent<string> {}
