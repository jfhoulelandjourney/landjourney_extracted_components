import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import {
  RequestUserRoles,
  getRequestUserRolesDisplayName,
} from '../../../../../models/requestModels';
import { LjButton2Component } from '../../../../button2/button.component';
import { LjSelectComponent } from '../../../../form/select/select.component';
import { nextAutoSigneeName } from '../../../../signature/signee-name.util';
import { BaseFieldInspector } from '../../components/base-field-inspector';
import { DEFAULT_SIGNEE_ROLES } from '../../constants';
import { FieldsBridgeService } from '../../services/fields-bridge.service';
import { FieldsService } from '../../services/fields.service';
import type { SigneeInfo, SignerInfo } from '../../types/field-data';
import type { RadioFieldData, RadioOption } from './radio.plugin';

let optionCounter = 0;

function makeNewOption(): RadioOption {
  return {
    id: `opt_${++optionCounter}_${Date.now()}`,
    value: '',
    selected: false,
  };
}

/**
 * Inspector panel for radio fields.
 *
 * Mirrors the checkbox inspector with one structural difference: `selected`
 * is single-select — toggling one option ON clears any previously-selected
 * option (turning the active default OFF leaves no default).
 */
@Component({
  selector: 'lj-pdf-radio-inspector',
  standalone: true,
  imports: [
    ActivateDirective,
    CommonModule,
    FormsModule,
    LjButton2Component,
    LjSelectComponent,
    MatCheckboxModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio.inspector.html',
  styleUrl: './radio.inspector.scss',
})
export class RadioInspectorComponent extends BaseFieldInspector<'radio'> {
  readonly type = 'radio' as const;
  readonly annotationId = input.required<string>();

  private readonly bridge = inject(FieldsBridgeService);
  private readonly fields = inject(FieldsService);

  readonly labelInput = signal('');
  readonly fieldKeyInput = signal('');
  readonly optionsInput = signal<readonly RadioOption[]>([]);

  readonly availableRoles = Object.values(RequestUserRoles);

  readonly roleDisplayNames = computed((): Record<string, string> => {
    const map: Record<string, string> = {};
    for (const role of this.availableRoles) {
      map[role] = getRequestUserRolesDisplayName(role as RequestUserRoles);
    }
    return map;
  });

  readonly assignmentMode = computed(() => this.bridge.assignmentMode());

  readonly availableSignees = computed<readonly SigneeInfo[]>(() => {
    const mode = this.bridge.assignmentMode();
    return mode?.kind === 'signees' ? mode.signees : [];
  });

  readonly selectedSignee = computed<SigneeInfo | null>(() => {
    const id = this.data()?.signee?.id;
    if (!id) return null;
    return this.availableSignees().find(s => s.id === id) ?? null;
  });

  readonly canCreateSignee = computed<boolean>(() => {
    const mode = this.bridge.assignmentMode();
    return mode?.kind === 'signees' && mode.onSigneeCreate !== undefined;
  });

  readonly creatingSignee = signal(false);
  readonly creatingInFlight = signal(false);
  readonly newSigneeName = signal('');
  readonly newSigneeRoles = signal<RequestUserRoles[]>([]);
  readonly newSigneeNameError = signal<string | null>(null);
  readonly newSigneeRolesError = signal<string | null>(null);

  readonly recipients = computed<readonly SignerInfo[]>(() => {
    const mode = this.bridge.assignmentMode();
    return mode?.kind === 'recipients' ? mode.recipients : [];
  });

  readonly selectedRecipient = computed<SignerInfo | null>(
    () => this.data()?.signer ?? null
  );

  private lastSeededAnnotationId: string | null = null;

  constructor() {
    super();
    this.setupAnnotationTracking(this.bridge);
    effect((): void => {
      const data = this.data() as RadioFieldData | null;
      const currentId = this.annotationId();
      if (!data) return;

      this.labelInput.set(data.label ?? '');
      this.fieldKeyInput.set(data.fieldKey ?? '');

      if (currentId !== this.lastSeededAnnotationId) {
        this.optionsInput.set(data.options ?? []);
        this.lastSeededAnnotationId = currentId;
      }
    });
  }

  protected override patch(patch: Record<string, unknown>): Promise<void> {
    return this.fields.update(this.annotationId(), patch);
  }

  onLabelChange(label: string): void {
    this.labelInput.set(label);
    void this.patch({ label });
  }

  onFieldKeyChange(fieldKey: string): void {
    this.fieldKeyInput.set(fieldKey);
    void this.patch({ fieldKey });
  }

  onReadonlyChange(checked: boolean): void {
    void this.patch({ readonly: checked });
  }

  onRequiredChange(checked: boolean): void {
    void this.patch({ required: checked });
  }

  trackOptionById(_index: number, option: RadioOption): string {
    return option.id;
  }

  onAddOption(): void {
    const next = [...this.optionsInput(), makeNewOption()];
    this.optionsInput.set(next);
    void this.patch({ options: next });
  }

  onRemoveOption(index: number): void {
    const next = this.optionsInput().filter((_, i) => i !== index);
    this.optionsInput.set(next);
    void this.patch({ options: next });
  }

  onOptionValueChange(index: number, value: string): void {
    const current = this.optionsInput();
    const option = current[index];
    if (!option) return;
    const next = current.map((o, i) =>
      i === index ? { ...o, value: value || undefined } : o
    );
    this.optionsInput.set(next);
    void this.patch({ options: next });
  }

  onOptionLabelChange(index: number, label: string): void {
    const current = this.optionsInput();
    const option = current[index];
    if (!option) return;
    const next = current.map((o, i) =>
      i === index ? { ...o, label: label || undefined } : o
    );
    this.optionsInput.set(next);
    void this.patch({ options: next });
  }

  /**
   * Single-select default toggle: turning one ON clears any previously-
   * selected option. Turning the active default OFF leaves no default.
   */
  onOptionSelectedChange(index: number, selected: boolean): void {
    const current = this.optionsInput();
    const next = current.map((o, i) =>
      i === index
        ? { ...o, selected }
        : selected
          ? { ...o, selected: false }
          : o
    );
    this.optionsInput.set(next);
    void this.patch({ options: next });
  }

  compareSigneeById(a: SigneeInfo | null, b: SigneeInfo | null): boolean {
    return a?.id === b?.id;
  }

  labelForSignee(s: SigneeInfo): string {
    return s.name;
  }

  onSigneeChange(signee: SigneeInfo | null): void {
    void this.patch({
      signee: signee
        ? { id: signee.id, name: signee.name, roles: [...signee.roles] }
        : null,
    });
  }

  beginSigneeCreate(): void {
    this.creatingSignee.set(true);
    this.newSigneeName.set(nextAutoSigneeName(this.availableSignees()));
    this.newSigneeRoles.set([...DEFAULT_SIGNEE_ROLES]);
    this.newSigneeNameError.set(null);
    this.newSigneeRolesError.set(null);
  }

  cancelSigneeCreate(): void {
    this.creatingSignee.set(false);
  }

  async confirmSigneeCreate(): Promise<void> {
    if (this.creatingInFlight()) return;

    const mode = this.bridge.assignmentMode();
    if (mode?.kind !== 'signees' || !mode.onSigneeCreate) return;

    const name = this.newSigneeName().trim();
    if (!name) {
      this.newSigneeNameError.set('Name is required');
      return;
    }
    if (mode.signees.some(s => s.name === name)) {
      this.newSigneeNameError.set('Name must be unique');
      return;
    }
    if (this.newSigneeRoles().length === 0) {
      this.newSigneeRolesError.set('Pick at least one role');
      return;
    }
    this.newSigneeNameError.set(null);
    this.newSigneeRolesError.set(null);

    this.creatingInFlight.set(true);
    try {
      const created = await mode.onSigneeCreate({
        name,
        roles: [...this.newSigneeRoles()],
      });
      await this.patch({
        signee: {
          id: created.id,
          name: created.name,
          roles: [...created.roles],
        },
      });
      this.creatingSignee.set(false);
    } finally {
      this.creatingInFlight.set(false);
    }
  }

  compareRecipientById(a: SignerInfo | null, b: SignerInfo | null): boolean {
    return a?.id === b?.id;
  }

  labelForRecipient(recipient: SignerInfo): string {
    return `${recipient.name} · ${getRequestUserRolesDisplayName(recipient.role)}`;
  }

  onRecipientChange(recipient: SignerInfo | null): void {
    void this.patch({ signer: recipient });
  }
}
