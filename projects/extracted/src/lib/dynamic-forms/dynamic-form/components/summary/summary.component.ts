import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import {
  DynamicFormData,
  DynamicFormField,
  DynamicFormSection,
  FormModes,
  FormTypes,
  SectionLayouts,
} from '../../../models/dynamic-forms.models';
import {
  elementShouldDisplay,
  isDynamicFormSection,
} from '../../../utilities/dynamicFormsUtil';
import { FieldComponent } from '../field/field.component';

@Component({
  selector: 'lj-df-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  imports: [
    NgTemplateOutlet,
    MatIconModule,
    FormsModule,
    FieldComponent,
    ActivateDirective,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  FormTypes = FormTypes;
  SectionLayouts = SectionLayouts;

  isMobile = input(false);
  showEditButton = input(true);
  formDefinition = input<(DynamicFormField<unknown> | DynamicFormSection)[]>(
    []
  );
  formData = input.required<DynamicFormData>();
  fieldValidity = input<Record<string, string | undefined>>({});
  readonly goBackTo = output<number>();

  backToForm(index: number) {
    this.goBackTo.emit(index);
  }

  showElement(
    element: DynamicFormSection | DynamicFormField<unknown>,
    formData: DynamicFormData,
    mode: FormModes
  ): boolean {
    return elementShouldDisplay(element, formData, mode, this.fieldValidity());
  }

  isSection(step: DynamicFormSection | DynamicFormField<unknown>): boolean {
    return isDynamicFormSection(step);
  }

  getSectionFields(
    section: DynamicFormSection
  ): (DynamicFormField<unknown> | DynamicFormSection)[] {
    return section.fields;
  }

  getSection(
    element: DynamicFormSection | DynamicFormField<unknown>
  ): DynamicFormSection {
    return element as DynamicFormSection;
  }

  getField(
    element: DynamicFormSection | DynamicFormField<unknown>
  ): DynamicFormField<unknown> {
    return element as DynamicFormField<unknown>;
  }

  noop(_?: unknown) {
    return false;
  }
}
