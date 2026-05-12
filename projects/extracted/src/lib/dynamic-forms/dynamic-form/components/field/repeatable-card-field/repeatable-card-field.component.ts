import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as formulajs from '@formulajs/formulajs';
import { maskitoTransform } from '@maskito/core';
import { getMoneyMaskitoOptions } from '../../../../../constants/masks';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { ConfirmationRequiredDirective } from '../../../../../directives/confirmation-required/confirmation-required.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import {
  getUUID4,
  stripNonNumberCharacters,
} from '../../../../../utils/stringUtil';
import { TimeUtil } from '../../../../../utils/timeUtil';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
} from '../../../../models/dynamic-forms.models';
import {
  getDefaultValueForFieldType,
  normalizeRepeatableCardFieldModel,
  type NoteFieldModel,
  type NoteVariant,
  type RepeatableCardFieldModel,
  type RepeatableCardRowData,
} from '../../../../models/fields.models';
import { elementShouldDisplay } from '../../../../utilities/dynamicFormsUtil';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { CheckboxFieldComponent } from '../checkbox-field/checkbox-field.component';
import { ComputedFieldComponent } from '../computed-field/computed-field.component';
import { DateFieldComponent } from '../date-field/date-field.component';
import { InputFieldComponent } from '../input-field/input-field.component';
import { MoneyFieldComponent } from '../money-field/money-field.component';
import { NoteFieldComponent } from '../note-field/note-field.component';
import { NumberFieldComponent } from '../number-field/number-field.component';
import { RadioFieldComponent } from '../radio-field/radio-field.component';
import { SelectFieldComponent } from '../select-field/select-field.component';
import { TextFieldComponent } from '../text-field/text-field.component';
import {
  buildRepeatableCardSummaryData,
  formatRepeatableCardSummaryDisplay,
  formatRepeatableCardSummaryFieldLabel,
  getRepeatableCardSummaryMode,
} from './utils';

type Row = RepeatableCardRowData;

const FORMULAJS_KEYS = new Set(Object.keys(formulajs));

@Component({
  selector: 'lj-df-repeatable-card',
  imports: [
    MatIconModule,
    MatButtonModule,
    LjButtonComponent,
    ActivateDirective,
    ConfirmationRequiredDirective,
    InputFieldComponent,
    TextFieldComponent,
    MoneyFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    SelectFieldComponent,
    RadioFieldComponent,
    CheckboxFieldComponent,
    ComputedFieldComponent,
    NoteFieldComponent,
  ],
  templateUrl: './repeatable-card-field.component.html',
  styleUrl: './repeatable-card-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: RepeatableCardFieldComponent },
  ],
})
export class RepeatableCardFieldComponent extends AbstractFieldComponent<RepeatableCardFieldModel> {
  isMobile = input(false);

  @ViewChildren(FieldDirective)
  innerFieldComponents!: QueryList<AbstractFieldComponent<unknown>>;

  editedRow = model<Row>({ id: getUUID4() });
  pendingNewRowId = signal<string | null>(null);

  FieldType = DynamicFormFieldTypes;

  private normalizedModel = computed((): RepeatableCardFieldModel => {
    const raw = this.formData()[this.field().name] ?? this.field().value;
    return normalizeRepeatableCardFieldModel(raw);
  });

  private config = computed((): RepeatableCardFieldModel => {
    return this.normalizedModel();
  });

  private allRows = computed<Row[]>(() =>
    this.normalizedModel().data.rows.map(r => this.stripNoteFieldsFromRow(r))
  );

  private innerFieldCache = new Map<string, DynamicFormField<unknown>>();

  innerRuntimeFields = computed(() => {
    const specs = this.itemFields();
    const row = this.editedRow();
    const cache = this.innerFieldCache;
    const nextCache = new Map<string, DynamicFormField<unknown>>();

    for (const spec of specs) {
      const value = row[spec.name];
      const existing = cache.get(spec.id);
      if (
        existing &&
        existing.value === value &&
        existing.label === spec.label &&
        existing.required === (spec.required ?? false) &&
        existing.dependsOn === spec.dependsOn
      ) {
        nextCache.set(spec.id, existing);
      } else {
        nextCache.set(spec.id, {
          id: spec.id,
          name: spec.name,
          label: spec.label,
          column: spec.column,
          fieldType: spec.fieldType,
          required: spec.required ?? false,
          parameters: spec.parameters,
          dependsOn: spec.dependsOn,
          value,
        });
      }
    }
    this.innerFieldCache = nextCache;
    return nextCache;
  });

