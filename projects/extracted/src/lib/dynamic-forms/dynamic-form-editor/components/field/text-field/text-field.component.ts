import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjTextareaFieldComponent } from '../../../../../web-components/form/textarea-field/textarea-field.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import { QuickRequiredConfigurationComponent } from '../../configuration/quick-required-configuration/quick-required-configuration.component';

@Component({
  selector: 'lj-df-text-field',
  templateUrl: './text-field.component.html',
  styleUrls: ['./text-field.component.scss'],
  imports: [
    MatIconModule,
    MatInputModule,
    FormsModule,
    EditableInputComponent,
    QuickRequiredConfigurationComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
    LjTextareaFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: TextFieldComponent }],
})
export class TextFieldComponent extends AbstractFieldComponent<string> {}
