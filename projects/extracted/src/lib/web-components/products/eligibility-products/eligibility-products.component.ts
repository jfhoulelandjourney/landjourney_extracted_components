import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, map } from 'rxjs';
import { AvatarComponent } from '../../../design-system';
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
  Request,
  RequestUser,
  RequestUserRoles,
} from '../../../models/requestModels';
import { AttachmentTypes } from '../../../models/sectionModels';
import { DynamicFormService } from '../../../services/documents/dynamic-form.service';
import { ProductsService } from '../../../services/products/products.service';

import type { Field } from '../../../services/products/fields/fields.models';
import { FieldsService } from '../../../services/products/fields/fields.service';
import { getProfileFromRequestUser } from '../../../utils/entityUtil';

import { AUTO_RULE_CALLOUTS } from '../auto-rule-check-copy';
import { ProductEligibilityComponent } from '../product-eligibility/product-eligibility';
import { getProductDisplay } from '../products.utils';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-eligibility-products',
  imports: [
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule,
    MatExpansionModule,
    AvatarComponent,
    ProductEligibilityComponent,
  ],
  templateUrl: './eligibility-products.component.html',
  styleUrls: ['./eligibility-products.component.scss'],
})
export class EligibilityProductsComponent implements OnInit {
  readonly fieldsService = inject(FieldsService);
  readonly dynamicFormsService = inject(DynamicFormService);
  readonly productsService = inject(ProductsService);

  readonly onClose = output<void>();
  isVisible = input<boolean>(false);
  request = input.required<Request>();

  // Expose enums to template
  QualifyingEnum = QualifyingEnum;
  RuleTypeKeyEnum = RuleTypeKeyEnum;

  protected readonly callouts = AUTO_RULE_CALLOUTS;

  // Compute borrowers from request users
  protected borrowers = computed(() => {
    return (
      this.request()?.users.filter(
        user =>
          user.userRole === RequestUserRoles.BORROWER ||
          user.userRole === RequestUserRoles.CO_BORROWER
      ) ?? []
    );
  });

  // Compute guarantors from request users
  protected guarantors = computed(() => {
    return (
      this.request()?.users.filter(
        user => user.userRole === RequestUserRoles.GUARANTOR
      ) ?? []
    );
  });

  // Track deselected user IDs (all users are selected by default)
  deselectedUserIds = signal<Set<string>>(new Set());

  // Compute selected user IDs - all users except deselected ones
  selectedUserIds = computed(() => {
    const allUsers = [...this.borrowers(), ...this.guarantors()];
    const deselected = this.deselectedUserIds();
    const selected = new Set<string>();

    for (const user of allUsers) {
      if (user.userId && !deselected.has(user.userId)) {
        selected.add(user.userId);
      }
    }

    return selected;
  });

  dynamicFormsWithAssigneeId = signal<
    {
      dynamicForm: DynamicForm;
      assigneeId: string;
      userRole?: RequestUserRoles;
    }[]
  >([]);

  programs = signal<Program[]>([]);
  fields = signal<Field[]>([]);
  allProducts = signal<Product[]>([]);
  loaded = signal<boolean>(false);

