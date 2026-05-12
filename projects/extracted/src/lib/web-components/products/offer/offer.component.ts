import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { forkJoin, Subject, switchMap, takeUntil } from 'rxjs';
import { AvatarComponent } from '../../../design-system';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { ConfirmationRequiredDirective } from '../../../directives/confirmation-required/confirmation-required.directive';
import type { DynamicForm } from '../../../dynamic-forms/models/dynamic-forms.models';
import type {
  Product,
  ProductDisplay,
  ProductSectionDisplay,
  Program,
} from '../../../models/products/products.model';
import {
  QualifyingEnum,
  RuleTypeKeyEnum,
} from '../../../models/products/products.model';
import {
  RequestUser,
  RequestUserRoles,
  type Request,
} from '../../../models/requestModels';
import { DynamicFormService } from '../../../services/documents/dynamic-form.service';
import type { Field } from '../../../services/products/fields/fields.models';
import { FieldsService } from '../../../services/products/fields/fields.service';
import type { Offer, Subline } from '../../../services/products/offers.service';
import { ProductsService } from '../../../services/products/products.service';
import { WorkflowService } from '../../../services/workflows-api/workflow.service';
import { getProfileFromRequestUser } from '../../../utils/entityUtil';
import { sortRequestUsers } from '../../../utils/requestUtils/request-users-sort';
import { formatDate, readableDateFromTimestamp } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';
import { AUTO_RULE_CALLOUTS } from '../auto-rule-check-copy';
import { ProductEligibilityComponent } from '../product-eligibility/product-eligibility';
import {
  calculateInterestRateStepDisplay,
  getProductDisplay,
} from '../products.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-offer',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    AvatarComponent,
    LjButtonComponent,
    ActivateDirective,
    ConfirmationRequiredDirective,
    ProductEligibilityComponent,
  ],
  templateUrl: './offer.component.html',
  styleUrls: ['./offer.component.scss'],
})
export class OfferComponent implements OnInit, OnDestroy {
  readableDateFromTimestamp = readableDateFromTimestamp;
  formatDate = formatDate;
  private productsService = inject(ProductsService);
  private dynamicFormService = inject(DynamicFormService);
  private workflowService = inject(WorkflowService);
  private fieldsService = inject(FieldsService);

  // Expose enums to template
  QualifyingEnum = QualifyingEnum;
  RuleTypeKeyEnum = RuleTypeKeyEnum;

  protected readonly callouts = AUTO_RULE_CALLOUTS;

  offer = input.required<Offer>();
  request = input.required<Request>();

  // Local request with sections loaded
  requestWithSections = signal<Request | null>(null);
  viewOnly = input<boolean>(false);
  readonly onOfferChange = output<Offer>();

  programs = signal<Program[]>([]);
  selectedProgramId = signal<string | null>(null); // Only set when "Save selection" is clicked
  previewedProgramId = signal<string | null>(null); // Set when clicking on a program card

  // Dynamic forms data
  dynamicFormsWithAssigneeId = signal<
    { dynamicForm: DynamicForm; assigneeId: string; userRole?: RequestUserRoles }[]
  >([]);
  fields = signal<Field[]>([]);
  destroy$ = new Subject<void>();

  // Expandable sections state
  facilityExpanded = signal<boolean>(false);
  termsExpanded = signal<boolean>(false);
  showSublines = signal<boolean>(false);

  // Sublines state
  sublines = signal<Subline[]>([]);
  sublineProducts = signal<Product[]>([]); // Products from selected program
  sublinePreviewedProducts = signal<Map<string, string>>(new Map()); // Track previewed product per subline
  sublineSaved = signal<Map<string, boolean>>(new Map()); // Track if subline has been saved (collapsed state)
  sublineExpanded = signal<Map<string, boolean>>(new Map()); // Track if saved subline is expanded

  // Pre-calculate ProductDisplay for all programs
  programsWithDisplay = computed(() => {
    const programs = this.programs();
    const selectedUserIds = Array.from(this.selectedUserIds());
    const dynamicFormsWithAssigneeId = this.dynamicFormsWithAssigneeId();
    const fields = this.fields();

    return programs.map(program => {
      const productDisplay = getProductDisplay(
        program,
        undefined,
        selectedUserIds,
        dynamicFormsWithAssigneeId,
        fields
      );

      return {
        program,
        productDisplay,
      };
    });
  });

