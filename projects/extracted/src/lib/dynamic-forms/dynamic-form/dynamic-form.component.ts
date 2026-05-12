import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  OnDestroy,
  output,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
  type OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as formulajs from '@formulajs/formulajs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Md5 } from 'ts-md5';
import { DataVisibilityLevels } from '../../services/data/enums/data-visibility-levels.enums';
import { PrefillSourceTypes } from '../../services/data/enums/prefill-data.enums';
import type { PrefillDataQuerySchema } from '../../services/data/models/prefill-data-unit-query.models';
import type { BasePrefillDataUnitSchema } from '../../services/data/models/prefill-data-unit.models';
import { PrefillDataService } from '../../services/data/prefill-data.service';
import { EnvironmentService } from '../../services/environment/environment.service';
import { UserActivityService } from '../../services/identity/userActivity';
import { OrganizationService } from '../../services/organization/organization.service';
import {
  RealtimeActions,
  RealtimeMessagingService,
  WatchedEntities,
} from '../../services/realtimeMessaging/realtime-messaging.service';
import { isEqual, isUndefinedOrNull } from '../../utils/comparisonUtil';
import { getUUID4 } from '../../utils/stringUtil';
import { TimeUtil } from '../../utils/timeUtil';
import {
  DynamicForm,
  DynamicFormData,
  DynamicFormField,
  DynamicFormFieldTypes,
  DynamicFormSection,
  FormModes,
  FormTypes,
  SectionLayouts,
} from '../models/dynamic-forms.models';
import {
  CssRootNode,
  elementShouldDisplay,
  fetchFieldsByType,
  fetchFieldsRecursively,
  fetchPrefillQueryKeys,
  getCustomStyleString,
  getFields,
  getPrefillKey,
  isDynamicFormSection,
  parseCustomCss,
  setField,
} from '../utilities/dynamicFormsUtil';
import { computeSuppressedErrors } from '../utilities/validation-errors.util';
import { FieldCustomAction } from './components/abstract-field.component';
import { SubmitButtonComponent } from './components/buttons/submit-button/submit-button.component';
import { DynamicFormTabsComponent } from './components/dynamic-form-tabs/dynamic-form-tabs.component';
import { SectionComponent } from './components/section/section.component';
import { StepperComponent } from './components/stepper/stepper.component';
import { scheduleDfWaveIntro } from './utilities/dynamic-form-player-wave.util';

export type DynamicFormPrefillTracking = {
  accepted: string[];
  declined: string[];
};

