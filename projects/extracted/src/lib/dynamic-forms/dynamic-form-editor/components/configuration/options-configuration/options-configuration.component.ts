import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import type {
  DynamicFormField,
  DynamicFormFieldOption,
} from '../../../../models/dynamic-forms.models';

@Component({
  selector: 'lj-options-configuration',
  templateUrl: './options-configuration.component.html',
  styleUrls: ['./options-configuration.component.scss'],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    LjInputFieldComponent,
    MatTooltipModule,
    ActivateDirective,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsConfigurationComponent {
  field = input.required<DynamicFormField<unknown>>();
  readonly handleFieldChange = output<DynamicFormField<unknown>>();

  drop(event: CdkDragDrop<unknown[]>) {
    const field = this.field();
    const options = [...(field.parameters.options || [])];

    moveItemInArray(options, event.previousIndex, event.currentIndex);

    this.updateFieldOptions(options);
  }

  addOption(): void {
    const currentField = this.field();
    if (!currentField) return;

    const newOption: DynamicFormFieldOption = {
      label: '',
      value: '',
      description: '',
    };

    const updatedOptions = [
      ...(currentField.parameters.options || []),
      newOption,
    ];

    this.updateFieldOptions(updatedOptions);
  }

  removeOption(index: number): void {
    const currentField = this.field();
    if (!currentField) return;

    const updatedOptions = (currentField.parameters.options ?? []).filter(
      (_, i) => i !== index
    );

    this.updateFieldOptions(updatedOptions);
  }

  updateOptionLabel(event: Event, index: number): void {
    const inputElement = event.target as HTMLInputElement;
    const label = inputElement.value.trim();

    const currentField = this.field();
    if (!currentField) return;

    const updatedOptions = [...(currentField.parameters.options ?? [])];
    const existing = updatedOptions[index];
    if (!existing) return;

    updatedOptions[index] = {
      label,
      value: label,
      description: existing.description ?? '',
    };

    this.updateFieldOptions(updatedOptions);
  }

  private updateFieldOptions(options: DynamicFormFieldOption[]): void {
    const currentField = this.field();
    if (!currentField) return;

    const updatedField = {
      ...currentField,
      parameters: {
        ...currentField.parameters,
        options,
      },
    };

    this.handleFieldChange.emit(updatedField);
  }
}
