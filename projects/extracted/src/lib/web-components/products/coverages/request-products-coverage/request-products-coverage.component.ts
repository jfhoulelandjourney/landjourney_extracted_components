import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  catchError,
  forkJoin,
  map,
  merge,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import { fetchFieldNamesRecursively } from '../../../../dynamic-forms/utilities/dynamicFormsUtil';
import { isScorecardTotalRuleFieldId } from '../../../../models/products/product-rule-system-fields';
import {
  RuleTypeKeyEnum,
  type Product,
  type Program,
  type ScoreCardCriteria,
} from '../../../../models/products/products.model';
import {
  type RequestUserRoles,
} from '../../../../models/requestModels';
import { AttachmentTypes } from '../../../../models/sectionModels';
import { DynamicFormService } from '../../../../services/documents/dynamic-form.service';
import type { Field } from '../../../../services/products/fields/fields.models';
import { FieldsService } from '../../../../services/products/fields/fields.service';
import { ProductsService } from '../../../../services/products/products.service';
import { ProductComponent } from '../../product/product.component';
import {
  displayProductForCoverage,
  ruleAppliesToParticipantRoles,
} from '../../products.utils';

/**
 * Minimal section shape for coverage checks. Compatible with Section (sectionModels)
 * and store section types (e.g. RequestSectionWithTasks).
 */
export interface SectionForCoverage {
  id?: string;
  tasks?: Array<{
    attachments?: Array<{
      type: string;
      documentId?: string;
      digest?: string;
      isTemplate?: boolean;
    }>;
  }>;
}

export interface ProductCoverageEntry {
  product: Product;
  program: Program;
  compliant: boolean;
  missingFieldNames: string[];
  idToName: Map<string, string>;
}

