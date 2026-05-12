import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import { getUUID4 } from '../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../web-components/button/button.component';
import type { FieldCustomAction } from '../abstract-field.component';
import {
  DynamicFormData,
  DynamicFormField,
  DynamicFormFieldTypes,
  DynamicFormSection,
  FormModes,
  FormOptions,
  FormTypes,
  SectionLayouts,
} from '../../../models/dynamic-forms.models';
import {
  CssRootNode,
  elementShouldDisplay,
  fetchFieldsByType,
  getCustomStyleString,
  isDynamicFormSection,
} from '../../../utilities/dynamicFormsUtil';
import { SubmitButtonComponent } from '../buttons/submit-button/submit-button.component';
import { SectionComponent } from '../section/section.component';
import { SummaryComponent } from '../summary/summary.component';
import { scheduleDfWaveIntro } from '../../utilities/dynamic-form-player-wave.util';

@Component({
  selector: 'lj-df-tabs',
  imports: [
    ActivateDirective,
    MatIconModule,
    SectionComponent,
    LjButtonComponent,
    SubmitButtonComponent,
    SummaryComponent,
  ],
  templateUrl: './dynamic-form-tabs.component.html',
  styleUrl: './dynamic-form-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormTabsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  mode = input<FormModes>('display');
  formData = input.required<DynamicFormData>();
  formType = input.required<FormTypes>();
  formDefinition = input<(DynamicFormField<unknown> | DynamicFormSection)[]>(
    []
  );
  formOptions = input.required<FormOptions>();
  isMobile = input(false);
  allowManualComputedValueEdit = input(false);
  customStyle = input<CssRootNode>({ parent: null, children: [] });
  prefillPendingChanges = input<Record<string, unknown>>({});
  fieldValidity = input<Record<string, string | undefined>>({});
  suppressedErrors = input<Record<string, string[]>>({});
  readonly prefillChangeAccepted = output<string>();
  readonly prefillChangeDeclined = output<string>();

  selectedTabIndex = signal(0);
  @ViewChildren(SectionComponent)
  sectionComponents!: QueryList<SectionComponent>;

  readonly change = output<DynamicFormField<unknown> | DynamicFormSection>();
  readonly customAction = output<FieldCustomAction>();
  readonly dataChange = output<
    DynamicFormField<unknown> | DynamicFormSection
  >();
  readonly submit = output<void>();

  SectionLayouts = SectionLayouts;

  private waveClear?: () => void;

  ngOnInit() {
    this.selectedTabIndex.set(0);
  }

  ngAfterViewInit(): void {
    this.runWaveIntro();
  }

  ngOnDestroy(): void {
    this.waveClear?.();
    this.waveClear = undefined;
  }

  private runWaveIntro(): void {
    this.waveClear?.();
    this.waveClear = undefined;

    if (this.mode() !== 'display') {
      this.host.nativeElement
        .querySelectorAll('.df-wave-item')
        .forEach((node: Element) => {
          (node as HTMLElement).classList.add('is-visible');
        });
      return;
    }

    this.waveClear = scheduleDfWaveIntro(this.host.nativeElement);
    this.changeDetectorRef.markForCheck();
  }


  isSection(step: DynamicFormSection | DynamicFormField<unknown>): boolean {
    return isDynamicFormSection(step);
  }

  getSection(step: unknown): DynamicFormSection {
    return step as DynamicFormSection;
  }

  isValid(): boolean {
    // check that all sections are valid
    const sections = this.formTabs().map(section => {
      this.handleSectionState({
        ...section,
        touched: true,
      } as DynamicFormSection);
      if ('valid' in section) {
        return section.valid;
      }

      return false;
    });

    return sections.every(isValid => isValid);
  }

  isSectionWarning(
    step: DynamicFormSection | DynamicFormField<unknown>
  ): boolean {
    if (this.isSection(step)) {
      // if a section
      if ('touched' in step) {
        // and the section has the touched field
        if (step.touched) {
          // and the touched field is true

          if ('valid' in step) {
            // and the section has the valid field
            if (!step.valid) {
              // and the valid field is false
              return true; // we need to show a warning ui
            }
          }
        }
      }
    }

    return false; // everything else we don't show the warning
  }

  isSectionValid(
    step: DynamicFormSection | DynamicFormField<unknown>
  ): boolean {
    if (this.isSection(step)) {
      // if a section
      if ('touched' in step) {
        // and the section has the touched field
        if (step.touched) {
          // and the touched field is true
          if ('valid' in step) {
            // and the section has the valid field
            if (step.valid) {
              // and the valid field is true
              return true; // we need to show a valid ui
            }
          }
        }
      }
    }

    return false; // everything else we don't show the valid
  }

  handleChange(itemToChange: DynamicFormField<unknown> | DynamicFormSection) {
    this.change.emit(itemToChange);
  }

  handleCustomAction(event: FieldCustomAction) {
    this.customAction.emit(event);
  }

  handleDataChange(
    itemToChange: DynamicFormField<unknown> | DynamicFormSection
  ) {
    const currentSection = this.formTabs()[this.selectedTabIndex()];

    if (currentSection) {
      const newSection = {
        ...currentSection,
        touched: true,
      } as DynamicFormSection;

      this.change.emit(newSection);
    }

    this.dataChange.emit(itemToChange);
  }

  handleSectionState(section: DynamicFormSection) {
    if (!section) {
      return;
    }

    if (section.touched) {
      const isCurrentSectionValid = this.sectionComponents
        .find(sectionComponent => sectionComponent.getId() === section.id)
        ?.isValid();

      const newSection = {
        ...section,
        valid: isCurrentSectionValid,
      } as DynamicFormSection;

      this.change.emit(newSection);
    }
  }

  handleSubmit() {
    this.submit.emit();
  }

  showElement(
    element: DynamicFormSection | DynamicFormField<unknown>,
    formData: DynamicFormData,
    mode: FormModes
  ): boolean {
    return elementShouldDisplay(element, formData, mode, this.fieldValidity());
  }

  getCustomStyle(selector: string, defaultStyle = ''): string {
    const customStyle = getCustomStyleString(selector, this.customStyle());

    if (customStyle.trim() !== '') {
      return customStyle;
    }

    return defaultStyle;
  }

  onTabSelected(index: number) {
    const currentSection = this.formTabs()[
      this.selectedTabIndex()
    ] as DynamicFormSection;
    this.handleSectionState(currentSection);
    this.selectedTabIndex.set(index);
  }

  onButtonClicked(newIndex: number) {
    const currentIdx = this.selectedTabIndex();
    const currentSection = this.formTabs()[currentIdx] as DynamicFormSection;

    if (newIndex > currentIdx && this.isSection(currentSection)) {
      if (
        currentSection.name !== 'Summary' &&
        this.showElement(
          currentSection,
          this.formData(),
          this.mode()
        )
      ) {
        const touchedSection = {
          ...currentSection,
          touched: true,
        } as DynamicFormSection;
        this.handleSectionState(touchedSection);
      } else {
        this.handleSectionState(currentSection);
      }
    } else {
      this.handleSectionState(currentSection);
    }

    this.changeDetectorRef.markForCheck();
    this.selectedTabIndex.set(newIndex);
  }

  getSubmitField() {
    const fields = fetchFieldsByType(
      this.formDefinition() as Array<DynamicFormSection>,
      DynamicFormFieldTypes.SUBMIT_BUTTON
    );

    if (fields.length > 0) {
      return fields[0] as DynamicFormField<void>;
    }

    const defaultSubmitButton = {
      id: getUUID4(),
      fieldType: DynamicFormFieldTypes.SUBMIT_BUTTON,
      name: 'submit-button',
      column: 0,
      label: 'Submit',
      required: false,
      parameters: {},
    };

    return defaultSubmitButton;
  }

  private readonly summaryTabId = getUUID4();

  formTabs = computed(() => {
    if (
      this.mode() === 'display' &&
      this.formOptions().displayReviewScreenOnSubmit
    ) {
      const reviewScreenStep = {
        id: this.summaryTabId,
        name: 'Summary',
        layout: SectionLayouts.ONE_COLUMN,
        fields: [],
        valid: true,
      } as DynamicFormSection;

      return [...this.formDefinition(), reviewScreenStep];
    }

    return this.formDefinition();
  });
}
