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
import { RequestUserRoles } from '../../../models/requestModels';
import { formatEnumValue, pluralize } from '../../../utils/stringUtil';
import { ListPipe } from '../../../pipes/list/list.pipe';

const ALL = 'ALL' as const;
type InnerUserRoles = RequestUserRoles | typeof ALL;

@Component({
  selector: 'lj-user-roles-selector',
  imports: [ListPipe, MatSelect, MatSelectModule, MatSelectTrigger, MatOption],
  templateUrl: './user-roles-selector.component.html',
  styleUrl: './user-roles-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: UserRolesSelectorComponent,
    },
  ],
})
export class UserRolesSelectorComponent implements ControlValueAccessor {
  protected innerValue: InnerUserRoles[] = [];
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
  onlyClientRoles = false;

  @Input()
  get value(): RequestUserRoles[] {
    return this.innerValue.filter(value => value !== ALL) as RequestUserRoles[];
  }
  set value(value: RequestUserRoles[] | null) {
    this.innerValue = this.normalizeUserRolesSelection(value ?? []);
    this.triggerLabelList = this.getUserRoleTriggerLabel(this.innerValue);
  }

  @Output()
  readonly valueChange = new EventEmitter<RequestUserRoles[]>();

  touched = false;

  allOption = { value: ALL, label: 'All' };
  allUserRoles = Object.values(RequestUserRoles);
  userRolesOptions = this.allUserRoles
    .filter(role => {
      return (
        (this.onlyClientRoles && role !== RequestUserRoles.LOAN_OFFICER) ||
        !this.onlyClientRoles
      );
    })
    .map(role => ({
      value: role,
      label: formatEnumValue(role),
    }));

  getUserRoleTriggerLabel(currentValue: InnerUserRoles[]) {
    if (!currentValue || currentValue.length === 0) {
      return [''];
    }
    if (currentValue.length >= this.allUserRoles.length) {
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

  normalizeUserRolesSelection(values: InnerUserRoles[]): InnerUserRoles[] {
    this.allOptionSelected = values.length === this.allUserRoles.length;
    if (this.allOptionSelected) {
      return [...this.allUserRoles, ALL];
    } else {
      return values.filter(value => value !== ALL);
    }
  }

  handleUserRolesSelectionChange(event: MatSelectChange) {
    const selectedValues = event.value as InnerUserRoles[];
    const allUserRolesGotSelected = selectedValues.includes(ALL);

    let result = selectedValues.filter(
      value => value !== ALL
    ) as RequestUserRoles[];

    // If 'ALL' is selected, select all roles
    if (allUserRolesGotSelected && !this.allOptionSelected) {
      result = [...this.allUserRoles];
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

  writeValue(userRoles: RequestUserRoles[]) {
    this.value = userRoles;
  }

  onChange: (value: RequestUserRoles[]) => unknown = noop;

  registerOnChange(onChange: (value: RequestUserRoles[]) => unknown) {
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
