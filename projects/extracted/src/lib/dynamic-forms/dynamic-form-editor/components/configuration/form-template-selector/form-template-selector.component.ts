import {
  CdkDrag,
  CdkDragPlaceholder,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
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

import { DynamicFormService } from '../../../../../services/documents/dynamic-form.service';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import type {
  DynamicFormField,
  DynamicFormSection,
} from '../../../../models/dynamic-forms.models';

export type FormTemplateOption = {
  id: string;
  name: string;
  formDefinition: Array<DynamicFormField<unknown> | DynamicFormSection>;
};

@Component({
  selector: 'lj-form-template-selector',
  imports: [
    MatIconModule,
    FormsModule,
    CdkDrag,
    CdkDragPlaceholder,
    LjInputFieldComponent,
  ],
  templateUrl: './form-template-selector.component.html',
  styleUrls: ['./form-template-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormTemplateSelectorComponent implements OnDestroy {
  private readonly dynamicFormService = inject(DynamicFormService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  allTemplates = signal<FormTemplateOption[]>([]);
  filteredTemplates = signal<FormTemplateOption[]>([]);
  searchTerm = signal('');
  loading = signal(false);
  loaded = signal(false);

  constructor() {
    this.search$
      .pipe(
        map(v => (v ?? '').trim()),
        distinctUntilChanged(),
        debounceTime(300),
        switchMap(term => {
          if (term === '') {
            this.filteredTemplates.set([]);
            return of(null);
          }

          if (!this.loaded()) {
            this.loading.set(true);
            return this.dynamicFormService.getAllDynamicFormTemplates().pipe(
              map(templates => {
                const options: FormTemplateOption[] = templates.map(t => ({
                  id: t.id ?? '',
                  name: t.name,
                  formDefinition: t.formDefinition,
                }));
                this.allTemplates.set(options);
                this.loaded.set(true);
                this.loading.set(false);
                return term;
              }),
              catchError(() => {
                this.loading.set(false);
                return of(null);
              })
            );
          }

          return of(term);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        if (term === null || term === '') {
          return;
        }
        const lowerTerm = term.toLowerCase();
        this.filteredTemplates.set(
          this.allTemplates().filter(t =>
            t.name.toLowerCase().includes(lowerTerm)
          )
        );
      });
  }

  onSearchChange(value: string | null): void {
    const v = value ?? '';
    this.searchTerm.set(v);
    this.search$.next(v);
    if (v === '') {
      this.filteredTemplates.set([]);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
