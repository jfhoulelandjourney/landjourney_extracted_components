import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FieldDirective } from '../../../../../directives/field.directive';
import type { NoteFieldModel } from '../../../../models/fields.models';
import { elementShouldDisplay } from '../../../../utilities/dynamicFormsUtil';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-note-field',
  templateUrl: './note-field.component.html',
  styleUrl: './note-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: FieldDirective, useExisting: NoteFieldComponent }],
})
export class NoteFieldComponent extends AbstractFieldComponent<NoteFieldModel> {
  fieldValidity = input<Record<string, string | undefined>>({});

  private noteValue = computed(() => this.field().value);

  noteVariant = computed(() => this.noteValue()?.variant ?? 'neutral');

  noteBody = computed(
    () => this.noteValue()?.note?.trim() || this.field().label
  );

  override isValid(): boolean {
    this.touched.set(true);
    if (this.mode() === 'edit') {
      return true;
    }
    if (this.noteVariant() !== 'error') {
      return true;
    }
    const visible = elementShouldDisplay(
      this.field(),
      this.formData(),
      this.mode(),
      this.fieldValidity()
    );
    return !visible;
  }
}