@Component({
  selector: 'lj-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
  imports: [
    FormsModule,
    SectionComponent,
    StepperComponent,
    MatIconModule,
    MatTooltipModule,
    DynamicFormTabsComponent,
    SubmitButtonComponent,
    NgxSkeletonLoaderModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormComponent implements OnInit, OnDestroy {
  private readonly injector = inject(Injector);
  private changeDetection = inject(ChangeDetectorRef);
  realtimeService = inject(RealtimeMessagingService);
  organizationService = inject(OrganizationService);
  prefillDataService = inject(PrefillDataService);
  userActivityService = inject(UserActivityService);
  prefillTargetUserId = input<string | undefined>(undefined);
  prefillPendingChanges = signal<Record<string, unknown>>({});

  loading = signal(true);
  fieldValidity = signal<Record<string, string | undefined>>({});
  suppressedErrors = signal<Record<string, string[]>>({});
  submitPlayerPhase = signal<'idle' | 'processing' | 'success'>('idle');
  submitSuccessRepresentativeName = input<string | undefined>(undefined);
  submitSuccessRepresentativeRole = input<string | undefined>(undefined);
  submitSuccessRepresentativeAvatarUrl = input<string | undefined>(undefined);
  debounceTime = 500;

  form = model.required<DynamicForm>();
  lastSavedAt = input<number | undefined>(undefined);
  mode = model<FormModes>('display');
  customCss = input<string>('');
  isMobile = input(false);
  allowManualComputedValueEdit = input(false);
  showSubmitAnimation = input(true);
  parsedCustomCss = signal<CssRootNode>({ parent: null, children: [] });
  private readonly env = inject(EnvironmentService);
  isBackoffice = this.env.getAppType() === 'backoffice';

  @ViewChild('dfPlayerRoot', { read: ElementRef })
  private dfPlayerRoot?: ElementRef<HTMLElement>;

  @ViewChildren(SectionComponent) formComponents!: QueryList<SectionComponent>;
  @ViewChildren(StepperComponent)
  steppedComponents!: QueryList<StepperComponent>;
  @ViewChildren(DynamicFormTabsComponent)
  tabsComponents!: QueryList<DynamicFormTabsComponent>;

  private inlineWaveCleanup?: () => void;
  private inlineWaveKey = '';
  private submitPlayerTimer: number | null = null;

  readonly customAction = output<FieldCustomAction>();
  readonly dataChange = output<{
    data: DynamicFormData;
    form: DynamicForm;
  }>();
  readonly submit = output<DynamicForm>();

  formDataChanged = new Subject<DynamicForm>();

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

  destroy$ = new Subject<void>();
  SectionLayouts = SectionLayouts;

  // FORM LIFECYCLE

  constructor() {
    toObservable(this.customCss)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: customCss => {
          this.parsedCustomCss.set(parseCustomCss(customCss));
          this.changeDetection.detectChanges();
        },
      });

    toObservable(this.form)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: form => {
          this.suppressedErrors.set(
            computeSuppressedErrors(form.formDefinition)
          );
          this.changeDetection.detectChanges();
        },
      });

    this.formDataChanged
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(form => {
        this.updatePrefillData(form);
      });

    this.realtimeService.messages.pipe(takeUntil(this.destroy$)).subscribe({
      next: message => {
        if (
          message.entity === WatchedEntities.DATA &&
          message.action === RealtimeActions.REFRESH
        ) {
          this.loadPrefillData();
        }
      },
    });

    effect(
      () => {
        if (this.loading()) {
          this.clearInlineWave();
          this.inlineWaveKey = '';
          return;
        }

        if (
          this.getFormType() !== FormTypes.INLINE ||
          this.mode() !== 'display'
        ) {
          this.clearInlineWave();
          return;
        }

        const key = `${this.form().id}-${this.mode()}`;
        if (key === this.inlineWaveKey) {
          return;
        }
        this.inlineWaveKey = key;

        afterNextRender(
          () => {
            queueMicrotask(() => {
              const root = this.dfPlayerRoot?.nativeElement;
              if (!root) {
                return;
              }
              this.clearInlineWave();
              this.inlineWaveCleanup = scheduleDfWaveIntro(root);
              this.changeDetection.markForCheck();
            });
          },
          { injector: this.injector }
        );
      },
      { injector: this.injector }
    );
  }

  private clearInlineWave(): void {
    this.inlineWaveCleanup?.();
    this.inlineWaveCleanup = undefined;
  }

  ngOnInit() {
    this.loadPrefillData();
  }

  ngOnDestroy() {
    this.clearSubmitPlayerTimer();
    this.clearInlineWave();
    this.sendDataUnwatchMessage();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // REALTIME INTERACTIONS

  sendDataWatchMessage() {
    const prefillTargetId = this.prefillTargetUserId();

    if (!prefillTargetId) {
      return;
    }

    this.realtimeService.connect();
    this.realtimeService.sendMessage({
      action: RealtimeActions.WATCH,
      entity: WatchedEntities.DATA,
      watched_resource_id: prefillTargetId,
    });
  }

  sendDataUnwatchMessage() {
    const prefillTargetId = this.prefillTargetUserId();

    if (!prefillTargetId) {
      return;
    }

    this.realtimeService.sendMessage({
      action: RealtimeActions.UNWATCH,
      entity: WatchedEntities.DATA,
      watched_resource_id: prefillTargetId,
    });
  }

  sendDataRefreshMessage() {
    const prefillTargetId = this.prefillTargetUserId();

    if (!prefillTargetId) {
      return;
    }

    this.realtimeService.messages.next({
      action: RealtimeActions.REFRESH,
      entity: WatchedEntities.DATA,
      watched_resource_id: prefillTargetId,
    });

    this.realtimeService.sendMessage({
      action: RealtimeActions.REFRESH,
      entity: WatchedEntities.DATA,
      watched_resource_id: prefillTargetId,
    });
  }

  // UI INTERACTIONS
  getFormattedSaveTime(): string {
    const lastSavedAt = this.lastSavedAt();

    if (!lastSavedAt) {
      return '';
    }

    const savedDateTime = TimeUtil.convertSecondTimestampToDate(lastSavedAt);
    const todaysDate = new Date();

    if (savedDateTime.getDate() === todaysDate.getDate()) {
      return `Auto-saved Today at ${savedDateTime.toLocaleTimeString()}`;
    }

    return `Auto-saved at ${savedDateTime.toLocaleTimeString()} on ${savedDateTime.toLocaleDateString()}`;
  }

  getFormType(): FormTypes {
    // On the mobile app, we only want to show STEPS, even if TABS
    if (this.isMobile() && this.form().formType === FormTypes.TABS) {
      return FormTypes.STEPS;
    }

    return this.form().formType || FormTypes.INLINE;
  }

  isValid(): boolean {
    if (this.isMobile() && this.form().formType === FormTypes.TABS) {
      return this.steppedComponents
        .map(stepsComponent => stepsComponent.isValid())
        .every(isValid => isValid);
    } else {
      if (this.form().formType === FormTypes.INLINE) {
        return this.formComponents
          .map(formComponent => formComponent.isValid())
          .every(isValid => isValid);
      }

      if (this.form().formType === FormTypes.TABS) {
        return this.tabsComponents
          .map(tabsComponent => tabsComponent.isValid())
          .every(isValid => isValid);
      }

      if (this.form().formType === FormTypes.STEPS) {
        return this.steppedComponents
          .map(stepsComponent => stepsComponent.isValid())
          .every(isValid => isValid);
      }
    }

    return false;
  }

  handleChange(itemToChange: DynamicFormField<unknown> | DynamicFormSection) {
    const form = this.form();
    const item = form.formDefinition.find(fd => fd.id === itemToChange.id);

    if (!item) {
      return;
    }

    Object.assign(item, itemToChange);
    form.data = getFields(form);
  }

  handleCustomAction(event: FieldCustomAction) {
    this.customAction.emit(event);
  }

  handleDataChange(
    itemToChange: DynamicFormField<unknown> | DynamicFormSection
  ) {
    const form = this.form();
    const item = form.formDefinition.find(value => value === itemToChange);

    this.userActivityService.registerActivity();

    if (!item) {
      return;
    }

    if (isDynamicFormSection(itemToChange)) {
      Object.assign(item, itemToChange);
    } else {
      (item as DynamicFormField<unknown>).value = (
        itemToChange as DynamicFormField<unknown>
      ).value;
    }

    form.data = getFields(form);
    this.fieldValidity.set(this.computeFieldValidity());

    this.evaluateComputedFields(form);

    if (
      this.organizationService.isFeatureFlagActivated(
        'DYNAMIC_FORM_PREFILL_LIVE_TEST_MODE'
      )
    ) {
      this.formDataChanged.next(form);
    }

    this.dataChange.emit({ data: form.data, form });
  }

  handleSubmit() {
    if (this.mode() === 'locked') {
      return;
    }

    if (this.mode() !== 'display') {
      this.isValid();
      this.submit.emit(this.form());
      this.updatePrefillData(this.form());
      return;
    }

    const valid = this.isValid();
    this.fieldValidity.set(this.computeFieldValidity());

    if (!valid) {
      this.changeDetection.markForCheck();
      return;
    }

    if (!this.showSubmitAnimation()) {
      this.emitSubmitAndPrefill();
      this.changeDetection.markForCheck();
      return;
    }

    if (this.submitPlayerPhase() !== 'idle') {
      return;
    }

    this.submitPlayerPhase.set('processing');
    this.changeDetection.markForCheck();

    if (typeof window === 'undefined') {
      this.finishSubmitPlayerFlow();
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.clearSubmitPlayerTimer();
    const delay = this.submitPlayerDelayMs();
    this.submitPlayerTimer = window.setTimeout(() => {
      this.submitPlayerTimer = null;
      this.finishSubmitPlayerFlow();
    }, delay);
  }

  private emitSubmitAndPrefill(): void {
    this.submit.emit(this.form());
    this.updatePrefillData(this.form());
  }

  private finishSubmitPlayerFlow(): void {
    this.emitSubmitAndPrefill();
    this.submitPlayerPhase.set('success');
    this.changeDetection.markForCheck();
  }

  private clearSubmitPlayerTimer(): void {
    if (this.submitPlayerTimer !== null) {
      clearTimeout(this.submitPlayerTimer);
      this.submitPlayerTimer = null;
    }
  }

  private submitPlayerDelayMs(): number {
    if (
      typeof window !== 'undefined' &&
      'matchMedia' in window &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return 600;
    }

    return 2600;
  }

  getCustomStyle(selector: string): string {
    return getCustomStyleString(selector, this.parsedCustomCss());
  }

  computeFieldValidity(): Record<string, string | undefined> {
    const validity: Record<string, string | undefined> = {};
    for (const section of this.formComponents ?? []) {
      Object.assign(validity, section.getFieldValidityMap());
    }
    for (const stepper of this.steppedComponents ?? []) {
      for (const section of stepper.sectionComponents ?? []) {
        Object.assign(validity, section.getFieldValidityMap());
      }
    }
    for (const tabs of this.tabsComponents ?? []) {
      for (const section of tabs.sectionComponents ?? []) {
        Object.assign(validity, section.getFieldValidityMap());
      }
    }
    return validity;
  }

  showElement(
    element: DynamicFormSection | DynamicFormField<unknown>,
    formData: DynamicFormData,
    mode: FormModes
  ): boolean {
    return elementShouldDisplay(element, formData, mode, this.fieldValidity());
  }

  // ELEMENT TYPE CASTING

  getSection(element: unknown): DynamicFormSection {
    return element as DynamicFormSection;
  }

  getField(element: unknown): DynamicFormField<unknown> {
    return element as DynamicFormField<unknown>;
  }

  isSection(element: DynamicFormField<unknown> | DynamicFormSection): boolean {
    return isDynamicFormSection(element);
  }

  getSubmitField() {
    const fields = fetchFieldsByType(
      this.form().formDefinition as Array<DynamicFormSection>,
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

  // PREFILL API

  prefillIsAvailable(): boolean {
    if (
      !this.organizationService.isFeatureFlagActivated(
        'DYNAMIC_FORM_PREFILL_FEATURE'
      )
    ) {
      return false;
    }

    const prefillTargetId = this.prefillTargetUserId();

    if (prefillTargetId && this.mode() === 'display') {
      return true;
    }

    return false;
  }

  loadPrefillData() {
    if (!this.prefillIsAvailable()) {
      this.loading.set(false);
      return;
    }

    const prefillTargetId = this.prefillTargetUserId();

    if (!prefillTargetId) {
      return;
    }

    this.sendDataWatchMessage();

    const form = this.form();

    const allFields = fetchFieldsRecursively(form.formDefinition);
    const prefillKeyToFieldName = new Map<string, string>();
    for (const field of allFields) {
      if (field.prefillable === true) {
        const prefillKey = getPrefillKey(field);
        if (prefillKey) {
          prefillKeyToFieldName.set(prefillKey, field.name);
        }
      }
    }

    const fieldNames = fetchPrefillQueryKeys(form.formDefinition);

    const searchParams: PrefillDataQuerySchema = {
      userId: prefillTargetId ?? '',
      keys: fieldNames,
    };

    this.prefillDataService.searchPrefillData(searchParams).subscribe({
      next: dataUnits => {
        let dirty = false;
        const prefillPendingChanges = structuredClone(
          this.prefillPendingChanges()
        );
        for (const dataUnit of dataUnits) {
          const fieldName =
            prefillKeyToFieldName.get(dataUnit.key) ?? dataUnit.key;
          if (
            !this.prefillIsDeclined(fieldName, JSON.stringify(dataUnit.value))
          ) {
            const normalizedValue = this.normalizeFieldValue(
              form,
              fieldName,
              dataUnit.value
            );

            if (form.data[fieldName]) {
              if (!isEqual(form.data[fieldName], normalizedValue)) {
                prefillPendingChanges[fieldName] = normalizedValue;
              }
            } else {
              dirty = true;
              form.data[fieldName] = normalizedValue;
              setField(form, fieldName, normalizedValue);
            }
          }
        }
        this.prefillPendingChanges.set(prefillPendingChanges);

        if (dirty) {
          this.dataChange.emit({ data: form.data, form });
          this.form.set(form);
        }

        this.loading.set(false);
      },
      error: _ => {
        this.loading.set(false);
      },
    });
  }

  private normalizeFieldValue(
    form: DynamicForm,
    fieldName: string,
    value: unknown
  ): unknown {
    // Find the field in the form definition
    const field = this.findFieldByName(form.formDefinition, fieldName);

    if (field && field.parameters?.options && typeof value === 'string') {
      // Check if value matches any option's value (already correct)
      const valueMatch = field.parameters.options.find(
        opt => String(opt.value) === value
      );
      if (valueMatch) {
        return value; // Already a valid value
      }

      // Check if value matches any option's label (needs conversion)
      const labelMatch = field.parameters.options.find(
        opt => opt.label === value
      );
      if (labelMatch) {
        return labelMatch.value; // Convert label to value
      }
    }

    return value; // Return as-is if not a field or no match
  }

  private findFieldByName(
    formDefinition: Array<DynamicFormField<unknown> | DynamicFormSection>,
    fieldName: string
  ): DynamicFormField<unknown> | undefined {
    for (const element of formDefinition) {
      if (isDynamicFormSection(element)) {
        const section = element as DynamicFormSection;
        const found = this.findFieldByName(
          section.fields as Array<
            DynamicFormField<unknown> | DynamicFormSection
          >,
          fieldName
        );
        if (found) return found;
      } else {
        const field = element as DynamicFormField<unknown>;
        if (field.name === fieldName) {
          return field;
        }
      }
    }
    return undefined;
  }

  updatePrefillData(form: DynamicForm) {
    if (!this.prefillIsAvailable()) {
      return;
    }

    const prefillTargetId = this.prefillTargetUserId();
    const dataDeduplication: Record<string, unknown> = {};
    const data: BasePrefillDataUnitSchema[] = [];

    const allFields = fetchFieldsRecursively(form.formDefinition);
    const fieldNameToPrefillKey = new Map<string, string>();
    const prefillKeyToFieldName = new Map<string, string>();
    const prefillableFieldNames = new Set<string>();
    for (const field of allFields) {
      if (field.prefillable === true) {
        const prefillKey = getPrefillKey(field);
        if (prefillKey) {
          fieldNameToPrefillKey.set(field.name, prefillKey);
          prefillKeyToFieldName.set(prefillKey, field.name);
          prefillableFieldNames.add(field.name);
        }
      }
    }

    for (const fieldName of Object.keys(form.data)) {
      if (!prefillableFieldNames.has(fieldName)) {
        continue;
      }
      const prefillKey = fieldNameToPrefillKey.get(fieldName) ?? fieldName;
      dataDeduplication[prefillKey] = form.data[fieldName];
    }

    for (const dataUnitName of Object.keys(dataDeduplication)) {
      let value = dataDeduplication[dataUnitName];

      // Normalize field values: ensure we save the value, not the label
      const fieldName = prefillKeyToFieldName.get(dataUnitName) ?? dataUnitName;
      value = this.normalizeFieldValue(form, fieldName, value);

      if (value !== undefined && value !== null) {
        if (
          (typeof value === 'string' && value.trim() !== '') ||
          (typeof value === 'number' && !isNaN(value))
        ) {
          data.push({
            userId: prefillTargetId ?? '',
            key: dataUnitName,
            value,
            visibilityLevel: DataVisibilityLevels.PRIVATE,
            sourceType: PrefillSourceTypes.DYNAMIC_FORM,
            sourceId: form.id,
          });
        }
      }
    }

    this.prefillDataService
      .upsertPrefillData(data)
      .subscribe(() => this.sendDataRefreshMessage());
  }

  ensureSystemPrefillDataExists(form: DynamicForm) {
    if (!form.data['__SYSTEM_PREFILL_TRACKING']) {
      form.data['__SYSTEM_PREFILL_TRACKING'] = {
        accepted: [],
        declined: [],
      };
    }
  }

  private evaluateComputedFields(form: DynamicForm) {
    const allFields = fetchFieldsRecursively(
      form.formDefinition as Array<DynamicFormSection>
    );

    const computedFields = allFields.filter(
      field =>
        field.fieldType === DynamicFormFieldTypes.COMPUTED &&
        field.parameters?.computedFormula
    );

    if (computedFields.length === 0) {
      return;
    }

    const context: Record<string, unknown> = { ...formulajs };

    for (const field of computedFields) {
      const formula = field.parameters?.computedFormula;

      if (!formula) {
        continue;
      }

      const allFieldNames = Object.keys(form.data ?? {});

      const variableNames = [...Object.keys(context), ...allFieldNames];
      const variableValues = [
        ...Object.values(context),
        ...allFieldNames.map(name => form.data[name]),
      ];

      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const evalFunc = new Function(
          ...variableNames,
          `return ${formula}`
        ) as (...args: unknown[]) => unknown;

        const result = evalFunc(...variableValues);

        form.data[field.name] = result;
        field.value = result;
      } catch {
        // If evaluation fails, do not crash the form; leave value as-is
      }
    }
  }

  addToPrefillTracking(
    form: DynamicForm,
    category: 'accepted' | 'declined',
    value: string
  ) {
    const tracking = form.data[
      '__SYSTEM_PREFILL_TRACKING'
    ] as DynamicFormPrefillTracking;

    if (!tracking[category].includes(value)) {
      tracking[category].push(value);
    }
  }

  acceptPrefillChange(dataUnitKey: string) {
    const form = this.form();
    const prefillPendingChanges = structuredClone(this.prefillPendingChanges());
    const newValue = prefillPendingChanges[dataUnitKey];

    if (isUndefinedOrNull(newValue)) {
      return;
    }

    this.ensureSystemPrefillDataExists(form);
    this.addToPrefillTracking(form, 'accepted', dataUnitKey);

    setField(form, dataUnitKey, newValue);
    delete prefillPendingChanges[dataUnitKey];
    this.prefillPendingChanges.set(prefillPendingChanges);
    form.data[dataUnitKey] = newValue;
    this.dataChange.emit({ data: form.data, form });
    this.form.set(structuredClone(form));
  }

  declinePrefillChange(dataUnitKey: string) {
    const form = this.form();
    const prefillPendingChanges = structuredClone(this.prefillPendingChanges());
    const proposedValue = JSON.stringify(prefillPendingChanges[dataUnitKey]);

    const hash = this.getPrefillHash(dataUnitKey, proposedValue);
    this.ensureSystemPrefillDataExists(form);
    this.addToPrefillTracking(form, 'declined', hash);
    delete prefillPendingChanges[dataUnitKey];
    this.prefillPendingChanges.set(structuredClone(prefillPendingChanges));
    this.dataChange.emit({ data: form.data, form });
    this.form.set(structuredClone(form));
  }

  getPrefillHash(dataUnitKey: string, dataUnitValue: string): string {
    return `${dataUnitKey}_${Md5.hashStr(dataUnitValue)}`;
  }

  prefillIsDeclined(dataUnitKey: string, dataUnitValue: string) {
    const form = this.form();

    this.ensureSystemPrefillDataExists(form);

    const hash = this.getPrefillHash(dataUnitKey, dataUnitValue);

    const tracking = form.data[
      '__SYSTEM_PREFILL_TRACKING'
    ] as DynamicFormPrefillTracking;

    if (tracking.declined.includes(hash)) {
      return true;
    }

    return false;
  }
}
