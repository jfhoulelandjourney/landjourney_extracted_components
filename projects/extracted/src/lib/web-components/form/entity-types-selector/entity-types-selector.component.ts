import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { noop } from 'es-toolkit';
import {
  MatOption,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
} from '@angular/material/select';
import { isNonNullable } from '../../../utils/nullishUtil';
import { RequestUserTypes } from '../../../models/requestModels';
import { formatEnumValue, pluralize } from '../../../utils/stringUtil';
import { ListPipe } from '../../../pipes/list/list.pipe';

const ALL = 'ALL' as const;
type InnerUserTypes = RequestUserTypes | typeof ALL;

@Component({
  selector: 'lj-entity-types-selector',
  imports: [ListPipe, MatSelect, MatSelectModule, MatSelectTrigger, MatOption],
  templateUrl: './entity-types-selector.component.html',
  styleUrl: './entity-types-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: EntityTypesSelectorComponent,
    },
  ],
})
export class EntityTypesSelectorComponent implements ControlValueAccessor {
  protected innerValue: InnerUserTypes[] = [];
  protected triggerLabelList: string[] = [];
  private allOptionSelected = false;

  @Input({ required: true })
  id = '';

  @Input()
  name = '';

  @Input()
  required = false;

  @Input()
  disabled = false;

  @Input()
  get value(): RequestUserTypes[] {
    return this.innerValue.filter(value => value !== ALL) as RequestUserTypes[];
  }
  set value(value: RequestUserTypes[] | null) {
    this.innerValue = this.normalizeUserTypesSelection(value ?? []);
    this.triggerLabelList = this.getUserTypeTriggerLabel(this.innerValue);
  }

  @Output()
  readonly valueChange = new EventEmitter<RequestUserTypes[]>();

  touched = false;

  allOption = { value: ALL, label: 'All' };
  allUserTypes = Object.values(RequestUserTypes);
  entityTypesOptions = this.allUserTypes.map(role => ({
    value: role,
    label: role.length > 3 ? formatEnumValue(role) : role,
  }));

  getUserTypeTriggerLabel(currentValue: InnerUserTypes[]) {
    if (!currentValue || currentValue.length === 0) {
      return [''];
    }
    if (currentValue.length >= this.allUserTypes.length) {
      return [this.allOption.label];
    }
    const selections = currentValue
      .slice(0, 2)
      .map(value => formatEnumValue(value));
    const extraSelectionsQty = currentValue.length - 2;
    const extraSelectionText =
      extraSelectionsQty > 0
        ? pluralize(extraSelectionsQty, 'other')
        : undefined;
    const list = [...selections, extraSelectionText].filter(isNonNullable);
    return list;
  }

  normalizeUserTypesSelection(values: InnerUserTypes[]): InnerUserTypes[] {
    this.allOptionSelected = values.length === this.allUserTypes.length;
    if (this.allOptionSelected) {
      return [...this.allUserTypes, ALL];
    } else {
      return values.filter(value => value !== ALL);
    }
  }

  handleEntityTypesSelectionChange(event: MatSelectChange) {
    const selectedValues = event.value as InnerUserTypes[];
    const allUserRolesGotSelected = selectedValues.includes(ALL);

    let result = selectedValues.filter(
      value => value !== ALL
    ) as RequestUserTypes[];

    // If 'ALL' is selected, select all roles
    if (allUserRolesGotSelected && !this.allOptionSelected) {
      result = [...this.allUserTypes];
    }

    // If 'ALL' option gets deselected, remove all roles
    if (this.allOptionSelected && !allUserRolesGotSelected) {
      result = [];
    }

    // Default update
    this.markAsTouched();
    this.value = result;
    this.valueChange.emit(this.value);
    this.onChange(this.value);
  }

  writeValue(userRoles: RequestUserTypes[]) {
    this.value = userRoles;
  }

  onChange: (value: RequestUserTypes[]) => unknown = noop;

  registerOnChange(onChange: (value: RequestUserTypes[]) => unknown) {
    this.onChange = onChange;
  }

  onTouched: VoidFunction = noop;

  registerOnTouched(onTouched: VoidFunction) {
    this.onTouched = onTouched;
  }

  markAsTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }
}
