import {
  CdkDrag,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ActivateDirective } from '../../directives/activate/activate.directive';
import { OrganizationService } from '../../services/organization/organization.service';
import { getUUID4 } from '../../utils/stringUtil';
import { LjInputFieldComponent } from '../../web-components/form/input-field/input-field.component';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import {
  Directions,
  DynamicForm,
  DynamicFormField,
  DynamicFormSection,
  FormModes,
  FormOptions,
  FormTypes,
  SectionLayouts,
} from '../models/dynamic-forms.models';
import { removeItemFromFormDefinitionTree } from '../utilities/form-definition-dnd.util';
import { cloneFormDefinitionItems } from '../utilities/form-import.util';
import {
  fetchSectionsRecursively,
  getFields,
  isDynamicFormSection,
  removeAllValues,
} from '../utilities/dynamicFormsUtil';
import { FieldSelectorComponent } from './components/configuration/field-selector/field-selector.component';
import { FormTemplateSelectorComponent } from './components/configuration/form-template-selector/form-template-selector.component';
import { FormTypeSelectorComponent } from './components/configuration/form-type-selector/form-type-selector.component';
import { SectionComponent } from './components/section/section.component';
import { FormDefinitionJsonEditorDialogComponent } from './form-definition-json-editor-dialog/form-definition-json-editor-dialog.component';

