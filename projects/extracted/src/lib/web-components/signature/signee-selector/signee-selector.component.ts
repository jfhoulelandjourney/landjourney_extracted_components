import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import type { SetOptional } from 'type-fest';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  isRequestUserRole,
  RequestUserRoles,
} from '../../../models/requestModels';
import { formatEnumValue, getUUID7 } from '../../../utils/stringUtil';
import { LjButton2Component } from '../../button2/button.component';
import { LjSelectComponent } from '../../form/select/select.component';
import { nextAutoSigneeName } from '../signee-name.util';

export type SigneeSelection = {
  id: string;
  name: string;
  roles: RequestUserRoles[];
  noDelete?: boolean; // Optional property to disable delete button
};

export type SigneeChange = {
  type: 'add' | 'edit' | 'delete';
  signee: SigneeSelection;
  editValue?: {
    from: RequestUserRoles[];
    to: RequestUserRoles[];
  };
};

const ROLE_ABBREVIATIONS: Record<RequestUserRoles, string> = {
  [RequestUserRoles.BORROWER]: 'B',
  [RequestUserRoles.CO_BORROWER]: 'CoB',
  [RequestUserRoles.GUARANTOR]: 'G',
  [RequestUserRoles.COLLABORATOR]: 'C',
  [RequestUserRoles.LOAN_OFFICER]: 'LO',
  [RequestUserRoles.INTERNAL]: 'In',
  [RequestUserRoles.NON_OBLIGATED_PARTY]: 'NOP'
};

