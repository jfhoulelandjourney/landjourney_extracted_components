import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FieldDirective } from '../../../../../directives/field.directive';
import { ComparisonOperators } from '../../../../models/dynamic-forms.models';
import type { NoteFieldModel } from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';

@Component({
  selector: 'lj-df-note-field',
  templateUrl: './note-field.component.html',
  styleUrl: './note-field.component.scss',
  imports: [
    EditableInputComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: NoteFieldComponent }],
})
export class NoteFieldComponent extends AbstractFieldComponent<NoteFieldModel> {
  private noteValue = computed(() => this.field().value);

  noteVariant = computed(() => this.noteValue()?.variant ?? 'neutral');

  noteBody = computed(
    () => this.noteValue()?.note ?? this.field().label
  );

  showSubmitBlockingHint = computed(() => {
    if (this.noteVariant() !== 'error') {
      return false;
    }
    if (this.showConditionalLogic()) {
      return true;
    }
    const dep = this.field().dependsOn;
    if (!dep) {
      return false;
    }
    return dep.operation !== ComparisonOperators.NONE;
  });

  onNoteBodyChange(value: string | number) {
    const f = this.field();
    const body = `${value}`;
    const current = f.value ?? {
      variant: 'neutral',
      note: '',
    };
    this.fieldChange.emit({
      ...f,
      label: body,
      value: { ...current, note: body },
    });
  }
}