@Component({
  selector: 'lj-request-products-coverage',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressSpinnerModule,
    ProductComponent,
    ActivateDirective,
  ],
  templateUrl: './request-products-coverage.component.html',
  styleUrl: './request-products-coverage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestProductsCoverageComponent implements OnDestroy {
  protected readonly RuleTypeKeyEnum = RuleTypeKeyEnum;

  private productsService = inject(ProductsService);
  private fieldsService = inject(FieldsService);
  private dynamicFormService = inject(DynamicFormService);
  private destroy$ = new Subject<void>();
  private runCancel$ = new Subject<void>();

  sections = input.required<SectionForCoverage[]>();
  requestProducts = input.required<string[]>();
  participantRoles = input<RequestUserRoles[] | undefined>(undefined);
  readonly requestProductsChange = output<string[]>();

  loading = signal<boolean>(true);
  entries = signal<ProductCoverageEntry[]>([]);
  templateFieldNames = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      this.sections();
      this.participantRoles();
      this.runCoverageCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private runCoverageCheck(): void {
    this.runCancel$.next();
    const sections = this.sections();
    if (!sections?.length) {
      this.loading.set(false);
      this.entries.set([]);
      this.templateFieldNames.set(new Set());
      return;
    }

    this.loading.set(true);

    const participantRoles = this.participantRoles();
    const formRefs = this.collectDynamicFormRefs(sections);
    const templateFields$ =
      formRefs.length === 0
        ? of(new Set<string>())
        : forkJoin(
            formRefs.map(ref =>
              (ref.isTemplate
                ? this.dynamicFormService.getDynamicFormTemplate(
                    ref.documentId ?? ''
                  )
                : this.dynamicFormService.getDynamicForm(
                    ref.documentId ?? '',
                    ref.digest ?? ''
                  )
              ).pipe(
                map(form => fetchFieldNamesRecursively(form.formDefinition)),
                catchError(() => of([] as string[]))
              )
            )
          ).pipe(
            map((arr: string[][]) => new Set<string>(arr.flat())),
            catchError(() => of(new Set<string>()))
          );

    templateFields$
      .pipe(
        switchMap((templateNames: Set<string>) => {
          this.templateFieldNames.set(templateNames);
          return this.productsService.getAllPrograms().pipe(
            map((programs: Program[]) =>
              programs
                .filter(p => !p.disabled)
                .flatMap(program =>
                  (program.products ?? [])
                    .filter(prod => !prod.disabled)
                    .map(product => ({ product, program }))
                )
            ),
            switchMap(
              (products: Array<{ product: Product; program: Program }>) => {
                const fieldIds = this.collectAllFieldIds(
                  products,
                  participantRoles
                );
                if (fieldIds.length === 0) {
                  return of({
                    products,
                    idToName: new Map<string, string>(),
                  });
                }
                return this.fieldsService.getBulkFields(fieldIds).pipe(
                  map((fields: Field[]) => {
                    const idToName = new Map<string, string>();
                    for (const f of fields) {
                      if (f.id !== undefined && f.id !== null && f.name)
                        idToName.set(f.id, f.name);
                    }
                    return { products, idToName };
                  }),
                  catchError(() =>
                    of({ products, idToName: new Map<string, string>() })
                  )
                );
              }
            ),
            map(
              ({
                products,
                idToName,
              }: {
                products: Array<{ product: Product; program: Program }>;
                idToName: Map<string, string>;
              }) => {
                const names = this.templateFieldNames();
                return products.map(
                  ({
                    product,
                    program,
                  }: {
                    product: Product;
                    program: Program;
                  }) => {
                    const required = this.requiredFieldNamesForProduct(
                      product,
                      program,
                      idToName,
                      participantRoles
                    );
                    const missing = required.filter(n => !names.has(n));
                    return {
                      product,
                      program,
                      compliant: missing.length === 0,
                      missingFieldNames: missing,
                      idToName,
                    };
                  }
                );
              }
            )
          );
        }),
        takeUntil(merge(this.destroy$, this.runCancel$))
      )
      .subscribe({
        next: list => {
          this.entries.set(list);
          this.loading.set(false);
        },
        error: () => {
          this.entries.set([]);
          this.loading.set(false);
        },
      });
  }

  private collectDynamicFormRefs(
    sections: SectionForCoverage[]
  ): Array<{ documentId: string; digest?: string; isTemplate: boolean }> {
    const refs: Array<{
      documentId: string;
      digest?: string;
      isTemplate: boolean;
    }> = [];
    const seen = new Set<string>();
    for (const s of sections) {
      for (const t of s.tasks ?? []) {
        for (const a of t.attachments ?? []) {
          if (a.type !== AttachmentTypes.DYNAMIC_FORM || !a.documentId) {
            continue;
          }
          const isTemplate = a.isTemplate ?? false;
          const key = isTemplate
            ? a.documentId
            : `${a.documentId}:${a.digest ?? ''}`;
          if (seen.has(key)) continue;
          if (isTemplate) {
            refs.push({ documentId: a.documentId, isTemplate: true });
            seen.add(key);
          } else if (a.digest) {
            refs.push({
              documentId: a.documentId,
              digest: a.digest,
              isTemplate: false,
            });
            seen.add(key);
          }
        }
      }
    }
    return refs;
  }

  private collectAllFieldIds(
    items: Array<{ product: Product; program: Program }>,
    participantRoles: RequestUserRoles[] | undefined
  ): string[] {
    const ids = new Set<string>();
    for (const { product, program } of items) {
      const rules = [...(program.rules ?? []), ...(product.rules ?? [])];
      for (const r of rules) {
        if (
          r.fieldId &&
          !isScorecardTotalRuleFieldId(r.fieldId) &&
          ruleAppliesToParticipantRoles(r, participantRoles)
        ) {
          ids.add(r.fieldId);
        }
      }
      for (const c of [
        ...(program.scoreCard ?? []),
        ...(product.scoreCard ?? []),
      ]) {
        if (c.fieldId) ids.add(c.fieldId);
      }
    }
    return [...ids];
  }

  private requiredFieldNamesForProduct(
    product: Product,
    program: Program,
    idToName: Map<string, string>,
    participantRoles: RequestUserRoles[] | undefined
  ): string[] {
    const names: string[] = [];
    const rules = [...(program.rules ?? []), ...(product.rules ?? [])];
    for (const r of rules) {
      if (
        r.fieldId &&
        !isScorecardTotalRuleFieldId(r.fieldId) &&
        ruleAppliesToParticipantRoles(r, participantRoles)
      ) {
        const n = idToName.get(r.fieldId);
        if (n) names.push(n);
      }
    }
    const scoreCard = [
      ...(program.scoreCard ?? []),
      ...(product.scoreCard ?? []),
    ] as ScoreCardCriteria[];
    for (const c of scoreCard) {
      if (c.fieldId) {
        const n = idToName.get(c.fieldId);
        if (n) names.push(n);
      }
    }
    return [...new Set(names)];
  }

  protected getDisplayForEntry(entry: ProductCoverageEntry) {
    return displayProductForCoverage(
      entry.product,
      entry.program,
      entry.missingFieldNames,
      entry.idToName
    );
  }

  protected isProductSelected(productId: string | undefined): boolean {
    if (!productId) return false;
    return this.requestProducts().includes(productId);
  }

  protected onCardClick(entry: ProductCoverageEntry) {
    const productId = entry.product.id;
    if (!productId) return;
    const current = this.requestProducts();
    const next = current.includes(productId)
      ? current.filter(id => id !== productId)
      : [...current, productId];
    this.requestProductsChange.emit(next);
  }
}
