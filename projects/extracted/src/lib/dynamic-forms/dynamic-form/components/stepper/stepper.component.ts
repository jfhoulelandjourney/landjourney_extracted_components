import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
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
  output,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { getUUID4 } from '../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../web-components/button/button.component';
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
import { FieldCustomAction } from '../abstract-field.component';
import { SubmitButtonComponent } from '../buttons/submit-button/submit-button.component';
import { SectionComponent } from '../section/section.component';
import { SummaryComponent } from '../summary/summary.component';
import { scheduleDfWaveIntro } from '../../utilities/dynamic-form-player-wave.util';

@Component({
  selector: 'lj-df-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  imports: [
    MatStepperModule,
    SectionComponent,
    LjButtonComponent,
    MatIconModule,
    SubmitButtonComponent,
    SummaryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
})
export class StepperComponent implements AfterViewInit, OnDestroy {
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

  currentStep = signal(0);
  @ViewChildren(SectionComponent)
  sectionComponents!: QueryList<SectionComponent>;

  SectionLayouts = SectionLayouts;

  readonly change = output<DynamicFormField<unknown> | DynamicFormSection>();
  readonly customAction = output<FieldCustomAction>();
  readonly dataChange = output<
    DynamicFormField<unknown> | DynamicFormSection
  >();
  readonly submit = output<void>();

  private waveClear?: () => void;

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
    const sections = this.formSteps().map(section => {
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
    const currentSection = this.formSteps()[this.currentStep()];

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

  onStepChange(newIndex: number) {
    const currentSection = this.formSteps()[
      this.currentStep()
    ] as DynamicFormSection;
    this.handleSectionState(currentSection);
    this.currentStep.set(newIndex);
    this.scheduleScrollActiveStepPanelIntoView();
  }

  onNextClick(): void {
    const idx = this.currentStep();
    const steps = this.formSteps();
    const lastIndex = Math.max(0, steps.length - 1);
    const nextIdx = Math.min(idx + 1, lastIndex);
    const section = steps[idx] as DynamicFormSection | undefined;

    if (
      section &&
      section.name !== 'Summary' &&
      this.showElement(section, this.formData(), this.mode())
    ) {
      const touchedSection = {
        ...section,
        touched: true,
      } as DynamicFormSection;
      this.handleSectionState(touchedSection);
    }

    this.changeDetectorRef.markForCheck();
    this.currentStep.set(nextIdx);
    this.scheduleScrollActiveStepPanelIntoView();
  }

  private scheduleScrollActiveStepPanelIntoView(): void {
    this.changeDetectorRef.detectChanges();
    const run = (): void => {
      const step = this.formSteps()[this.currentStep()];
      if (!step || !this.isSection(step)) {
        return;
      }
      const panelId = `df-step-content-${(step as DynamicFormSection).id}`;
      const host = this.host.nativeElement;
      const target =
        (host.querySelector(
          '.mat-step-header.mat-vertical-stepper-header[aria-expanded="true"]'
        ) as HTMLElement | null) ??
        (host.querySelector(
          `#${CSS.escape(panelId)}`
        ) as HTMLElement | null) ??
        (host.querySelector(
          '.mat-vertical-content-container.mat-vertical-content-container-active .df-step-panel'
        ) as HTMLElement | null) ??
        (host.querySelector(
          '.mat-vertical-content-container.mat-vertical-content-container-active'
        ) as HTMLElement | null);
      if (!target?.isConnected) {
        return;
      }
      this.scrollActiveStepIntoView(target);
    };
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        run();
        setTimeout(run, 100);
        setTimeout(run, 250);
        setTimeout(run, 500);
      });
    });
  }

  private scrollActiveStepIntoView(target: HTMLElement): void {
    if (typeof window === 'undefined') {
      return;
    }

    const behavior: ScrollBehavior = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
      ? 'auto'
      : 'smooth';

    target.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
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

  private readonly summaryStepId = getUUID4();

  formSteps = computed(() => {
    if (
      this.mode() === 'display' &&
      this.formOptions().displayReviewScreenOnSubmit
    ) {
      const reviewScreenStep = {
        id: this.summaryStepId,
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
