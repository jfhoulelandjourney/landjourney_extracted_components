import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import { QuickRequiredConfigurationComponent } from '../../configuration/quick-required-configuration/quick-required-configuration.component';

@Component({
  selector: 'lj-df-checkbox-field',
  templateUrl: './checkbox-field.component.html',
  styleUrls: ['./checkbox-field.component.scss'],
  imports: [
    ActivateDirective,
    FormsModule,
    MatIconModule,
    EditableInputComponent,
    QuickRequiredConfigurationComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: CheckboxFieldComponent }],
})
export class CheckboxFieldComponent extends AbstractFieldComponent<boolean> {
  value = signal(false);
}