  // Pre-calculate ProductDisplay for all products in sublineProducts
  productsWithDisplay = computed(() => {
    const products = this.sublineProducts();
    const programs = this.programs();
    const selectedUserIds = Array.from(this.selectedUserIds());
    const dynamicFormsWithAssigneeId = this.dynamicFormsWithAssigneeId();
    const fields = this.fields();

    return products.map(product => {
      const program = programs.find(p => p.id === product.parentId);
      if (!program) {
        return {
          product,
          productDisplay: undefined,
        };
      }
      const productDisplay = getProductDisplay(
        program,
        product,
        selectedUserIds,
        dynamicFormsWithAssigneeId,
        fields
      );

      return {
        product,
        productDisplay,
      };
    });
  });

  // Sorted products by eligibility: eligible first, then potentially eligible, then not eligible
  sortedSublineProducts = computed(() => {
    const productsWithDisplay = this.productsWithDisplay();
    if (productsWithDisplay.length === 0) {
      return [];
    }

    // Define qualifying order priority
    const qualifyingOrder: Record<QualifyingEnum, number> = {
      [QualifyingEnum.QUALIFYING]: 1,
      [QualifyingEnum.MISSING]: 2,
      [QualifyingEnum.NOT_QUALIFYING]: 3,
    };

    const sorted = [...productsWithDisplay].sort((a, b) => {
      // Get qualifying for each product from the eligibility section
      const sectionA = a.productDisplay?.sections.find(
        section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
      ) ?? {
        type: RuleTypeKeyEnum.ELIGIBILITY_RULES,
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        categories: [],
      };
      const sectionB = b.productDisplay?.sections.find(
        section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
      ) ?? {
        type: RuleTypeKeyEnum.ELIGIBILITY_RULES,
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        categories: [],
      };
      const orderA = qualifyingOrder[sectionA.qualifying] ?? 999;
      const orderB = qualifyingOrder[sectionB.qualifying] ?? 999;
      return orderA - orderB;
    });

    // Return just the products, not the display objects
    return sorted.map(p => p.product);
  });

  // Filter out loan officers from request users
  displayUsers = computed(() => {
    const request = this.requestWithSections() || this.request();
    const users = request.users.filter(
      user =>
        user.userRole !== RequestUserRoles.LOAN_OFFICER &&
        user.userRole !== RequestUserRoles.COLLABORATOR &&
        user.userRole !== RequestUserRoles.INTERNAL
    );

    return sortRequestUsers(users);
  });

  selectedProgram = computed(() => {
    const selectedId = this.selectedProgramId();
    if (!selectedId) return undefined;
    return this.programs().find(p => p.id === selectedId);
  });

  // Sort programs by eligibility: eligible first, potentially-eligible second, not-eligible third
  sortedPrograms = computed(() => {
    const programsWithDisplay = this.programsWithDisplay();

    // Define qualifying order priority
    const qualifyingOrder: Record<QualifyingEnum, number> = {
      [QualifyingEnum.QUALIFYING]: 1,
      [QualifyingEnum.MISSING]: 2,
      [QualifyingEnum.NOT_QUALIFYING]: 3,
    };

    const sorted = [...programsWithDisplay].sort((a, b) => {
      const sectionA = a.productDisplay.sections.find(
        section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
      ) ?? {
        type: RuleTypeKeyEnum.ELIGIBILITY_RULES,
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        categories: [],
      };
      const sectionB = b.productDisplay.sections.find(
        section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
      ) ?? {
        type: RuleTypeKeyEnum.ELIGIBILITY_RULES,
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        categories: [],
      };
      const orderA = qualifyingOrder[sectionA.qualifying] ?? 999;
      const orderB = qualifyingOrder[sectionB.qualifying] ?? 999;
      return orderA - orderB;
    });

    // Return just the programs, not the display objects
    return sorted.map(p => p.program);
  });

  ngOnInit(): void {
    this.loadPrograms();
    this.checkAndLoadSections();
  }

  private checkAndLoadSections(): void {
    const request = this.request();
    if (!request?.id) {
      return;
    }

    // If request already has sections, use it directly
    if (request.sections && request.sections.length > 0) {
      this.requestWithSections.set(request);
      this.loadDynamicForms();
      return;
    }

    // Otherwise, load sections from the API
    this.workflowService.getSectionsForRequest(request.id).subscribe({
      next: sections => {
        // Update the request with sections
        const requestWithSections = {
          ...request,
          sections: sections,
        };
        this.requestWithSections.set(requestWithSections);
        this.loadDynamicForms();
      },
      error: (_error: unknown) => {
        // Fallback to original request even if sections load fails
        this.requestWithSections.set(request);
        this.loadDynamicForms();
      },
    });
  }

