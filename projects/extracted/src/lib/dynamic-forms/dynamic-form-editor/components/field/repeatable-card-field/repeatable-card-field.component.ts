import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FieldDirective } from '../../../../../directives/field.directive';
import { formatEnumValue, getUUID4 } from '../../../../../utils/stringUtil';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LjSelectComponent } from '../../../../../web-components/form/select/select.component';
import { isRepeatableCardNumericSpec } from '../../../../dynamic-form/components/field/repeatable-card-field/utils';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  type DynamicFormFieldParameters,
} from '../../../../models/dynamic-forms.models';
import {
  EMPTY_REPEATABLE_CARD_FIELD,
  getDefaultValueForFieldType,
  normalizeRepeatableCardFieldModel,
  type NoteFieldModel,
  type RepeatableCardFieldModel,
  type RepeatableCardSummaryMode,
} from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
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
  REPEATABLE_CARD_EDITOR_SUMMARY_MODE_OPTIONS,
  computeNextInnerFieldName,
  defaultInnerFieldParameters,
  defaultRepeatableSummaryModeForItem,
  filterSummaryModeOptionsForInnerField,
  resolveRepeatableCardSummaryMode,
} from './repeatable-card-editor.util';

type InnerFieldOption = {
  value: DynamicFormFieldTypes;
  label: string;
  icon: string;
};

const INNER_FIELD_OPTIONS: InnerFieldOption[] = [
  {
    value: DynamicFormFieldTypes.INPUT,
    label: formatEnumValue(DynamicFormFieldTypes.INPUT),
    icon: 'short_text',
  },
  {
    value: DynamicFormFieldTypes.TEXT,
    label: formatEnumValue(DynamicFormFieldTypes.TEXT),
    icon: 'notes',
  },
  {
    value: DynamicFormFieldTypes.MONEY,
    label: formatEnumValue(DynamicFormFieldTypes.MONEY),
    icon: 'money',
  },
  {
    value: DynamicFormFieldTypes.NUMBER,
    label: formatEnumValue(DynamicFormFieldTypes.NUMBER),
    icon: 'numbers',
  },
  {
    value: DynamicFormFieldTypes.DATE,
    label: formatEnumValue(DynamicFormFieldTypes.DATE),
    icon: 'calendar_month',
  },
  {
    value: DynamicFormFieldTypes.SELECT,
    label: formatEnumValue(DynamicFormFieldTypes.SELECT),
    icon: 'list',
  },
  {
    value: DynamicFormFieldTypes.RADIO,
    label: formatEnumValue(DynamicFormFieldTypes.RADIO),
    icon: 'radio_button_checked',
  },
  {
    value: DynamicFormFieldTypes.CHECKBOX,
    label: formatEnumValue(DynamicFormFieldTypes.CHECKBOX),
    icon: 'checkbox',
  },
  {
    value: DynamicFormFieldTypes.NOTE,
    label: formatEnumValue(DynamicFormFieldTypes.NOTE),
    icon: 'info',
  },
  {
    value: DynamicFormFieldTypes.COMPUTED,
    label: formatEnumValue(DynamicFormFieldTypes.COMPUTED),
    icon: 'functions',
  },
];

const EMPTY_VALUE: RepeatableCardFieldModel = EMPTY_REPEATABLE_CARD_FIELD;

@Component({
  selector: 'lj-df-repeatable-card-editor',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatSelectModule,
    MatSlideToggleModule,
    LjInputFieldComponent,
    LjSelectComponent,
    EditableInputComponent,
    FieldConfigurationComponent,
    ConditionalLogicComponent,
    InputFieldComponent,
    TextFieldComponent,
    MoneyFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    SelectFieldComponent,
    RadioFieldComponent,
    CheckboxFieldComponent,
    ComputedFieldComponent,
    CdkDropList,
    CdkDropListGroup,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    NoteFieldComponent,
  ],
  templateUrl: './repeatable-card-field.component.html',
  styleUrl: './repeatable-card-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: FieldDirective,
      useExisting: RepeatableCardFieldEditorComponent,
    },
  ],
})
export class RepeatableCardFieldEditorComponent extends AbstractFieldComponent<RepeatableCardFieldModel> {
  FieldType = DynamicFormFieldTypes;

  innerFieldOptions = INNER_FIELD_OPTIONS;