@Component({
  selector: 'lj-signee-selector',
  imports: [
    ActivateDirective,
    CommonModule,
    FormsModule,
    LjButton2Component,
    LjSelectComponent,
    MatIcon,
    MatSelect,
    MatSelectModule,
    NgTemplateOutlet,
  ],
  templateUrl: './signee-selector.component.html',
  styleUrl: './signee-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigneeSelectorComponent {
  protected formatEnumValue = formatEnumValue;
  protected formatRoleAbbreviation = (role: RequestUserRoles) => {
    return ROLE_ABBREVIATIONS[role] || role.at(0);
  };

  options = model<SigneeSelection[]>([]);
  selected = model<SigneeSelection['id'] | null>(null);
  allowDelete = input<boolean>(true);

  protected editingSignee = signal<SetOptional<
    SigneeSelection,
    'roles'
  > | null>(null);

  protected selectedSignee = computed(() => {
    const list = this.options();
    const selectedId = this.selected();
    if (!selectedId) {
      return null;
    }
    return list.find(item => item.id === selectedId) || null;
  });

  protected editingNewSignee = computed(() => {
    const options = this.options() ?? [];
    const editingSignee = this.editingSignee();
    if (!editingSignee) {
      return false;
    }
    // If the editing signee is not in the options, it is a new signee
    return !options.some(item => item.id === editingSignee.id);
  });

  protected roleOptions = computed<
    { value: RequestUserRoles; label: string }[]
  >(() => {
    return Object.values(RequestUserRoles)
      .filter(
        role =>
          role !== RequestUserRoles.COLLABORATOR &&
          role !== RequestUserRoles.LOAN_OFFICER
      )
      .map(role => {
        return {
          value: role,
          label: formatEnumValue(role),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly change = output<{ list: SigneeSelection[]; change: SigneeChange }>();
  readonly delete = output<SigneeSelection | null>();
  readonly select = output<SigneeSelection | null>();

  selectSignee(signeeId: string) {
    const selectedSigneeId = this.selected();
    if (selectedSigneeId === signeeId) {
      this.selected.set(null);
      this.select.emit(null);
      return;
    }

    const signee = this.options().find(item => item.id === signeeId);
    if (!signee) {
      return;
    }
    const { roles } = signee;
    const normalizedRoles = roles.filter(r => isRequestUserRole(r));

    if (normalizedRoles.length === 0) {
      // Must have at least one role to be selected
      return;
    }

    this.editingSignee.set(null);
    this.selected.set(signee.id);
    this.select.emit(signee);
  }

  createSigneeOption() {
    // Set all available roles as default
    const allRoles = Object.values(RequestUserRoles)
      .filter(
        role =>
          role !== RequestUserRoles.COLLABORATOR &&
          role !== RequestUserRoles.LOAN_OFFICER
      )
      .sort((a, b) => a.localeCompare(b));

    this.editingSignee.set({
      id: getUUID7(),
      name: nextAutoSigneeName(this.options()),
      roles: allRoles,
    });
  }

  editSignee(signee: SigneeSelection) {
    // Ensure all roles are selected by default if none are set
    const defaultRoles = signee.roles?.length
      ? signee.roles
      : Object.values(RequestUserRoles).filter(
          role =>
            role !== RequestUserRoles.COLLABORATOR &&
            role !== RequestUserRoles.LOAN_OFFICER
        );

    this.editingSignee.set({
      ...signee,
      roles: defaultRoles.sort((a, b) => a.localeCompare(b)),
    });
  }

  closeSignee() {
    this.editingSignee.set(null);
  }

  removeSignee(signee: SigneeSelection) {
    this.closeSignee();
    // Emit intent without mutating the local options model. The host (modal)
    // owns the apply step — confirming the deletion is what triggers the
    // actual list update via the model two-way binding.
    const proposed = this.options().filter(item => item.id !== signee.id);
    this.delete.emit(signee);
    this.change.emit({
      list: proposed,
      change: { type: 'delete', signee },
    });
  }

  handleRoleChange(
    signeeId: SigneeSelection['id'] | null | undefined,
    selectedRoles: RequestUserRoles[]
  ) {
    if (!signeeId) {
      return;
    }

    // Filter to ensure only valid roles
    const validRoles = selectedRoles.filter(role => isRequestUserRole(role));

    this.editingSignee.update(signee => {
      if (!signee || signee.id !== signeeId) {
        return signee;
      }

      return {
        ...signee,
        roles: validRoles,
      };
    });
  }

  toggleRole(
    signeeId: SigneeSelection['id'] | null | undefined,
    roles: RequestUserRoles[]
  ) {
    const normalizedRoles = roles.filter(r => isRequestUserRole(r));

    if (!signeeId || normalizedRoles.length === 0) {
      return;
    }

    this.editingSignee.update(signee => {
      if (!signee || signee.id !== signeeId) {
        return signee;
      }

      return {
        ...signee,
        roles: normalizedRoles,
      };
    });
  }

  addSigneeOption(signee: SigneeSelection) {
    if (!signee) {
      return;
    }

    const { roles } = signee;
    const normalizedRoles = roles.filter(r => isRequestUserRole(r));

    if (normalizedRoles.length === 0) {
      return;
    }

    // Append only — names are user-editable and persistent, so we never
    // re-number existing signees on add.
    this.options.update(options => options.concat([signee]));
  }

  confirmSignee() {
    const isNew = this.editingNewSignee();
    const editingSignee = this.editingSignee();

    if (!editingSignee) {
      return;
    }

    const { roles } = editingSignee;
    const normalizedRoles = roles?.filter(r => isRequestUserRole(r)) ?? [];

    if (normalizedRoles.length === 0) {
      // Must have at least one role
      return;
    }

    const updatedSignee = editingSignee as SigneeSelection;

    if (isNew) {
      this.addSigneeOption(updatedSignee);
    } else {
      // Update only the edited signee. Other signees keep their (possibly
      // user-edited) names — no auto-renumber.
      this.options.update(options =>
        options.map(item =>
          item.id === updatedSignee.id
            ? {
                ...item,
                name: updatedSignee.name,
                roles: updatedSignee.roles.filter(r => isRequestUserRole(r)),
              }
            : item
        )
      );
    }

    this.editingSignee.set(null);
    this.emitRoles({
      type: isNew ? 'add' : 'edit',
      signee: updatedSignee,
      editValue: isNew
        ? undefined
        : { from: editingSignee.roles ?? [], to: updatedSignee.roles ?? [] },
    });
    const signeeRoles = this.options();

    if (editingSignee.id === this.selected()) {
      this.select.emit(updatedSignee);
    }

    if (signeeRoles.length === 1 && this.selected() === null) {
      // If this is the first signee being added, select it automatically
      const firstSignee = signeeRoles.at(0);
      if (firstSignee) {
        this.selectSignee(firstSignee.id);
      }
    }
  }

  emitRoles(change: SigneeChange) {
    this.change.emit({
      list: this.options(),
      change,
    });
  }
}