  // Compute ProductDisplay for all products
  productsWithDisplay = computed(() => {
    const products = this.allProducts();
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
        productDisplay: { ...productDisplay, wordDisplay: 'Eligible' },
      };
    });
  });

  // Computed products based on eligibility
  eligibleProducts = computed(() => {
    return this.productsWithDisplay()
      .filter(
        ({ productDisplay }) =>
          productDisplay?.sections.find(
            section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
          )?.qualifying === QualifyingEnum.QUALIFYING
      )
      .map(({ product }) => product);
  });

  potentiallyEligibleProducts = computed(() => {
    return this.productsWithDisplay()
      .filter(
        ({ productDisplay }) =>
          productDisplay?.sections.find(
            section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
          )?.qualifying === QualifyingEnum.MISSING
      )
      .map(({ product }) => product);
  });

  notEligibleProducts = computed(() => {
    return this.productsWithDisplay()
      .filter(
        ({ productDisplay }) =>
          productDisplay?.sections.find(
            section => section.type === RuleTypeKeyEnum.ELIGIBILITY_RULES
          )?.qualifying === QualifyingEnum.NOT_QUALIFYING
      )
      .map(({ product }) => product);
  });

  ngOnInit() {
    this.loadPrograms();
    this.loadDynamicForms();
  }

  private loadPrograms() {
    this.productsService.getAllPrograms().subscribe({
      next: programs => {
        const activePrograms = programs.filter(p => !p.disabled);
        this.programs.set(activePrograms);
        const allProducts = activePrograms.flatMap(p =>
          p.products.filter(prod => !prod.disabled)
        );
        this.allProducts.set(allProducts);
        this.loaded.set(true);
        this.loadFields();
      },
      error: () => {
        this.loaded.set(true);
      },
    });
  }

  private loadDynamicForms() {
    const request = this.request();

    // Compute dynamic form IDs and digests from request
    if (!request?.sections) {
      this.dynamicFormsWithAssigneeId.set([]);
      return;
    }

    const idsAndDigests = request.sections.flatMap(section => {
      return section.tasks.flatMap(task => {
        return task.attachments
          .filter(attachment => {
            return (
              attachment.type === AttachmentTypes.DYNAMIC_FORM &&
              attachment.documentId
            );
          })
          .map(attachment => {
            return {
              id: attachment.documentId as string,
              digest: attachment.digest as string,
              assigneeId: section.assigneeId ?? '',
            };
          });
      });
    });

    if (idsAndDigests.length === 0) {
      this.dynamicFormsWithAssigneeId.set([]);
      return;
    }

    forkJoin(
      idsAndDigests.map(idAndDigest =>
        this.dynamicFormsService
          .getDynamicForm(idAndDigest.id, idAndDigest.digest)
          .pipe(
            map(dynamicForm => {
              const assigneeId = idAndDigest.assigneeId;
              const user = request.users?.find(u => u.userId === assigneeId);
              return {
                dynamicForm,
                assigneeId,
                ...(user?.userRole !== undefined
                  ? { userRole: user.userRole }
                  : {}),
              };
            })
          )
      )
    ).subscribe({
      next: results => {
        this.dynamicFormsWithAssigneeId.set(
          results as Array<{
            dynamicForm: DynamicForm;
            assigneeId: string;
            userRole?: RequestUserRoles;
          }>
        );
      },
    });
  }

  private loadFields() {
    // Collect all unique field IDs from program rules and product rules
    const programFieldIds = this.programs().flatMap(program =>
      (program.rules ?? [])
        .map(rule => rule.fieldId)
        .filter((fieldId): fieldId is string => Boolean(fieldId))
    );

    const productFieldIds = this.allProducts().flatMap(product =>
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

    this.fieldsService.getBulkFields(uniqueFieldIds).subscribe({
      next: fields => {
        this.fields.set(fields);
      },
    });
  }

  onCloseClick() {
    this.onClose.emit();
  }

  onUserToggle(user: RequestUser) {
    const userId = user.userId;
    if (!userId) return;

    const deselected = new Set(this.deselectedUserIds());
    if (deselected.has(userId)) {
      // Currently deselected, so select it (remove from deselected)
      deselected.delete(userId);
    } else {
      // Currently selected, so deselect it (add to deselected)
      deselected.add(userId);
    }
    this.deselectedUserIds.set(deselected);
  }

  isUserSelected(user: RequestUser): boolean {
    return user.userId ? this.selectedUserIds().has(user.userId) : false;
  }

  getFullName(user: RequestUser): string {
    const profile = getProfileFromRequestUser(user);
    return `${profile.firstName} ${profile.lastName}`;
  }

  getProductDisplay(product: Product): ProductDisplay {
    // Look up the stored ProductDisplay from productsWithDisplay
    const productWithDisplay = this.productsWithDisplay().find(
      ({ product: p }) => p.id === product.id
    );
    return (
      productWithDisplay?.productDisplay ?? {
        programName: '',
        productName: product.name,
        rateDisplay: '',
        qualifying: QualifyingEnum.NOT_QUALIFYING,
        sections: [],
        wordDisplay: 'Eligible',
      }
    );
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
}
