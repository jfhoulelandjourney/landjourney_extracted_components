import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { formatEnumValue } from '../../../../../utils/stringUtil';
import {
  LjInputFieldComponent,
  type AutocompleteOption,
} from '../../../../../web-components/form/input-field/input-field.component';
import { LjSelectFieldComponent } from '../../../../../web-components/form/select-field/select-field.component';
import {
  ComparisonOperators,
  type DependsOn,
  type DynamicFormField,
  type DynamicFormSection,
} from '../../../../models/dynamic-forms.models';
import { fetchFieldsRecursively } from '../../../../utilities/dynamicFormsUtil';
import {
  ALL_ERRORS_SENTINEL,
  getPossibleValidationErrors,
  ValidationErrorKey,
} from '../../../../utilities/validation-errors.util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-conditional-logic',
  templateUrl: './conditional-logic.component.html',
  styleUrls: ['./conditional-logic.component.scss'],
  imports: [
    MatIconModule,
    LjInputFieldComponent,
    FormsModule,
    ActivateDirective,
    MatTooltipModule,
    LjSelectFieldComponent,
  ],
})
export class ConditionalLogicComponent {
  readonly removeConditionalLogic = output<void>();
  readonly handleConditionalLogicChange = output<DependsOn | undefined>();

  mobile = input<boolean>(false);
  dependsOn = input<DependsOn | undefined>();
  existingFields = input<AutocompleteOption[]>([]);
  formDefinition = input<(DynamicFormField<unknown> | DynamicFormSection)[]>(
    []
  );
  isSection = input<boolean>(false);

  operators = Object.values(ComparisonOperators).map(value => {
    return { value: value, label: formatEnumValue(value) };
  });

  possibleErrors = computed(() => {
    const dep = this.dependsOn();
    if (dep?.operation !== ComparisonOperators.IS_NOT_VALID || !dep.field) {
      return [];
    }
    const baseOptions: { value: string; label: string }[] = [
      { value: ALL_ERRORS_SENTINEL, label: 'All Errors' },
      { value: ValidationErrorKey.REQUIRED, label: 'Required' },
    ];
    const allFields = fetchFieldsRecursively(this.formDefinition());
    const targetField = allFields.find(f => f.name === dep.field);
    if (!targetField) return baseOptions;
    return [...baseOptions, ...getPossibleValidationErrors(targetField)];
  });

  operatorRequiresValue(): boolean {
    const op = this.dependsOn()?.operation;
    return (
      op !== ComparisonOperators.IS_VALID &&
      op !== ComparisonOperators.IS_NOT_VALID
    );
  }

  isNotValidOperator(): boolean {
    return this.dependsOn()?.operation === ComparisonOperators.IS_NOT_VALID;
  }

  handleFieldChange(event: AutocompleteOption) {
    const condition = this.dependsOn() ?? {
      field: '',
      operation: ComparisonOperators.NONE,
      value: '',
    };

    this.handleConditionalLogicChange.emit({
      field: event.value,
      operation: condition.operation,
      value: condition.value,
    });
  }

  handleOperationChange(operator: ComparisonOperators | undefined) {
    const condition = this.dependsOn() ?? {
      field: '',
      operation: ComparisonOperators.NONE,
      value: '',
    };

    this.handleConditionalLogicChange.emit({
      field: condition.field,
      operation: operator ?? ComparisonOperators.NONE,
      value: condition.value,
    });
  }

  handleValueChange(value: string | null) {
    const condition = this.dependsOn() ?? {
      field: '',
      operation: ComparisonOperators.NONE,
      value: '',
    };

    this.handleConditionalLogicChange.emit({
      field: condition.field,
      operation: condition.operation,
      value: value ?? '',
    });
  }

  removeCondition() {
    this.removeConditionalLogic.emit();
    this.handleConditionalLogicChange.emit(undefined);
  }
}