  private loadSublines(): void {
    const currentOffer = this.offer();
    if (currentOffer?.sublines) {
      this.sublines.set(currentOffer.sublines);
      // Initialize previewed state, saved state, and expanded state
      const previewed = new Map<string, string>();
      const saved = new Map<string, boolean>();
      const expanded = new Map<string, boolean>();
      currentOffer.sublines.forEach(subline => {
        if (subline.product) {
          previewed.set(subline.id, subline.product.id ?? '');
          // If subline has a product, assume it's saved (collapsed by default)
          saved.set(subline.id, true);
          expanded.set(subline.id, false);
        }
      });
      this.sublinePreviewedProducts.set(previewed);
      this.sublineSaved.set(saved);
      this.sublineExpanded.set(expanded);

      // Show sublines if they exist
      if (currentOffer.sublines.length > 0) {
        this.showSublines.set(true);
        const selectedProgram = this.selectedProgram();
        if (selectedProgram) {
          this.loadProductsForProgram(selectedProgram.id ?? '');
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPrograms(): void {
    const currentOffer = this.offer();
    const isViewOnly = this.viewOnly();

    if (isViewOnly && currentOffer?.program) {
      // In view-only mode, use the program from the offer if it exists
      this.programs.set([currentOffer.program]);
      this.updateSelectedProgram();
      this.loadSublines();
    } else {
      // In edit mode (not view-only), always load all programs from service
      this.productsService.getAllPrograms().subscribe({
        next: programs => {
          this.programs.set(programs);
          this.updateSelectedProgram();
          this.loadSublines();
          this.loadFields();
        },
      });
    }
  }

  private loadFields(): void {
    const programs = this.programs();
    const allProducts = programs.flatMap(program => program.products ?? []);

    // Collect all unique field IDs from program rules and product rules
    const programFieldIds = programs.flatMap(program =>
      (program.rules ?? [])
        .map(rule => rule.fieldId)
        .filter((fieldId): fieldId is string => Boolean(fieldId))
    );

    const productFieldIds = allProducts.flatMap(product =>
      (product.rules ?? [])
        .map(rule => rule.fieldId)
        .filter((fieldId): fieldId is string => Boolean(fieldId))
    );

    // Get unique field IDs
    const uniqueFieldIds = Array.from(
      new Set([...programFieldIds, ...productFieldIds])
    );

    // If no field IDs, set empty array and return
    if (uniqueFieldIds.length === 0) {
      this.fields.set([]);
      return;
    }

    this.fieldsService
      .getBulkFields(uniqueFieldIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: fields => {
          this.fields.set(fields);
        },
      });
  }

  private updateSelectedProgram(): void {
    const currentOffer = this.offer();
    const programs = this.programs();

    if (currentOffer?.program?.id && programs.length > 0) {
      const programId = currentOffer.program.id;
      const programExists = programs.some(p => p.id === programId);
      if (programExists) {
        this.selectedProgramId.set(programId);
        this.previewedProgramId.set(null);

        if (
          this.offer().desiredCreditLimit &&
          this.offer().originationDate &&
          this.offer().targetedMaturity
        ) {
          this.showSublines.set(true);
        }
      }
    } else {
      this.selectedProgramId.set(null);
      this.previewedProgramId.set(null);
    }
  }

  private loadDynamicForms(): void {
    if (this.viewOnly()) {
      return;
    }

    const request = this.requestWithSections() || this.request();
    if (!request?.sections) {
      return;
    }

    // Collect all dynamic form attachments from all sections
    const formAttachments: Array<{
      id: string;
      digest: string;
      assigneeId: string;
    }> = [];

    for (const section of request.sections) {
      for (const task of section.tasks ?? []) {
        for (const attachment of task.attachments ?? []) {
          if (
            attachment.type === 'DYNAMIC_FORM' &&
            attachment.documentId &&
            attachment.digest
          ) {
            // Get assigneeId from section (tasks don't have assigneeId directly)
            formAttachments.push({
              id: attachment.documentId,
              digest: attachment.digest,
              assigneeId: section.assigneeId ?? '',
            });
          }
        }
      }
    }

    if (formAttachments.length === 0) {
      return;
    }

    // Load all dynamic forms
    forkJoin(
      formAttachments.map(attachment =>
        this.dynamicFormService
          .getDynamicForm(attachment.id, attachment.digest)
          .pipe(
            switchMap(form => {
              const user = request.users?.find(
                u => u.userId === attachment.assigneeId
              );
              return Promise.resolve({
                dynamicForm: form,
                assigneeId: attachment.assigneeId,
                ...(user?.userRole !== undefined
                  ? { userRole: user.userRole }
                  : {}),
              });
            })
          )
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: forms => {
          this.dynamicFormsWithAssigneeId.set(forms);
        },
      });
  }

  selectProgram(programId: string): void {
    const program = this.programs().find(p => p.id === programId);
    if (program?.disabled) return;
    this.previewedProgramId.set(programId);
  }

  deselectProgram(): void {
    this.selectedProgramId.set(null);
    this.previewedProgramId.set(null);
    this.showSublines.set(false);
    this.onOfferChange.emit({
      ...this.offer(),
      program: undefined,
      sublines: [],
    });
  }

  isProgramSelected = computed(() => {
    return this.selectedProgramId() !== null;
  });

  getUserProfile(user: RequestUser) {
    return getProfileFromRequestUser(user);
  }

  getUserDisplayName(user: RequestUser): string {
    const profile = this.getUserProfile(user);
    return profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : (profile.firstName ?? profile.lastName ?? user.email ?? '');
  }

  getUserRoleLabel(user: RequestUser): string {
    switch (user.userRole) {
      case RequestUserRoles.BORROWER:
        return 'Main Borrower';
      case RequestUserRoles.CO_BORROWER:
        return 'Co-borrower';
      case RequestUserRoles.GUARANTOR:
        return 'Guarantor';
      default:
        return user.userRole ?? '';
    }
  }

  saveSelection(): void {
    const previewedId = this.previewedProgramId();
    if (!previewedId) {
      return; // No program previewed, nothing to save
    }

    // Set the selected program ID to show the details
    this.selectedProgramId.set(previewedId);

    const selectedProgram = this.programs().find(p => p.id === previewedId);
    this.onOfferChange.emit({
      ...this.offer(),
      program: selectedProgram,
    });
  }

  saveMasterLine(): void {
    // Collapse facility and terms panels
    this.facilityExpanded.set(false);
    this.termsExpanded.set(false);

    // Show sublines section
    this.showSublines.set(true);

    // Load products from selected program
    const selectedProgram = this.selectedProgram();
    if (selectedProgram) {
      this.loadProductsForProgram(selectedProgram.id ?? '');
    }

    // If no sublines exist, create a default one
    if (this.sublines().length === 0) {
      this.addSubline();
    }

    // Save the offer
    this.onOfferChange.emit(this.offer());
  }

  private loadProductsForProgram(programId: string): void {
    const isViewOnly = this.viewOnly();

    if (isViewOnly) {
      // In view-only mode, check if any sublines already have associated products
      const sublinesWithProducts = this.sublines().filter(s => s.product);

      if (sublinesWithProducts.length > 0) {
        // Use products from sublines
        const productsFromSublines = sublinesWithProducts
          .map(s => s.product)
          .filter((p): p is Product => p !== undefined)
          .filter(
            (p, index, self) => index === self.findIndex(pr => pr.id === p.id)
          ); // Remove duplicates

        this.sublineProducts.set(productsFromSublines);
        return;
      }
    }

    // In edit mode (not view-only) or if no products in sublines, get products from the selected program
    const selectedProgram = this.programs().find(p => p.id === programId);
    if (selectedProgram?.products) {
      this.sublineProducts.set(selectedProgram.products);
    } else {
      this.sublineProducts.set([]);
    }
  }

  addSubline(): void {
    const newSubline: Subline = {
      id: `subline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      product: undefined,
    };
    this.sublines.update(sublines => [...sublines, newSubline]);

    // Update offer
    this.onOfferChange.emit({
      ...this.offer(),
      sublines: this.sublines(),
    });
  }

  removeSubline(sublineId: string): void {
    this.sublines.update(sublines => sublines.filter(s => s.id !== sublineId));

    // Clean up previewed state
    const previewed = new Map(this.sublinePreviewedProducts());
    previewed.delete(sublineId);
    this.sublinePreviewedProducts.set(previewed);

    // Update offer
    this.onOfferChange.emit({
      ...this.offer(),
      sublines: this.sublines(),
    });
  }

  selectProductForSubline(sublineId: string, productId: string): void {
    const product = this.sublineProducts().find(p => p.id === productId);
    if (product?.disabled) return;
    const previewed = new Map(this.sublinePreviewedProducts());
    previewed.set(sublineId, productId);
    this.sublinePreviewedProducts.set(previewed);
  }

  saveSublineSelection(sublineId: string): void {
    const previewedId = this.sublinePreviewedProducts().get(sublineId);
    if (!previewedId) {
      return;
    }

    // Find the product object
    const product = this.sublineProducts().find(p => p.id === previewedId);
    if (!product) {
      return;
    }

    // Update subline in array with the full product object
    this.sublines.update(sublines =>
      sublines.map(s => (s.id === sublineId ? { ...s, product } : s))
    );

    // Update offer
    this.onOfferChange.emit({
      ...this.offer(),
      sublines: this.sublines(),
    });
  }

  saveSubline(sublineId: string): void {
    // Generate core sub-account number if it doesn't exist
    this.sublines.update(sublines =>
      sublines.map(s => {
        if (s.id === sublineId && !s.coreSubAccountNumber) {
          // Generate 10 random digits
          const digits = Array.from({ length: 10 }, () =>
            Math.floor(Math.random() * 10)
          ).join('');
          return { ...s, coreSubAccountNumber: digits };
        }
        return s;
      })
    );

    // Mark subline as saved (collapsed state)
    const saved = new Map(this.sublineSaved());
    saved.set(sublineId, true);
    this.sublineSaved.set(saved);

    // Collapse the saved subline
    const expanded = new Map(this.sublineExpanded());
    expanded.set(sublineId, false);
    this.sublineExpanded.set(expanded);

    // Update offer
    this.onOfferChange.emit({
      ...this.offer(),
      sublines: this.sublines(),
    });
  }

  toggleSublineExpansion(sublineId: string): void {
    const expanded = new Map(this.sublineExpanded());
    expanded.set(sublineId, !(expanded.get(sublineId) || false));
    this.sublineExpanded.set(expanded);
  }

  isSublineSaved(sublineId: string): boolean {
    return this.sublineSaved().get(sublineId) || false;
  }

  isSublineExpanded(sublineId: string): boolean {
    return this.sublineExpanded().get(sublineId) || false;
  }

  deselectProduct(sublineId: string): void {
    // Remove the product from the subline
    this.sublines.update(sublines =>
      sublines.map(s => (s.id === sublineId ? { ...s, product: undefined } : s))
    );

    // Clear the previewed product state for this subline
    const previewed = new Map(this.sublinePreviewedProducts());
    previewed.delete(sublineId);
    this.sublinePreviewedProducts.set(previewed);

    // Clear saved and expanded state
    const saved = new Map(this.sublineSaved());
    saved.delete(sublineId);
    this.sublineSaved.set(saved);

    const expanded = new Map(this.sublineExpanded());
    expanded.delete(sublineId);
    this.sublineExpanded.set(expanded);

    // Update offer
    this.onOfferChange.emit({
      ...this.offer(),
      sublines: this.sublines(),
    });
  }

  updateSublineLimit(sublineId: string, limit: number | undefined): void {
    this.sublines.update(sublines =>
      sublines.map(s =>
        s.id === sublineId ? { ...s, sublineLimit: limit } : s
      )
    );

    // Update offer
    this.onOfferChange.emit({
      ...this.offer(),
      sublines: this.sublines(),
    });
  }

  isProductPreviewedForSubline(sublineId: string, productId: string): boolean {
    return this.sublinePreviewedProducts().get(sublineId) === productId;
  }

  toggleFacility(): void {
    this.facilityExpanded.set(!this.facilityExpanded());
  }

  toggleTerms(): void {
    this.termsExpanded.set(!this.termsExpanded());
  }

  onCreditLimitChange(value: string): void {
    // Remove $ and commas, then parse to number
    const cleaned = value.replace(/[$,]/g, '');
    const numValue = cleaned ? parseFloat(cleaned) : null;
    this.onOfferChange.emit({
      ...this.offer(),
      desiredCreditLimit: numValue ?? undefined,
    });
  }

  onMaturityChange(event: { value: Date | null }): void {
    if (event.value) {
      this.onOfferChange.emit({
        ...this.offer(),
        targetedMaturity: event.value ?? undefined,
      });
    }
  }

  onOriginationDateChange(event: { value: Date | null }): void {
    if (event.value) {
      this.onOfferChange.emit({
        ...this.offer(),
        originationDate: event.value ?? undefined,
      });
    }
  }

  onSublineLimitChange(sublineId: string, value: string): void {
    // Remove $ and commas, then parse to number
    const cleaned = value.replace(/[$,]/g, '');
    const numValue = cleaned ? parseFloat(cleaned) : undefined;
    this.updateSublineLimit(sublineId, numValue);
  }

  // Get selected user IDs from request users (excluding loan officers and collaborators)
  selectedUserIds = computed(() => {
    const users = this.displayUsers();
    return new Set(
      users.map(u => u.userId).filter((id): id is string => Boolean(id))
    );
  });

  // Get program display (looks up from pre-calculated displays)
  getProgramDisplay(program: Program): ProductDisplay {
    if (!program?.id) {
      return {
        programName: '',
        productName: '',
        rateDisplay: '',
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        sections: [],
        wordDisplay: 'Qualifying',
      };
    }

    // Look up from pre-calculated displays
    const programWithDisplay = this.programsWithDisplay().find(
      p => p.program.id === program.id
    );
    return (
      programWithDisplay?.productDisplay ?? {
        programName: '',
        productName: '',
        rateDisplay: '',
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        sections: [],
        wordDisplay: 'Qualifying',
      }
    );
  }

  // Get product display (looks up from pre-calculated displays)
  getProductDisplay(product: Product): ProductDisplay {
    // Look up from pre-calculated displays
    const productWithDisplay = this.productsWithDisplay().find(
      p => p.product.id === product.id
    );
    return (
      productWithDisplay?.productDisplay ?? {
        programName: '',
        productName: product.name,
        rateDisplay: '',
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        sections: [],
        wordDisplay: 'Qualifying',
      }
    );
  }

  // Facility & Identification field getters
  getMasterlineId(): string {
    const currentOffer = this.offer();
    return currentOffer?.masterLineId || '-';
  }

  getCoreMasterAccountNumber(): string {
    const currentOffer = this.offer();
    return currentOffer?.coreMasterAccountNumber || '-';
  }

  getMainBorrowerLegalName(): string {
    const request = this.request();
    // Get from request users (borrower)
    const borrower = request?.users?.find(
      u => u.userRole === RequestUserRoles.BORROWER
    );
    if (borrower) {
      return this.getUserDisplayName(borrower);
    }

    return '-';
  }

  getMainBorrowerId(): string {
    const request = this.request();
    // TODO: Get from request or user data
    const borrower = request?.users?.find(
      u => u.userRole === RequestUserRoles.BORROWER
    );
    return borrower?.userId ? borrower.userId : '-';
  }

  getProgramCode(): string {
    const program = this.selectedProgram();
    return (
      program?.productCode ||
      (program?.name ? program.name.toUpperCase().replace(/\s+/g, '-') : '-')
    );
  }

  // Terms & Limits field getters
  getFacilityCommitmentAmount(): string {
    const offer = this.offer();
    if (offer?.desiredCreditLimit) {
      return `$${offer.desiredCreditLimit.toLocaleString()}`;
    }
    return '-';
  }

  getCurrency(): string {
    const program = this.selectedProgram();
    return program?.currency || 'USD';
  }

  getOriginationDate(): string {
    const offer = this.offer();
    if (offer?.originationDate) {
      const date = new Date(offer.originationDate);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
    return '-';
  }

  getMaturityDate(): string {
    const offer = this.offer();
    if (offer?.targetedMaturity) {
      const date = new Date(offer.targetedMaturity);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
    return '-';
  }

  getRevolving(): string {
    const program = this.selectedProgram();
    return program?.revolving ? 'Yes' : 'No';
  }

  getRepaymentStructure(): string {
    const program = this.selectedProgram();
    return program?.repaymentStructure || 'Single-Pay at Maturity';
  }

  getPaymentFrequency(): string {
    const program = this.selectedProgram();
    return program?.paymentFrequency || 'At Maturity';
  }

  getProductRateDisplay(product: Product): string {
    return calculateInterestRateStepDisplay(product.interestRateSteps);
  }

  getProductDisplaySection(product: Product): ProductSectionDisplay {
    return (
      this.getProductDisplay(product).sections.find(
        section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
      ) ?? {
        type: RuleTypeKeyEnum.ELIGIBILITY_RULES,
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        categories: [],
      }
    );
  }

  getProgramDisplaySection(program: Program): ProductSectionDisplay {
    return (
      this.getProgramDisplay(program).sections.find(
        section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
      ) ?? {
        type: RuleTypeKeyEnum.ELIGIBILITY_RULES,
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        categories: [],
      }
    );
  }
}
