import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgxPrintModule } from 'ngx-print';
import { FieldDirective } from '../../../../../directives/field.directive';
import { RichTextComponent } from '../../../../../web-components/form/rich-text/rich-text.component';
import type { DisclaimerFieldModel } from '../../../../models/fields.models';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import { QuickRequiredConfigurationComponent } from '../../configuration/quick-required-configuration/quick-required-configuration.component';

@Component({
  selector: 'lj-df-disclaimer-field',
  imports: [
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    LjInputFieldComponent,
    MatCheckboxModule,
    NgxPrintModule,
    MatIconModule,
    MatButtonModule,
    RichTextComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
    QuickRequiredConfigurationComponent,
  ],
  templateUrl: './disclaimer-field.component.html',
  styleUrl: './disclaimer-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: DisclaimerFieldComponent },
  ],
})
export class DisclaimerFieldComponent extends AbstractFieldComponent<DisclaimerFieldModel> {
  handleInternalValueChange(value: Partial<DisclaimerFieldModel>) {
    const field = this.field();

    if (!field.value) return;

    const nextValue: DisclaimerFieldModel = {
      ...field.value,
      ...value,
    };

    field.value = nextValue;
    this.field.set(field);
    this.handleValueChange(nextValue);
  }
}