  itemFields = computed(() => this.config().itemFields ?? []);

  private stripNoteFieldsFromRow(row: Row): Row {
    const noteNames = this.itemFields()
      .filter(
        s =>
          (s.fieldType as DynamicFormFieldTypes) === DynamicFormFieldTypes.NOTE
      )
      .map(s => s.name);
    if (noteNames.length === 0) {
      return row;
    }
    const out: Row = { ...row };
    for (const name of noteNames) {
      delete out[name];
    }
    return out;
  }

  summaryFieldSpecs = computed(() => {
    const configured = this.config().summaryFieldIds;
    if (configured === undefined) {
      return this.itemFields();
    }
    const allowed = new Set(configured);
    return this.itemFields().filter(s => allowed.has(s.id));
  });

  showSummary = computed(() => this.config().showSummary === true);

  itemLabel = computed(() => this.config().label?.trim() || 'item');

  addButtonLabel = computed(() => `Add ${this.itemLabel()}`);

  rows = computed<Row[]>(() => {
    const list = this.allRows();
    if (this.mode() === 'locked') {
      return list.filter(r => this.isRowValid(r));
    }
    return list;
  });

  summaryRow = computed(() => {
    const fields = this.summaryFieldSpecs();
    const rows = this.rows();
    if (fields.length === 0 || rows.length === 0) {
      return [];
    }

    const modes = this.config().summaryFieldModes;
    return fields.map(spec => {
      const mode = getRepeatableCardSummaryMode(spec, modes);
      const value = formatRepeatableCardSummaryDisplay(
        spec,
        rows,
        mode,
        (row, s) => this.displayValue(row, s),
        n => this.formatMoneyDisplay(n)
      );
      return {
        fieldId: spec.id,
        label: formatRepeatableCardSummaryFieldLabel(spec.label, mode),
        value,
      };
    });
  });

  private buildSummaryRecord(rows: Row[]) {
    return buildRepeatableCardSummaryData(
      this.summaryFieldSpecs(),
      rows,
      this.config().summaryFieldModes,
      (row, spec) => this.displayValue(row, spec)
    );
  }

  getCardTitle(row: Row): string {
    const titleFieldId = this.config().titleField;
    const fallback = `${this.field().label} ${this.itemLabel()}`;
    if (!titleFieldId) {
      return fallback;
    }
    const spec = this.itemFields().find(s => s.id === titleFieldId);
    if (!spec) {
      return fallback;
    }
    return this.displayValue(row, spec) || fallback;
  }

  getInnerField(spec: DynamicFormField<unknown>): DynamicFormField<unknown> {
    return (
      this.innerRuntimeFields().get(spec.id) ?? {
        id: spec.id,
        name: spec.name,
        label: spec.label,
        column: spec.column,
        fieldType: spec.fieldType,
        required: spec.required ?? false,
        parameters: spec.parameters,
        dependsOn: spec.dependsOn,
        value: this.editedRow()[spec.name],
      }
    );
  }

  innerFieldAsString(
    spec: DynamicFormField<unknown>
  ): DynamicFormField<string> {
    return this.getInnerField(spec) as DynamicFormField<string>;
  }

  innerFieldAsNumber(
    spec: DynamicFormField<unknown>
  ): DynamicFormField<number> {
    return this.getInnerField(spec) as DynamicFormField<number>;
  }

  innerFieldAsBoolean(
    spec: DynamicFormField<unknown>
  ): DynamicFormField<boolean> {
    return this.getInnerField(spec) as DynamicFormField<boolean>;
  }

