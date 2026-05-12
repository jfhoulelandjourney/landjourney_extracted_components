import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { catchError, forkJoin, map, of, Subject, takeUntil } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { DynamicFormComponent } from '../../../dynamic-forms/dynamic-form/dynamic-form.component';
import {
  FormTypes,
  SectionLayouts,
  type DynamicForm,
  type DynamicFormData,
  type DynamicFormField,
  type DynamicFormFieldTypes,
  type DynamicFormSection,
} from '../../../dynamic-forms/models/dynamic-forms.models';
import { getDefaultValueForFieldType } from '../../../dynamic-forms/models/fields.models';
import type { Business } from '../../../models/businessModels';
import { isScorecardTotalRuleFieldId } from '../../../models/products/product-rule-system-fields';
import {
  QualifyingEnum,
  RuleTypeKeyEnum,
  type Product,
  type ProductDisplay,
  type Program,
} from '../../../models/products/products.model';
import {
  getRequestUserRolesDisplayName,
  RequestUserRoles,
} from '../../../models/requestModels';
import { formatSSN } from '../../../models/ssn';
import type { UserProfile } from '../../../models/userModels';
import { PrefillDataService } from '../../../services/data/prefill-data.service';
import type { Field } from '../../../services/products/fields/fields.models';
import { FieldTypes } from '../../../services/products/fields/fields.models';
import { FieldsService } from '../../../services/products/fields/fields.service';
import { ProductsService } from '../../../services/products/products.service';
import { getUUID4 } from '../../../utils/stringUtil';
import { TimeUtil } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';
import { CustomerBusinessSelectorComponent } from '../../customer-business-selector/customer-business-selector.component';
import { SidePanelComponent } from '../../side-panel/side-panel.component';
import type { Tab } from '../../tabs/tab.models';
import { LjTabComponent } from '../../tabs/tab/tab.component';
import { LjTabsComponent } from '../../tabs/tabs/tabs.component';
import { AUTO_RULE_CALLOUTS } from '../auto-rule-check-copy';
import { ProductComponent } from '../product/product.component';
import {
  getProductDisplay,
  getProductDisplayForSimulator,
  type DynamicFormWithAssignee,
} from '../products.utils';