  summaryModeOptionsForItem(
    item: DynamicFormField<unknown>
  ): { value: RepeatableCardSummaryMode; label: string }[] {
    const isNum = isRepeatableCardNumericSpec(item);
    return filterSummaryModeOptionsForInnerField(
      REPEATABLE_CARD_EDITOR_SUMMARY_MODE_OPTIONS,
      isNum
    );
  }

  private fieldValue(): RepeatableCardFieldModel {
    return normalizeRepeatableCardFieldModel(this.field().value ?? EMPTY_VALUE);
  }

  repeatableCardLabel(): string {
    return this.fieldValue().label ?? '';
  }

  repeatableCardShowSummary(): boolean {
    return this.fieldValue().showSummary;
  }

  repeatableCardTitleFieldId(): string {
    return this.fieldValue().titleField;
  }

  itemFields(): DynamicFormField<unknown>[] {
    return this.fieldValue().itemFields;
  }

  formatTypeLabel(ft: string): string {
    return formatEnumValue(ft);
  }

  innerExistingFields(): { id: string; value: string }[] {
    return this.itemFields().map(i => ({ id: i.name, value: i.name }));
  }

  defaultInnerParameters(
    ft: DynamicFormFieldTypes
  ): DynamicFormFieldParameters {
    return defaultInnerFieldParameters(ft);
  }

  nextInnerName(): string {
    return computeNextInnerFieldName(this.itemFields());
  }

  emitItemFields(items: DynamicFormField<unknown>[]) {
    const f = this.field();
    f.value = { ...this.fieldValue(), itemFields: items };
    this.fieldChange.emit(f);
  }