  innerNoteField(
    spec: DynamicFormField<unknown>
  ): DynamicFormField<NoteFieldModel> {
    const cached = this.getInnerField(spec);
    const noteModel = spec.value as NoteFieldModel | undefined;
    const body =
      noteModel?.note?.trim() || spec.parameters.placeholder || spec.label;
    const noteValue: NoteFieldModel = {
      variant: noteModel?.variant ?? 'neutral',
      note: body,
    };
    return {
      ...cached,
      label: spec.label,
      fieldType: DynamicFormFieldTypes.NOTE,
      value: noteValue,
    } as DynamicFormField<NoteFieldModel>;
  }

  editedRowAsFormData(): Record<string, unknown> {
    return this.editedRow();
  }

  shouldShowInnerField(
    spec: DynamicFormField<unknown>,
    rowData: Record<string, unknown>
  ): boolean {
    if (spec.parameters.visible === false) {
      return false;
    }

    if (!spec.dependsOn) {
      return true;
    }
    return elementShouldDisplay(
      { dependsOn: spec.dependsOn } as DynamicFormField<unknown>,
      rowData,
      'display'
    );
  }

  private effectiveNoteVariant(
    spec: DynamicFormField<unknown>,
    row: Row
  ): NoteVariant {
    const fromRow = row[spec.name];
    if (
      fromRow !== undefined &&
      fromRow !== null &&
      typeof fromRow === 'object' &&
      'variant' in (fromRow as object)
    ) {
      return (fromRow as NoteFieldModel).variant ?? 'neutral';
    }
    return (spec.value as NoteFieldModel | undefined)?.variant ?? 'neutral';
  }

  private rowsForNoteBlockingScan(): Row[] {
    const stripped = this.normalizedModel().data.rows.map(r =>
      this.stripNoteFieldsFromRow({ ...r })
    );
    if (!this.isEditing()) {
      return stripped;
    }
    const draft = this.stripNoteFieldsFromRow({ ...this.editedRow() });
    const idx = stripped.findIndex(r => r.id === draft.id);
    if (idx >= 0) {
      stripped[idx] = draft;
      return stripped;
    }
    stripped.push(draft);
    return stripped;
  }

  private hasVisibleBlockingErrorNoteOnRow(row: Row): boolean {
    for (const spec of this.itemFields()) {
      if (
        (spec.fieldType as DynamicFormFieldTypes) !==
        DynamicFormFieldTypes.NOTE
      ) {
        continue;
      }
      if (this.effectiveNoteVariant(spec, row) !== 'error') {
        continue;
      }
      if (this.shouldShowInnerField(spec, row)) {
        return true;
      }
    }
    return false;
  }

  onInnerDataChange(updated: DynamicFormField<unknown>) {
    this.patchEditedRow(updated.name, updated.value);
  }

  isEditing(): boolean {
    if (this.pendingNewRowId()) {
      return true;
    }
    return this.allRows().some(r => r.id === this.editedRow().id);
  }

  isCurrentlyEditedRow(row: Row): boolean {
    return row.id === this.editedRow().id;
  }

  buildEmptyEditedRow(): Row {
    const row: Row = { id: getUUID4() };
    for (const spec of this.itemFields()) {
      row[spec.name] = this.defaultValueForSpec(spec);
    }
    return row;
  }

  defaultValueForSpec(spec: DynamicFormField<unknown>): unknown {
    const ft = spec.fieldType as DynamicFormFieldTypes;
    if (spec.value !== undefined && spec.value !== null) {
      return spec.value;
    }
    const fromType = getDefaultValueForFieldType(ft);
    if (fromType !== undefined) {
      return fromType;
    }
    switch (ft) {
      case DynamicFormFieldTypes.CHECKBOX:
        return false;
      case DynamicFormFieldTypes.NUMBER:
      case DynamicFormFieldTypes.MONEY:
      case DynamicFormFieldTypes.DATE:
      case DynamicFormFieldTypes.COMPUTED:
      case DynamicFormFieldTypes.NOTE:
        return undefined;
      default:
        return '';
    }
  }

  getDefaultRow(): Row {
    const row: Row = { id: getUUID4() };
    for (const spec of this.itemFields()) {
      row[spec.name] = this.defaultValueForSpec(spec);
    }
    return this.evaluateComputedInnerFields(row);
  }

