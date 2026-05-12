import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FieldDirective } from '../../../../../directives/field.directive';
import {
  FieldTypes,
  type Field,
} from '../../../../../services/products/fields/fields.models';
import { FORMULA_CATEGORIES } from '../../../../../web-components/form/formula-input/formula-categories.constant';
import { FormulaInputComponent } from '../../../../../web-components/form/formula-input/formula-input.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import { QuickRequiredConfigurationComponent } from '../../configuration/quick-required-configuration/quick-required-configuration.component';
import { resolveComputedFormulaReferences } from './computed-formula.util';

@Component({
  selector: 'lj-df-computed-field',
  templateUrl: './computed-field.component.html',
  styleUrls: ['./computed-field.component.scss'],
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    FormulaInputComponent,
    FieldConfigurationComponent,
    EditableInputComponent,
    ConditionalLogicComponent,
    QuickRequiredConfigurationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: ComputedFieldComponent }],
})
export class ComputedFieldComponent extends AbstractFieldComponent<string> {
  isFormulaReadOnly(): boolean {
    return this.field().parameters.computedFormulaReadOnly === true;
  }

  formulaContextFields(): Field[] {
    return this.existingFields().map(
      (ef): Field => ({
        id: ef.id,
        name: ef.value,
        label: ef.value,
        isSystem: false,
        fieldType: FieldTypes.INPUT,
        parameters: {},
        regulations: {},
        disabled: false,
        isDeleted: false,
        version: 1,
      })
    );
  }

  getReferencedFields(): { name: string; exists: boolean }[] {
    const formula = this.field().parameters.computedFormula ?? '';
    return resolveComputedFormulaReferences(
      formula,
      this.existingFields().map(f => f.value),
      new Set(Object.keys(FORMULA_CATEGORIES))
    );
  }

  handleFormulaChange(value: string) {
    const field = this.field();

    if (field.parameters.computedFormulaReadOnly === true) {
      return;
    }

    if (field.parameters.computedFormula !== value) {
      field.parameters.computedFormula = value;
      this.field.set({ ...field });
      this.fieldChange.emit(field);
    }
  }
}