  addInnerField(ft: DynamicFormFieldTypes, atIndex?: number) {
    const items = [...this.itemFields()];
    const newField: DynamicFormField<unknown> = {
      id: getUUID4(),
      name: this.nextInnerName(),
      label: 'New field',
      column: 0,
      fieldType: ft,
      required: false,
      parameters: this.defaultInnerParameters(ft),
      value: getDefaultValueForFieldType(ft) as unknown,
    };
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= items.length) {
      items.splice(atIndex, 0, newField);
    } else {
      items.push(newField);
    }
    this.emitItemFields(items);
  }

  removeInnerField(id: string) {
    const items = this.itemFields().filter(i => i.id !== id);
    const fv = this.fieldValue();
    const next: RepeatableCardFieldModel = {
      ...fv,
      itemFields: items,
      titleField: fv.titleField === id ? '' : fv.titleField,
    };
    if (fv.summaryFieldIds !== undefined) {
      next.summaryFieldIds = fv.summaryFieldIds.filter(sid => sid !== id);
    }
    if (fv.summaryFieldModes) {
      const rest = { ...fv.summaryFieldModes };
      delete rest[id];
      next.summaryFieldModes = Object.keys(rest).length > 0 ? rest : undefined;
    }
    const f = this.field();
    f.value = next;
    this.fieldChange.emit(f);
  }

  drop(event: CdkDragDrop<DynamicFormField<unknown>[]>) {
    if (event.previousContainer === event.container) {
      const items = [...this.itemFields()];
      moveItemInArray(items, event.previousIndex, event.currentIndex);
      this.emitItemFields(items);
    } else {
      const option = event.item.data as InnerFieldOption;
      this.addInnerField(option.value, event.currentIndex);
    }
  }

  syntheticInnerField(
    item: DynamicFormField<unknown>
  ): DynamicFormField<unknown> {
    return {
      id: item.id,
      name: item.name,
      label: item.label,
      column: item.column,
      fieldType: item.fieldType,
      required: item.required ?? false,
      parameters: item.parameters,
      dependsOn: item.dependsOn,
      value: undefined,
    };
  }

  innerFieldAsString(
    item: DynamicFormField<unknown>
  ): DynamicFormField<string> {
    return this.syntheticInnerField(item) as DynamicFormField<string>;
  }

  innerFieldAsNumber(
    item: DynamicFormField<unknown>
  ): DynamicFormField<number> {
    return this.syntheticInnerField(item) as DynamicFormField<number>;
  }

  innerFieldAsVoid(item: DynamicFormField<unknown>): DynamicFormField<void> {
    return this.syntheticInnerField(item) as DynamicFormField<void>;
  }

  innerFieldAsNote(
    item: DynamicFormField<unknown>
  ): DynamicFormField<NoteFieldModel> {
    const base = this.syntheticInnerField(item);
    const noteValue =
      (item.value as NoteFieldModel | undefined) ??
      (getDefaultValueForFieldType(
        DynamicFormFieldTypes.NOTE
      ) as NoteFieldModel);
    return { ...base, value: noteValue } as DynamicFormField<NoteFieldModel>;
  }

  innerFieldAsBoolean(
    item: DynamicFormField<unknown>
  ): DynamicFormField<boolean> {
    return this.syntheticInnerField(item) as DynamicFormField<boolean>;
  }

  innerFieldAsComputed(
    item: DynamicFormField<unknown>
  ): DynamicFormField<string> {
    return this.syntheticInnerField(item) as DynamicFormField<string>;
  }

  onInnerFieldChange(
    item: DynamicFormField<unknown>,
    updated: DynamicFormField<unknown>
  ) {
    const items = this.itemFields().map(i => {
      if (i.id !== item.id) {
        return i;
      }
      return {
        ...i,
        label: updated.label,
        name: updated.name,
        required: updated.required ?? false,
        dependsOn: updated.dependsOn,
        value: updated.value !== undefined ? updated.value : i.value,
        parameters: {
          ...i.parameters,
          ...updated.parameters,
        },
      };
    });
    this.emitItemFields(items);
  }

  onInnerInfoLabelChange(
    item: DynamicFormField<unknown>,
    label: string | number
  ) {
    const items = this.itemFields().map(i =>
      i.id === item.id ? { ...i, label: `${label}` } : i
    );
    this.emitItemFields(items);
  }

  updateInnerInfoText(item: DynamicFormField<unknown>, infoText: string) {
    const items = this.itemFields().map(i =>
      i.id === item.id
        ? { ...i, parameters: { ...i.parameters, placeholder: infoText } }
        : i
    );
    this.emitItemFields(items);
  }

  handleAddButtonLabelChange(value: string) {
    const f = this.field();
    f.value = { ...this.fieldValue(), label: value };
    this.fieldChange.emit(f);
  }

  handleShowSummaryChange(checked: boolean) {
    const f = this.field();
    f.value = { ...this.fieldValue(), showSummary: checked };
    this.fieldChange.emit(f);
  }

  isSummaryFieldChecked(itemId: string): boolean {
    const ids = this.fieldValue().summaryFieldIds;
    if (ids === undefined) {
      return false;
    }
    return ids.includes(itemId);
  }

  getSummaryModeForField(itemId: string): RepeatableCardSummaryMode {
    const item = this.itemFields().find(i => i.id === itemId);
    return resolveRepeatableCardSummaryMode(
      itemId,
      item,
      this.fieldValue().summaryFieldModes,
      isRepeatableCardNumericSpec
    );
  }

  handleSummaryModeChange(itemId: string, mode: RepeatableCardSummaryMode) {
    const fv = this.fieldValue();
    const nextModes = { ...(fv.summaryFieldModes ?? {}) };
    nextModes[itemId] = mode;
    const f = this.field();
    f.value = { ...fv, summaryFieldModes: nextModes };
    this.fieldChange.emit(f);
  }

  handleSummaryFieldCheckChange(itemId: string, checked: boolean) {
    const fv = this.fieldValue();
    const nextModes = { ...(fv.summaryFieldModes ?? {}) };
    let nextIds: string[];

    if (fv.summaryFieldIds === undefined) {
      nextIds = checked ? [itemId] : [];
    } else {
      nextIds = [...fv.summaryFieldIds];
      if (checked) {
        if (!nextIds.includes(itemId)) {
          nextIds.push(itemId);
        }
      } else {
        nextIds = nextIds.filter(i => i !== itemId);
      }
    }

    if (checked) {
      if (nextModes[itemId] === undefined) {
        const item = this.itemFields().find(i => i.id === itemId);
        nextModes[itemId] = defaultRepeatableSummaryModeForItem(
          item,
          isRepeatableCardNumericSpec
        );
      }
    } else {
      delete nextModes[itemId];
    }
    const f = this.field();
    f.value = {
      ...fv,
      summaryFieldIds: nextIds,
      summaryFieldModes:
        Object.keys(nextModes).length > 0 ? nextModes : undefined,
    };
    this.fieldChange.emit(f);
  }

  handleTitleFieldChange(fieldId: string) {
    let next = fieldId || '';
    if (next) {
      const inner = this.itemFields().find(i => i.id === next);
      if (inner?.fieldType === DynamicFormFieldTypes.NOTE) {
        next = '';
      }
    }
    const f = this.field();
    f.value = { ...this.fieldValue(), titleField: next };
    this.fieldChange.emit(f);
  }
}