  patchEditedRow(name: string, value: unknown) {
    if (this.editedRow()[name] === value) {
      return;
    }
    const next = { ...this.editedRow(), [name]: value };
    const evaluated = this.evaluateComputedInnerFields(next);
    this.editedRow.set(evaluated);
  }

  evaluateComputedInnerFields(row: Row): Row {
    const specs = this.itemFields();
    const computedSpecs = specs.filter(
      s =>
        (s.fieldType as DynamicFormFieldTypes) ===
          DynamicFormFieldTypes.COMPUTED && s.parameters.computedFormula
    );
    if (computedSpecs.length === 0) {
      return row;
    }

    const result = { ...row };
    const baseContext: Record<string, unknown> = { ...formulajs };

    for (const spec of computedSpecs) {
      const formula = spec.parameters.computedFormula ?? '';
      const rowKeys = specs
        .filter(s => s.id !== spec.id)
        .map(s => s.name)
        .filter(name => !FORMULAJS_KEYS.has(name));
      const varNames = [...Object.keys(baseContext), ...rowKeys];
      const varValues = [
        ...Object.values(baseContext),
        ...rowKeys.map(k => result[k]),
      ];

      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const evalFunc = new Function(...varNames, `return ${formula}`) as (
          ...args: unknown[]
        ) => unknown;
        result[spec.name] = evalFunc(...varValues);
      } catch {
        // leave value as-is on evaluation error
      }
    }
    return result;
  }

  formatComputedDisplay(v: unknown, spec: DynamicFormField<unknown>): string {
    const outputType = spec.parameters.computedOutputType ?? 'text';
    if (v === undefined || v === null) {
      return '';
    }
    if (outputType === 'money') {
      const n =
        typeof v === 'number' ? v : Number(stripNonNumberCharacters(`${v}`));
      return Number.isNaN(n) ? `${v}` : this.formatMoneyDisplay(n);
    }
    if (outputType === 'number') {
      const n =
        typeof v === 'number' ? v : Number(stripNonNumberCharacters(`${v}`));
      return Number.isNaN(n) ? `${v}` : `${n}`;
    }
    return `${v}`;
  }

  formatMoneyDisplay(n: number | undefined): string {
    if (n === undefined || n === null || Number.isNaN(n)) {
      return '';
    }
    return maskitoTransform(
      `${n}`,
      getMoneyMaskitoOptions(`${this.field().id}-money`)
    );
  }

  optionLabel(spec: DynamicFormField<unknown>, value: unknown): string {
    const opts = spec.parameters.options ?? [];
    const hit = opts.find(o => o.value === `${value}`);
    return (
      hit?.label ?? (value !== undefined && value !== null ? `${value}` : '')
    );
  }

  displayValue(row: Row, spec: DynamicFormField<unknown>): string {
    const v = row[spec.name];
    const ft = spec.fieldType as DynamicFormFieldTypes;
    if (v === undefined || v === null) {
      return '';
    }
    if (ft === DynamicFormFieldTypes.MONEY) {
      return this.formatMoneyDisplay(
        typeof v === 'number' ? v : Number(stripNonNumberCharacters(`${v}`))
      );
    }
    if (ft === DynamicFormFieldTypes.NUMBER) {
      return `${v}`;
    }
    if (ft === DynamicFormFieldTypes.DATE) {
      return (
        TimeUtil.convertSecondTimestampToLocaleDateString(
          typeof v === 'number' ? v : Number(v)
        ) ?? ''
      );
    }
    if (ft === DynamicFormFieldTypes.CHECKBOX) {
      return v ? 'Yes' : 'No';
    }
    if (
      ft === DynamicFormFieldTypes.SELECT ||
      ft === DynamicFormFieldTypes.RADIO
    ) {
      return this.optionLabel(spec, v);
    }
    if (ft === DynamicFormFieldTypes.COMPUTED) {
      return this.formatComputedDisplay(v, spec);
    }
    return `${v}`.trim();
  }

  validateSubField(
    row: Row,
    spec: DynamicFormField<unknown>
  ): string | undefined {
    const req = spec.required ?? false;
    const v = row[spec.name];
    const ft = spec.fieldType as DynamicFormFieldTypes;
    if (
      spec.parameters.visible === false ||
      !this.shouldShowInnerField(spec, row) ||
      ft === DynamicFormFieldTypes.CHECKBOX ||
      ft === DynamicFormFieldTypes.COMPUTED ||
      ft === DynamicFormFieldTypes.NOTE ||
      (!req && (v === undefined || v === null || v === ''))
    ) {
      return undefined;
    }

    if (req) {
      if (v === undefined || v === null) {
        return 'Required';
      }
      if (
        ft === DynamicFormFieldTypes.INPUT ||
        ft === DynamicFormFieldTypes.TEXT ||
        ft === DynamicFormFieldTypes.SELECT ||
        ft === DynamicFormFieldTypes.RADIO
      ) {
        if (`${v}`.trim() === '') {
          return 'Required';
        }
      }
      if (
        ft === DynamicFormFieldTypes.MONEY ||
        ft === DynamicFormFieldTypes.NUMBER
      ) {
        const n =
          typeof v === 'number' ? v : Number(stripNonNumberCharacters(`${v}`));
        if (n === undefined || Number.isNaN(n)) {
          return 'Required';
        }
      }
      if (ft === DynamicFormFieldTypes.DATE && !v) {
        return 'Required';
      }
    }

    if (
      ft === DynamicFormFieldTypes.NUMBER ||
      ft === DynamicFormFieldTypes.MONEY
    ) {
      const n =
        typeof v === 'number' ? v : Number(stripNonNumberCharacters(`${v}`));
      if (v !== undefined && v !== null && v !== '' && !Number.isNaN(n)) {
        const min = spec.parameters.minimumValue;
        const max = spec.parameters.maximumValue;
        if (min !== undefined && min !== null && n < min) {
          return `Must be at least ${min}`;
        }
        if (max !== undefined && max !== null && n > max) {
          return `Must be at most ${max}`;
        }
      }
    }

    return undefined;
  }

  isRowValid(row: Row): boolean {
    for (const spec of this.itemFields()) {
      if (this.validateSubField(row, spec)) {
        return false;
      }
    }
    return true;
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const rows = this.allRows();
    if (this.field().required && rows.length === 0) {
      return ValidationErrorKey.REQUIRED;
    }
    if (!rows.every(r => this.isRowValid(r))) {
      return ValidationErrorKey.MISSING_FIELDS;
    }
    return undefined;
  }

  override isValid(): boolean {
    this.touched.set(true);
    if (this.getErrorKey() !== undefined) {
      return false;
    }
    if (this.mode() === 'edit') {
      return true;
    }
    return !this.rowsForNoteBlockingScan().some(row =>
      this.hasVisibleBlockingErrorNoteOnRow(row)
    );
  }

  saveRow() {
    const field = this.field();
    const row = this.stripNoteFieldsFromRow({ ...this.editedRow() });

    let allValid = true;
    this.innerFieldComponents?.forEach(comp => {
      if (!comp.isValid()) {
        allValid = false;
      }
    });

    if (!allValid) {
      return;
    }

    const base = this.config();
    const list = [...this.allRows()];
    const idx = list.findIndex(r => r.id === row.id);
    if (idx >= 0) {
      list[idx] = row;
    } else {
      list.push(row);
    }

    const summary = this.buildSummaryRecord(list);
    field.value = {
      ...base,
      data: { rows: list, summary },
    };
    this.dataChange.emit(field);
    this.pendingNewRowId.set(null);
    this.editedRow.set(this.buildEmptyEditedRow());
  }

  cancelEdit() {
    this.pendingNewRowId.set(null);
    this.editedRow.set(this.buildEmptyEditedRow());
  }

  addNewRow() {
    const row = this.getDefaultRow();
    this.pendingNewRowId.set(row.id ?? null);
    this.editedRow.set(row);
  }

  removeRow(row: Row) {
    const field = this.field();
    const base = this.config();
    const list = this.allRows().filter(r => r.id !== row.id);
    const summary = this.buildSummaryRecord(list);
    field.value = {
      ...base,
      data: { rows: list, summary },
    };
    this.dataChange.emit(field);
  }

  startEdit(row: Row) {
    this.pendingNewRowId.set(null);
    this.editedRow.set(structuredClone(row));
  }
}
