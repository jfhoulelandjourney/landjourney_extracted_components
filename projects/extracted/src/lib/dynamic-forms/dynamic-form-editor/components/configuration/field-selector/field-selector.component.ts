import { CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
} from 'rxjs/operators';

import { OrganizationService } from '../../../../../services/organization/organization.service';
import {
  FieldTypes,
  type Field,
} from '../../../../../services/products/fields/fields.models';
import { FieldsService } from '../../../../../services/products/fields/fields.service';
import { formatEnumValue } from '../../../../../utils/stringUtil';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { DynamicFormFieldTypes } from '../../../../models/dynamic-forms.models';

type FieldOption = {
  value: DynamicFormFieldTypes;
  label: string;
  icon: string;
  field?: Field;
};

const availableFields: FieldOption[] = [
  {
    value: DynamicFormFieldTypes.INPUT,
    label: formatEnumValue(DynamicFormFieldTypes.INPUT),
    icon: 'short_text',
  },
  {
    value: DynamicFormFieldTypes.CHECKBOX,
    label: formatEnumValue(DynamicFormFieldTypes.CHECKBOX),
    icon: 'checkbox',
  },
  {
    value: DynamicFormFieldTypes.NUMBER,
    label: formatEnumValue(DynamicFormFieldTypes.NUMBER),
    icon: 'numbers',
  },
  {
    value: DynamicFormFieldTypes.MONEY,
    label: formatEnumValue(DynamicFormFieldTypes.MONEY),
    icon: 'money',
  },
  {
    value: DynamicFormFieldTypes.SELECT,
    label: formatEnumValue(DynamicFormFieldTypes.SELECT),
    icon: 'list',
  },
  {
    value: DynamicFormFieldTypes.DATE,
    label: formatEnumValue(DynamicFormFieldTypes.DATE),
    icon: 'calendar_month',
  },
  {
    value: DynamicFormFieldTypes.RADIO,
    label: formatEnumValue(DynamicFormFieldTypes.RADIO),
    icon: 'radio_button_checked',
  },
  {
    value: DynamicFormFieldTypes.TEXT,
    label: formatEnumValue(DynamicFormFieldTypes.TEXT),
    icon: 'notes',
  },
  {
    value: DynamicFormFieldTypes.NOTE,
    label: formatEnumValue(DynamicFormFieldTypes.NOTE),
    icon: 'info',
  },
  {
    value: DynamicFormFieldTypes.FILE_UPLOAD,
    label: formatEnumValue(DynamicFormFieldTypes.FILE_UPLOAD),
    icon: 'upload_file',
  },
  {
    value: DynamicFormFieldTypes.BORROWERS,
    label: formatEnumValue(DynamicFormFieldTypes.BORROWERS),
    icon: 'groups',
  },
  {
    value: DynamicFormFieldTypes.LOAN_INFORMATION,
    label: formatEnumValue(DynamicFormFieldTypes.LOAN_INFORMATION),
    icon: 'quiz',
  },
  {
    value: DynamicFormFieldTypes.LOAN_SOURCES,
    label: formatEnumValue(DynamicFormFieldTypes.LOAN_SOURCES),
    icon: 'source',
  },
  {
    value: DynamicFormFieldTypes.LOAN_PURPOSE,
    label: formatEnumValue(DynamicFormFieldTypes.LOAN_PURPOSE),
    icon: 'grading',
  },
  {
    value: DynamicFormFieldTypes.DISCLAIMER,
    label: formatEnumValue(DynamicFormFieldTypes.DISCLAIMER),
    icon: 'label_important',
  },
  {
    value: DynamicFormFieldTypes.QUESTIONNAIRE,
    label: 'Yes / No Questionnaire',
    icon: 'question_answer',
  },
  {
    value: DynamicFormFieldTypes.CROP_DETAILS,
    label: formatEnumValue(DynamicFormFieldTypes.CROP_DETAILS),
    icon: 'area_chart',
  },
  {
    value: DynamicFormFieldTypes.USE_OF_FUNDS,
    label: formatEnumValue(DynamicFormFieldTypes.USE_OF_FUNDS),
    icon: 'credit_card',
  },
  {
    value: DynamicFormFieldTypes.LIVESTOCK,
    label: formatEnumValue(DynamicFormFieldTypes.LIVESTOCK),
    icon: 'pets',
  },
  {
    value: DynamicFormFieldTypes.SUBMIT_BUTTON,
    label: formatEnumValue(DynamicFormFieldTypes.SUBMIT_BUTTON),
    icon: 'send',
  },
];