@Component({
  selector: 'lj-products-simulator',
  imports: [
    ProductComponent,
    DynamicFormComponent,
    ActivateDirective,
    CustomerBusinessSelectorComponent,
    LjButtonComponent,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    LjTabsComponent,
    LjTabComponent,
    SidePanelComponent,
  ],
  templateUrl: './products-simulator.component.html',
  styleUrl: './products-simulator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsSimulatorComponent implements OnDestroy, OnInit {
  RuleTypeKeyEnum = RuleTypeKeyEnum;
  protected readonly callouts = AUTO_RULE_CALLOUTS;
  protected readonly simulatorCallout = computed(() =>
    this.product()
      ? AUTO_RULE_CALLOUTS.simulator
      : AUTO_RULE_CALLOUTS.simulatorProgram
  );
  readonly simulatorApplicantRoleOptions: RequestUserRoles[] = [
    RequestUserRoles.BORROWER,
    RequestUserRoles.CO_BORROWER,
    RequestUserRoles.GUARANTOR,
    RequestUserRoles.COLLABORATOR,
    RequestUserRoles.NON_OBLIGATED_PARTY,
  ];
  readonly getRequestUserRolesDisplayName = getRequestUserRolesDisplayName;
  private productsService = inject(ProductsService);
  private fieldsService = inject(FieldsService);
  private prefillDataService = inject(PrefillDataService);
  private destroy$ = new Subject<void>();

  program = input.required<Program>();
  product = input<Product | undefined>(undefined);
  isOpen = input<boolean>(false);
  readonly closeSimulator = output<void>();

  programs = signal<Program[]>([]);
  isProductSelectorOpen = signal<boolean>(false);
  dropdownItems = signal<
    Array<{ id: string; name: string; displayName: string }>
  >([]);
  selectedTab = signal<'manual-testing' | 'customer-search'>('manual-testing');

  parentFields = input<Field[]>([]);
  fields = signal<Field[]>([]);

  // DynamicForm with sections (categories) and fields (rules)
  simulatorForm = signal<DynamicForm | undefined>(undefined);

  // Computed product display using simulator-specific function
  productDisplay = signal<ProductDisplay | undefined>(undefined);

  productDisplayComparisons = signal<ProductDisplay[]>([]);

  // Formatted prefill data for display (per entity)
  prefillDataDisplay = signal<
    Array<{
      assigneeId: string;
      name: string;
      type: 'user' | 'business';
      data: Array<{ key: string; value: unknown }>;
    }>
  >([]);

  // Multi-form state when using customer/business selector
  dynamicFormsWithAssigneeId = signal<
    { dynamicForm: DynamicForm; assigneeId: string }[]
  >([]);
  assigneeSimulatorRoles = signal<Map<string, RequestUserRoles>>(new Map());
  selectedUserIds = signal<string[]>([]);

  // Handle data change from dynamic form
  onFormDataChange(event: { data: DynamicFormData; form: DynamicForm }): void {
    this.simulatorForm.set(event.form);
    this.refreshProductDisplay();
  }

  private dynamicFormsWithRolesForDisplay(): DynamicFormWithAssignee[] {
    const multiBase = this.dynamicFormsWithAssigneeId();
    const roleMap = this.assigneeSimulatorRoles();
    if (multiBase.length === 0) {
      return [];
    }
    return multiBase.map(entry => ({
      ...entry,
      userRole: roleMap.get(entry.assigneeId) ?? RequestUserRoles.BORROWER,
    }));
  }

  private refreshProductDisplay(): void {
    const multi = this.dynamicFormsWithRolesForDisplay();
    const ids = this.selectedUserIds();
    const program = this.program();
    const product = this.product();
    const fields = this.fields();

    if (multi.length > 0 && ids.length > 0) {
      this.productDisplay.set(
        getProductDisplay(program, product, ids, multi, fields)
      );
    } else {
      const form = this.simulatorForm();
      this.productDisplay.set(
        getProductDisplayForSimulator(program, product, fields, form)
      );
    }
    this.updateComparisons();
  }

  private updateComparisons(): void {
    const comparisons = this.productDisplayComparisons();
    const fields = this.fields();
    const multi = this.dynamicFormsWithRolesForDisplay();
    const ids = this.selectedUserIds();
    const form = this.simulatorForm();

    const updatedComparisons = comparisons.map(comparison => {
      const program = this.programs().find(
        p => p.name === comparison.programName
      );
      if (!program) return comparison;

      let product: Product | undefined;
      if (!comparison.productName || comparison.productName === '') {
        product = undefined;
      } else {
        const prod = program.products?.find(
          p => p.name === comparison.productName
        );
        if (!prod) return comparison;
        product = prod;
      }

      if (multi.length > 0 && ids.length > 0) {
        return getProductDisplay(program, product, ids, multi, fields);
      }
      return getProductDisplayForSimulator(program, product, fields, form);
    });

    this.productDisplayComparisons.set(updatedComparisons);
  }

  constructor() {
    // Watch for product changes and update dropdown items
    effect(() => {
      this.product(); // Trigger effect when product changes
      this.updateDropdownItems();
    });
  }

  ngOnInit() {
    this.loadFields();
    this.loadPrograms();
  }

  private loadPrograms(): void {
    this.productsService.getAllPrograms().subscribe({
      next: programs => {
        this.programs.set(programs);
        this.updateDropdownItems();
      },
    });
  }

  private updateDropdownItems(): void {
    const currentProgram = this.program();
    const currentProduct = this.product();
    const comparisons = this.productDisplayComparisons();

    if (!currentProduct) {
      // Show programs, but exclude the current program and already selected comparisons
      const comparisonProgramNames = new Set(
        comparisons.map(c => c.programName)
      );
      const items = this.programs()
        .filter(
          program =>
            program.id !== currentProgram.id &&
            !comparisonProgramNames.has(program.name)
        )
        .map(program => ({
          id: program.id ?? '',
          name: program.name,
          displayName: program.name,
        }));
      this.dropdownItems.set(items);
    } else {
      // Show products with program names, but exclude the current program/product combo and already selected comparisons
      const comparisonKeys = new Set(
        comparisons.map(c => `${c.programName}::${c.productName || ''}`)
      );
      const items: Array<{ id: string; name: string; displayName: string }> =
        [];

      this.programs().forEach(program => {
        if (program.products && program.products.length > 0) {
          program.products.forEach(product => {
            // Skip if this is the current program/product combo
            if (
              program.id === currentProgram.id &&
              product.id === currentProduct.id
            ) {
              return;
            }
            // Skip if already in comparisons
            const comparisonKey = `${program.name}::${product.name}`;
            if (comparisonKeys.has(comparisonKey)) {
              return;
            }
            items.push({
              id: product.id ?? '',
              name: product.name,
              displayName: `${product.name} (${program.name})`,
            });
          });
        }
      });

      this.dropdownItems.set(items);
    }
  }

  // Build the form structure from program/product/fields and all comparisons
  private buildFormStructure(
    isRandom = false,
    data?: DynamicFormData
  ): DynamicForm | undefined {
    const program = this.program();
    const product = this.product();
    const fields = this.fields();
    const comparisons = this.productDisplayComparisons();

    if (!program || fields.length === 0) {
      return undefined;
    }

    // Get all rules from program and product
    const programRules =
      program.rules?.filter(
        rule => rule.ruleType !== RuleTypeKeyEnum.PRICING_RULES
      ) ?? [];
    const productRules =
      product?.rules?.filter(
        rule => rule.ruleType !== RuleTypeKeyEnum.PRICING_RULES
      ) ?? [];
    let allRules = [...programRules, ...productRules];

    // Get scorecard criteria from program and product
    let scorecardCriteria = [
      ...(program.scoreCard ?? []),
      ...(product?.scoreCard ?? []),
    ];

    // Add rules and scorecard criteria from all comparisons
    for (const comparison of comparisons) {
      // Find the program and product for this comparison
      const comparisonProgram = this.programs().find(
        p => p.name === comparison.programName
      );

      if (comparisonProgram) {
        // Add program rules
        allRules = [...allRules, ...(comparisonProgram.rules ?? [])];
        // Add program scorecard
        scorecardCriteria = [
          ...scorecardCriteria,
          ...(comparisonProgram.scoreCard ?? []),
        ];

        // If comparison has a product, add its rules and scorecard too
        if (comparison.productName && comparison.productName !== '') {
          const comparisonProduct = comparisonProgram.products?.find(
            p => p.name === comparison.productName
          );
          if (comparisonProduct) {
            allRules = [...allRules, ...(comparisonProduct.rules ?? [])];
            scorecardCriteria = [
              ...scorecardCriteria,
              ...(comparisonProduct.scoreCard ?? []),
            ];
          }
        }
      }
    }

    // Track unique fields by field.id to avoid duplicates
    const uniqueFieldsMap = new Map<string, { field: Field; label: string }>();

    // Collect all unique fields from rules
    for (const rule of allRules) {
      if (!rule.fieldId) {
        continue;
      }
      if (isScorecardTotalRuleFieldId(rule.fieldId)) {
        continue;
      }

      const field = fields.find(f => f.id === rule.fieldId);
      if (!field) {
        continue;
      }

      // Only add if we haven't seen this field.id before
      if (field.id && !uniqueFieldsMap.has(field.id)) {
        uniqueFieldsMap.set(field.id, {
          field,
          label: rule.name || field.label,
        });
      }
    }

    // Collect all unique fields from scorecard criteria
    for (const criteria of scorecardCriteria) {
      if (!criteria.fieldId) {
        continue;
      }

      const field = fields.find(f => f.id === criteria.fieldId);
      if (!field) {
        continue;
      }

      // Only add if we haven't seen this field.id before
      if (field.id && !uniqueFieldsMap.has(field.id)) {
        uniqueFieldsMap.set(field.id, {
          field,
          label: criteria.name || field.label,
        });
      }
    }

    // Start with existing data if provided, otherwise empty object
    const computedNewData: DynamicFormData = data ? { ...data } : {};

    // Transform unique fields to DynamicFormFields
    const formFields: DynamicFormField<unknown>[] = Array.from(
      uniqueFieldsMap.values()
    ).map(({ field }) => {
      // Get value from existing data if provided, otherwise use default or random
      const fieldValue = computedNewData[field.name];
      let value: unknown;

      if (fieldValue !== undefined && fieldValue !== null) {
        // Use value from existing data (preserve existing values)
        value = fieldValue;
      } else if (isRandom) {
        // Generate random value based on field type
        value = this.generateRandomValueForField(field);
        computedNewData[field.name] = value;
      } else {
        // Use default value
        value = getDefaultValueForFieldType(
          field.fieldType as unknown as DynamicFormFieldTypes
        );
        computedNewData[field.name] = value;
      }

      // Transform Field to DynamicFormField
      const formField: DynamicFormField<unknown> = {
        id: getUUID4(),
        name: field.name,
        label: field.label,
        column: 0,
        fieldType: field.fieldType as unknown as DynamicFormFieldTypes,
        required: false,
        parameters: field.parameters,
        value,
      };

      return formField;
    });

    // Create a single section with all unique fields
    const sections: DynamicFormSection[] = [];
    if (formFields.length > 0) {
      sections.push({
        id: getUUID4(),
        name: '',
        layout: SectionLayouts.ONE_COLUMN,
        fields: formFields,
      });
    }

    return {
      name: '',
      formType: FormTypes.INLINE,
      formDefinition: sections,
      formOptions: {},
      data: computedNewData,
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFields(): void {
    const program = this.program();
    const parent = this.parentFields();
    const comparisons = this.productDisplayComparisons();

    const comparisonFieldIds: string[] = [];
    for (const comparison of comparisons) {
      const comparisonProgram = this.programs().find(
        p => p.name === comparison.programName
      );
      if (comparisonProgram) {
        comparisonFieldIds.push(
          ...(comparisonProgram.rules ?? [])
            .map(rule => rule.fieldId)
            .filter(
              (id): id is string =>
                Boolean(id) && !isScorecardTotalRuleFieldId(id)
            ),
          ...(comparisonProgram.scoreCard ?? [])
            .map(c => c.fieldId)
            .filter((id): id is string => Boolean(id))
        );
        if (comparison.productName?.trim()) {
          const compProduct = comparisonProgram.products?.find(
            p => p.name === comparison.productName
          );
          if (compProduct) {
            comparisonFieldIds.push(
              ...(compProduct.rules ?? [])
                .map(rule => rule.fieldId)
                .filter(
                  (id): id is string =>
                    Boolean(id) && !isScorecardTotalRuleFieldId(id)
                ),
              ...(compProduct.scoreCard ?? [])
                .map(c => c.fieldId)
                .filter((id): id is string => Boolean(id))
            );
          }
        }
      }
    }

    const uniqueComparisonIds = Array.from(new Set(comparisonFieldIds));
    const parentIds = new Set(
      parent.map(f => f.id).filter((id): id is string => Boolean(id))
    );
    const idsToFetch = uniqueComparisonIds.filter(id => !parentIds.has(id));

    const applyFields = (fields: Field[]) => {
      this.fields.set(fields);
      if (!program || fields.length === 0) return;
      const currentForm = this.simulatorForm();
      const data = currentForm?.data ?? {};
      const newForm = this.buildFormStructure(false, data);
      if (newForm) this.simulatorForm.set(newForm);
      const multi = this.dynamicFormsWithAssigneeId();
      if (multi.length > 0) {
        const rebuilt = multi
          .map(({ dynamicForm, assigneeId }) => {
            const f = this.buildFormStructure(false, dynamicForm.data);
            return f ? { dynamicForm: f, assigneeId } : null;
          })
          .filter(
            (x): x is { dynamicForm: DynamicForm; assigneeId: string } =>
              x !== null
          );
        this.dynamicFormsWithAssigneeId.set(rebuilt);
      }
      this.refreshProductDisplay();
    };

    if (idsToFetch.length === 0) {
      applyFields([...parent]);
      return;
    }

    this.fieldsService
      .getBulkFields(idsToFetch)
      .pipe(
        map(bulk => [...parent, ...bulk]),
        catchError(() => of([...parent])),
        takeUntil(this.destroy$)
      )
      .subscribe({ next: applyFields });
  }

  generateData(): void {
    const newForm = this.buildFormStructure(true);
    if (newForm) {
      this.simulatorForm.set(newForm);
      this.refreshProductDisplay();
    }
  }

  /**
   * Generates a random value based on the field type
   */
  private generateRandomValueForField(field: Field): unknown {
    switch (field.fieldType) {
      case FieldTypes.INPUT:
      case FieldTypes.TEXT:
        // Generate random string
        return `Random ${field.label || 'value'} ${Math.floor(Math.random() * 1000)}`;

      case FieldTypes.NUMBER:
        // Generate random number between 0 and 10000
        return Math.floor(Math.random() * 10000);

      case FieldTypes.COMPUTED:
        // Generate random number between 0 and 10000 and return as a string
        return `${Math.floor(Math.random() * 10000)}`;

      case FieldTypes.MONEY:
        // Generate random money value (in dollars, not cents)
        return Math.floor(Math.random() * 100000) / 100;

      case FieldTypes.DATE: {
        // Generate random date within the last 5 years
        const now = Date.now();
        const fiveYearsAgo = now - 5 * 365 * 24 * 60 * 60 * 1000;
        const randomTimestamp = Math.floor(
          (Math.random() * (now - fiveYearsAgo) + fiveYearsAgo) / 1000
        );
        return randomTimestamp;
      }

      case FieldTypes.SELECT:
      case FieldTypes.RADIO:
        // Pick a random option if available
        if (field.parameters?.options && field.parameters.options.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * field.parameters.options.length
          );
          return field.parameters.options[randomIndex]?.value;
        }
        return undefined;

      case FieldTypes.CHECKBOX:
        // Random boolean
        return Math.random() > 0.5;

      default:
        return undefined;
    }
  }

  onClose() {
    this.isProductSelectorOpen.set(false);
    this.closeSimulator.emit();
  }

  getPanelWidth(): string {
    const comparisonCount = this.productDisplayComparisons().length;
    const cardWidthPx = 350;
    const gapPx = 24;
    const comparisonsSectionHorizontalPaddingPx = 48;
    const formColumnEstimatePx = 420;
    const cardCount = 1 + comparisonCount;
    const comparisonsStripPx =
      cardCount * cardWidthPx +
      Math.max(0, cardCount - 1) * gapPx +
      comparisonsSectionHorizontalPaddingPx;
    const totalPx = Math.max(
      800,
      comparisonsStripPx + formColumnEstimatePx
    );
    return `min(${totalPx}px, 96vw)`;
  }

  comparisonTrackKey(display: ProductDisplay): string {
    return `${display.programName}::${display.productName ?? ''}`;
  }

  openProductSelector() {
    this.isProductSelectorOpen.set(!this.isProductSelectorOpen());
  }

  onItemSelected(itemId: string) {
    this.isProductSelectorOpen.set(false);

    const currentForm = this.simulatorForm();
    const fields = this.fields();

    if (!currentForm || fields.length === 0) {
      return;
    }

    if (!this.product()) {
      // Selected item is a program
      const selectedProgram = this.programs().find(p => p.id === itemId);
      if (selectedProgram) {
        const currentComparisons = this.productDisplayComparisons();
        // Check if already in comparisons to avoid duplicates
        const exists = currentComparisons.some(
          display => display.programName === selectedProgram.name
        );
        if (!exists) {
          // Add placeholder to comparisons first (will be updated after form rebuild)
          this.productDisplayComparisons.set([
            ...currentComparisons,
            {
              programName: selectedProgram.name,
              productName: '',
              rateDisplay: '',
              qualifying: QualifyingEnum.MISSING,
              sections: [],
              wordDisplay: 'Qualifying',
            },
          ]);

          // Reload fields to include new comparison's fields, then rebuild form
          this.loadFields();
          // Update dropdown to remove the newly added comparison
          this.updateDropdownItems();
        }
      }
    } else {
      // Selected item is a product
      let selectedProduct: Product | undefined;
      let selectedProgram: Program | undefined;

      // Find the product in the programs
      for (const program of this.programs()) {
        if (program.products) {
          const product = program.products.find(p => p.id === itemId);
          if (product) {
            selectedProduct = product;
            selectedProgram = program;
            break;
          }
        }
      }

      if (selectedProduct && selectedProgram) {
        const currentComparisons = this.productDisplayComparisons();
        // Check if already in comparisons to avoid duplicates
        const exists = currentComparisons.some(
          display =>
            display.programName === selectedProgram.name &&
            display.productName === selectedProduct.name
        );
        if (!exists) {
          // Add placeholder to comparisons first (will be updated after form rebuild)
          this.productDisplayComparisons.set([
            ...currentComparisons,
            {
              programName: selectedProgram.name,
              productName: selectedProduct.name,
              rateDisplay: '',
              qualifying: QualifyingEnum.MISSING,
              sections: [],
              wordDisplay: 'Qualifying',
            },
          ]);

          // Reload fields to include new comparison's fields, then rebuild form
          this.loadFields();
          // Update dropdown to remove the newly added comparison
          this.updateDropdownItems();
        }
      }
    }
  }

  onDeleteComparison(comparison: ProductDisplay) {
    const key = this.comparisonTrackKey(comparison);
    this.productDisplayComparisons.set(
      this.productDisplayComparisons().filter(
        c => this.comparisonTrackKey(c) !== key
      )
    );

    // Update dropdown to show the removed item again
    this.updateDropdownItems();

    // Reload fields (will exclude fields from the removed comparison)
    this.loadFields();
  }

  onTabSelected(tab: Tab) {
    this.selectedTab.set(tab as 'manual-testing' | 'customer-search');
  }

  onCustomerBusinessSelectionChange(payload: {
    users: UserProfile[];
    businesses: Business[];
  }) {
    const userEntities: Array<{ id: string; name: string; type: 'user' }> =
      payload.users
        .map(u => ({
          id: u.id ?? (u as { userId?: string }).userId ?? '',
          name: `${u.firstName} ${u.lastName}`,
          type: 'user' as const,
        }))
        .filter(e => e.id);

    const businessEntities: Array<{
      id: string;
      name: string;
      type: 'business';
    }> = payload.businesses
      .map(b => ({
        id: b.id ?? '',
        name: b.name,
        type: 'business' as const,
      }))
      .filter(e => e.id);

    const allEntities = [...userEntities, ...businessEntities];
    const ids = allEntities.map(e => e.id);

    if (ids.length === 0) {
      this.dynamicFormsWithAssigneeId.set([]);
      this.assigneeSimulatorRoles.set(new Map());
      this.selectedUserIds.set([]);
      this.prefillDataDisplay.set([]);
      this.refreshProductDisplay();
      return;
    }

    forkJoin(
      ids.map(id =>
        this.prefillDataService.getAllPrefillDataForUser(id).pipe(
          map(data => data.filter(item => !item.isDocument)),
          catchError(() => of([]))
        )
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: dataArrays => {
          const prefillDisplayData: Array<{
            assigneeId: string;
            name: string;
            type: 'user' | 'business';
            data: Array<{ key: string; value: unknown }>;
          }> = [];

          const multi: { dynamicForm: DynamicForm; assigneeId: string }[] = [];
          for (let i = 0; i < ids.length; i++) {
            const entity = allEntities[i];
            if (!entity) continue;
            const arr = dataArrays[i] ?? [];

            // Format prefill data for display (per entity, no merging)
            const formattedData = arr.map(item => {
              // Handle dates
              if (
                item.key.toLocaleLowerCase().includes('date') &&
                typeof item.value === 'number'
              ) {
                return {
                  key: item.key,
                  value: TimeUtil.convertSecondTimestampToDate(
                    item.value
                  ).toLocaleDateString(),
                };
              }

              // Handle SSN
              if (
                item.key.toLocaleLowerCase().includes('ssn') &&
                typeof item.value === 'string'
              ) {
                return {
                  key: item.key,
                  value: formatSSN(item.value),
                };
              }

              // Handle fields - show label instead of value
              const field = this.fields().find(f => f.name === item.key);
              if (
                field &&
                field.parameters?.options &&
                typeof item.value === 'string'
              ) {
                const option = field.parameters.options.find(
                  opt => String(opt.value) === item.value
                );
                if (option) {
                  return {
                    key: item.key,
                    value: option.label,
                  };
                }
              }

              return { key: item.key, value: item.value };
            });

            prefillDisplayData.push({
              assigneeId: entity.id,
              name: entity.name,
              type: entity.type,
              data: formattedData,
            });

            // Build form for this entity
            const prefillData: DynamicFormData = {};
            for (const item of arr) {
              prefillData[item.key] = item.value;
            }
            const form = this.buildFormStructure(false, prefillData);
            if (form) {
              multi.push({ dynamicForm: form, assigneeId: entity.id });
            }
          }

          this.prefillDataDisplay.set(prefillDisplayData);
          this.dynamicFormsWithAssigneeId.set(multi);
          this.selectedUserIds.set([...ids]);
          const roleById = new Map<string, RequestUserRoles>();
          for (const id of ids) {
            roleById.set(id, RequestUserRoles.BORROWER);
          }
          this.assigneeSimulatorRoles.set(roleById);
          this.refreshProductDisplay();
        },
      });
  }

  getSimulatorRoleForAssignee(assigneeId: string): RequestUserRoles {
    return (
      this.assigneeSimulatorRoles().get(assigneeId) ??
      RequestUserRoles.BORROWER
    );
  }

  onSimulatorAssigneeRoleChange(
    assigneeId: string,
    role: RequestUserRoles
  ): void {
    const next = new Map(this.assigneeSimulatorRoles());
    next.set(assigneeId, role);
    this.assigneeSimulatorRoles.set(next);
    this.refreshProductDisplay();
  }
}