@Component({
  selector: 'lj-dynamic-form-editor',
  templateUrl: './dynamic-form-editor.component.html',
  styleUrls: ['./dynamic-form-editor.component.scss'],
  imports: [
    FormsModule,
    SectionComponent,
    LjInputFieldComponent,
    MatIconModule,
    MatTooltipModule,
    ActivateDirective,
    FormTypeSelectorComponent,
    MatButtonModule,
    DynamicFormComponent,
    MatCheckboxModule,
    FieldSelectorComponent,
    FormTemplateSelectorComponent,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormEditorComponent {
  readonly organizationService = inject(OrganizationService);
  private readonly dialog = inject(MatDialog);

  form = input.required<DynamicForm>();
  mode = signal<FormModes>('edit');

  readonly formChange = output<DynamicForm>();

  formTypes = FormTypes;
  formTypesOptions = [
    {
      label: FormTypes.INLINE,
      value: FormTypes.INLINE,
      description: 'Form without tabs or steps to isolate the sections',
    },
    {
      label: FormTypes.STEPS,
      value: FormTypes.STEPS,
      description: 'Form with each section displayed as a different step',
    },
    {
      label: FormTypes.TABS,
      value: FormTypes.TABS,
      description: 'Form with each section displayed as tabs',
    },
  ];

  SectionLayouts = SectionLayouts;

  dropZoneIds = computed(() => {
    const dropZones: string[] = [];
    const sections = fetchSectionsRecursively(this.form().formDefinition);

    sections.forEach(section => {
      if (this.isSection(section)) {
        const columns = this.getColumnsForSection(
          section as DynamicFormSection
        );
        columns.forEach(column => {
          dropZones.push(`section-${section.id}-column-${column}`);
        });
      }
    });

    return dropZones.reverse();
  });

  dropZoneIdsWithForm = computed(() => {
    const dropZones: string[] = ['form-drop-zone'];
    const sections = fetchSectionsRecursively(this.form().formDefinition);
    sections.forEach(section => {
      if (this.isSection(section)) {
        const columns = this.getColumnsForSection(
          section as DynamicFormSection
        );
        columns.forEach(column => {
          dropZones.push(`section-${section.id}-column-${column}`);
        });
      }
    });

    return dropZones.reverse();
  });

  getColumnsForSection(section: DynamicFormSection): number[] {
    switch (section.layout) {
      case SectionLayouts.ONE_COLUMN:
        return [0];
      case SectionLayouts.TWO_COLUMNS:
        return [0, 1];
      case SectionLayouts.THREE_COLUMNS:
        return [0, 1, 2];
      default:
        return [0];
    }
  }

  getFormType(): FormTypes {
    return this.form().formType || FormTypes.INLINE;
  }

  handleFormNameChange(name: string) {
    const form = this.form();
    form.name = name;
    this.formChange.emit(form);
  }

  handleFormTypeChange({
    formType,
    formOptions,
  }: {
    formType: FormTypes;
    formOptions: FormOptions;
  }) {
    const form = this.form();
    form.formType = formType;
    form.formOptions = formOptions;
    this.formChange.emit(form);
  }

  handleFormDisplayChange() {
    const form = this.form();
    form.formOptions.displayReviewScreenOnSubmit =
      !form.formOptions.displayReviewScreenOnSubmit;
    this.formChange.emit(form);
  }

  handleNewSection(index: number) {
    const form = this.form();
    const newSection = {
      id: getUUID4(),
      name: 'New section',
      description: 'section description',
      direction: Directions.COLUMN,
      layout: SectionLayouts.ONE_COLUMN,
      fields: [],
    };

    form.formDefinition.splice(index, 0, newSection);
    this.formChange.emit(form);
  }

  handleRemove(itemToRemove: DynamicFormField<unknown> | DynamicFormSection) {
    const form = this.form();
    form.formDefinition = form.formDefinition.filter(
      item => item !== itemToRemove
    );
    this.formChange.emit(form);
  }

  handleChange(itemToChange: DynamicFormField<unknown> | DynamicFormSection) {
    const form = this.form();
    const item = form.formDefinition.find(fd => fd.id === itemToChange.id);

    if (!item) {
      return;
    }

    Object.assign(item, itemToChange);
    form.data = getFields(form);
    this.formChange.emit(form);
  }

  toggleMode() {
    if (this.mode() === 'display') {
      const form = removeAllValues(this.form());
      this.formChange.emit(form);
      this.mode.set('edit');
    } else {
      this.mode.set('display');
    }
  }

  openFormDefinitionJsonEditor(): void {
    this.dialog
      .open(FormDefinitionJsonEditorDialogComponent, {
        width: 'min(920px, 96vw)',
        maxHeight: '92vh',
        autoFocus: false,
        data: {
          initialJson: JSON.stringify(this.form().formDefinition, null, 2),
        },
      })
      .afterClosed()
      .subscribe(result => {
        if (result === undefined || result === null) {
          return;
        }
        const form = this.form();
        form.formDefinition = result;
        form.data = getFields(form);
        this.formChange.emit(form);
      });
  }

  getSection(element: unknown): DynamicFormSection {
    return element as DynamicFormSection;
  }

  getField(element: unknown): DynamicFormField<unknown> {
    return element as DynamicFormField<unknown>;
  }

  isSection(element: DynamicFormField<unknown> | DynamicFormSection): boolean {
    return isDynamicFormSection(element);
  }

  handleImportFormTemplate(
    formDefinition: Array<DynamicFormField<unknown> | DynamicFormSection>,
    index: number
  ) {
    const form = this.form();
    const clonedSections = cloneFormDefinitionItems(formDefinition);
    form.formDefinition.splice(index, 0, ...clonedSections);
    this.formChange.emit(form);
  }

  handleFormStructureChange() {
    const form = this.form();
    form.data = getFields(form);
    this.formChange.emit(form);
  }

  private handleDropFromSectionColumnOntoFormRoot(
    event: CdkDragDrop<DynamicForm['formDefinition']>
  ) {
    const form = this.form();
    const roots = form.formDefinition;
    const prevData = event.previousContainer.data as unknown as {
      fields: (DynamicFormField<unknown> | DynamicFormSection)[];
      column: number;
    };
    const movedItem = prevData.fields[event.previousIndex];
    if (!movedItem || !isDynamicFormSection(movedItem)) {
      return;
    }
    removeItemFromFormDefinitionTree(roots, movedItem);
    delete (movedItem as DynamicFormSection).column;
    roots.splice(event.currentIndex, 0, movedItem);
    form.data = getFields(form);
    this.formChange.emit(form);
  }

  drop(event: CdkDragDrop<DynamicForm['formDefinition']>) {
    if (event.previousContainer.id === 'section-selector') {
      this.handleNewSection(event.currentIndex);
      return;
    }
    if (event.previousContainer.id === 'form-template-selector') {
      const data = event.item.data;
      if (data?.type === 'form-template' && data.formDefinition) {
        this.handleImportFormTemplate(data.formDefinition, event.currentIndex);
      }
      return;
    }
    if (event.container.id === 'form-drop-zone') {
      if (event.previousContainer.id === 'form-drop-zone') {
        const form = this.form();
        moveItemInArray(
          form.formDefinition,
          event.previousIndex,
          event.currentIndex
        );
        this.formChange.emit(form);
      } else {
        this.handleDropFromSectionColumnOntoFormRoot(event);
      }
      return;
    }
  }
}