@Component({
  selector: 'lj-field-selector',
  imports: [
    MatIconModule,
    FormsModule,
    CdkDrag,
    CdkDragPlaceholder,
    LjInputFieldComponent,
  ],
  templateUrl: './field-selector.component.html',
  styleUrls: ['./field-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldSelectorComponent implements OnDestroy {
  private readonly fieldsService = inject(FieldsService);
  private readonly organizationService = inject(OrganizationService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  availableFields = computed(() => {
    const fields = [...availableFields];

    // This won't work on first load but I think this is okay for the demo
    // Only add ON_SCREEN_APPROVAL field if DEMO_MODE is enabled
    if (this.organizationService.isFeatureFlagActivated('DEMO_MODE')) {
      fields.push({
        value: DynamicFormFieldTypes.ON_SCREEN_APPROVAL,
        label: formatEnumValue(DynamicFormFieldTypes.ON_SCREEN_APPROVAL),
        icon: 'approval',
      });
    }

    if (this.organizationService.isFeatureFlagActivated('COMPUTED_FIELDS_DF')) {
      fields.push({
        value: DynamicFormFieldTypes.COMPUTED,
        label: formatEnumValue(DynamicFormFieldTypes.COMPUTED),
        icon: 'functions',
      });
    }

    if (this.organizationService.isFeatureFlagActivated('DF_REPEATABLE_CARD')) {
      const borrowersIdx = fields.findIndex(
        f => f.value === DynamicFormFieldTypes.BORROWERS
      );
      const repeatable: FieldOption = {
        value: DynamicFormFieldTypes.REPEATABLE_CARD,
        label: 'Repeatable card',
        icon: 'view_week',
      };
      if (borrowersIdx >= 0) {
        fields.splice(borrowersIdx, 0, repeatable);
      } else {
        fields.push(repeatable);
      }
    }

    return fields;
  });
  filteredFields = signal<FieldOption[]>(this.availableFields());
  searchTerm = signal('');

  constructor() {
    this.filteredFields.set(this.availableFields());
    this.search$
      .pipe(
        map(v => (v ?? '').trim()),
        distinctUntilChanged(),
        debounceTime(300),
        switchMap(term => {
          if (term === '') {
            return of({ items: [] as Field[] });
          }
          return this.fieldsService
            .getFields({ search: term })
            .pipe(catchError(() => of({ items: [] as Field[] })));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        const term = this.searchTerm();
        if (term === '') {
          this.filteredFields.set(this.availableFields());
          return;
        }
        const customFields = (result.items || [])
          .filter(field => {
            if (field.fieldType === FieldTypes.COMPUTED) {
              return this.organizationService.isFeatureFlagActivated(
                'COMPUTED_FIELDS_DF'
              );
            }
            return true;
          })
          .map(field => ({
            value: DynamicFormFieldTypes.CUSTOM_FIELD,
            label: field.label,
            field,
            icon: 'build_circle',
          }));
        this.filteredFields.set([
          ...customFields,
          ...this.availableFields().filter(f =>
            f.label.toLowerCase().includes(term.toLowerCase())
          ),
        ]);
      });
  }

  onSearchChange(value: string | null): void {
    const v = value ?? '';
    this.searchTerm.set(v);
    this.search$.next(v);
    if (v === '') {
      this.filteredFields.set(this.availableFields());
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
