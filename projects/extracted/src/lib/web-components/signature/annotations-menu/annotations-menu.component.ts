import {
  CdkDrag,
  CdkDropList,
  type CdkDragEnter,
  type CdkDragStart,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { OrganizationService } from '../../../services/organization/organization.service';
import type { Field } from '../../../services/products/fields/fields.models';
import { FieldsService } from '../../../services/products/fields/fields.service';
import { LjInputFieldComponent } from '../../form/input-field/input-field.component';
import {
  FIELD_PLUGINS,
  type RegisteredFieldType,
} from '../../pdf/field-framework';
import type { AnnotationData } from '../annotation.types';
import { DraggableAnnotationComponent } from '../draggable-annotation/draggable-annotation.component';

@Component({
  selector: 'lj-annotations-menu',
  imports: [DraggableAnnotationComponent, LjInputFieldComponent],
  templateUrl: './annotations-menu.component.html',
  styleUrl: './annotations-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [CdkDropList],
})
export class AnnotationsMenuComponent {
  cdkDropList = inject(CdkDropList);
  elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private previousAnnotationIds = '';
  private annotationsChanged$ = new Subject<void>();
  private copiedNodes = new WeakMap<CdkDrag, HTMLElement>();
  private listItems = new WeakMap<CdkDrag, HTMLElement>();

  id = input<string>('annotationToolsList');
  disabled = input<boolean>(false);
  connectedTo = input<string[]>([]);
  isTemplate = input<boolean>(false);
  signee = input<AnnotationData['signee'] | null>(null);
  signer = input<AnnotationData['signer'] | null>(null);

  annotations = viewChildren(CdkDrag, {
    read: CdkDrag,
  });
  annotationsEl = viewChildren(CdkDrag, {
    read: ElementRef<HTMLElement>,
  });

  private readonly fieldsService = inject(FieldsService);
  private readonly organizationService = inject(OrganizationService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  filteredFields = signal<string[]>([]);
  searchTerm = signal('');

  /**
   * All field types from the v2 plugin registry. `visibleFieldTypes` below
   * filters this against the FF gate map.
   */
  private readonly registeredFieldTypes: readonly RegisteredFieldType[] =
    Object.keys(FIELD_PLUGINS) as RegisteredFieldType[];

  /**
   * Single umbrella flag for every post-step-34 field type. We list the
   * always-visible originals here instead of the gated newcomers so that
   * any plugin added to `FIELD_PLUGINS` is FF-gated by default — no need
   * to touch this file when registering a new field type.
   */
  private readonly NEW_FIELDS_FLAG = 'PDF_NEW_FIELDS';
  private readonly ORIGINAL_FIELD_TYPES: ReadonlySet<RegisteredFieldType> =
    new Set<RegisteredFieldType>(['signature', 'initials', 'date', 'name']);

  /**
   * Field types actually rendered in the sidebar. Originals always appear;
   * any other registered plugin only appears when `PDF_NEW_FIELDS` is on.
   */
  readonly visibleFieldTypes = computed(
    (): readonly RegisteredFieldType[] => {
      const newFieldsOn = this.organizationService.isFeatureFlagActivated(
        this.NEW_FIELDS_FLAG
      );
      return this.registeredFieldTypes.filter(
        type => this.ORIGINAL_FIELD_TYPES.has(type) || newFieldsOn
      );
    }
  );

  /**
   * True when the host has an assignment context (a signee in template mode
   * or a signer in request mode). Drives per-tile disable below.
   */
  protected readonly hasAssignment = computed(
    (): boolean => this.signee() !== null || this.signer() !== null
  );

  /**
   * Per-tile disable: a tile is disabled if the menu is globally disabled
   * (e.g. no PDF loaded) OR if the plugin requires an assignment and none is
   * currently set. Optional-assignment plugins (date, name) stay draggable
   * even with no signee/signer selected — the field will be filled by anyone
   * authorised to interact with the PDF.
   */
  protected isFieldTypeDisabled(fieldType: RegisteredFieldType): boolean {
    if (this.disabled()) return true;
    return FIELD_PLUGINS[fieldType].requiresAssignment && !this.hasAssignment();
  }

  /**
   * Returns the width for a field type from the plugin definition.
   */
  protected getFieldWidth(fieldType: RegisteredFieldType): number | undefined {
    return FIELD_PLUGINS[fieldType].size?.width;
  }

  /**
   * Returns the height for a field type from the plugin definition.
   */
  protected getFieldHeight(fieldType: RegisteredFieldType): number | undefined {
    return FIELD_PLUGINS[fieldType].size?.height;
  }

  isDemoMode = computed(() => {
    return this.organizationService.isFeatureFlagActivated('DEMO_MODE');
  });

  constructor() {
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
        this.filteredFields.set(result.items.map(field => field.label));
      });

    this.cdkDropList.enterPredicate = () => false;
    this.cdkDropList.sortPredicate = () => false;

    effect(() => {
      const dropListId = this.id();
      this.cdkDropList.id = dropListId;
    });

    effect(() => {
      const disabled = this.disabled();
      this.cdkDropList.disabled = disabled;
    });

    effect(() => {
      const dropListConnections = this.connectedTo();
      this.cdkDropList.connectedTo = dropListConnections;
    });

    effect(() => {
      const listItems = this.annotationsEl();

      const ids = listItems
        .map(elRef => elRef.nativeElement.id)
        .sort((a, b) => a.localeCompare(b));

      if (this.previousAnnotationIds !== ids.join(',')) {
        this.previousAnnotationIds = ids.join(',');
        this.annotationsChanged$.next();
        this.addDataIndexAttribute();
        this.setupListeners();
      }
    });
  }

  private addDataIndexAttribute() {
    this.annotationsEl().forEach((elRef, index) => {
      const annotationElement = elRef.nativeElement;
      annotationElement.dataset.index = (index + 1).toString();
    });
  }

  private setupListeners() {
    this.annotations().forEach(annotation => {
      annotation.started
        .pipe(takeUntil(this.annotationsChanged$))
        .subscribe(event => {
          this.handleDragStart(event, annotation);
        });
      annotation.entered
        .pipe(takeUntil(this.annotationsChanged$))
        .subscribe(event => {
          this.handleDragEnter(event, annotation);
        });
      annotation.ended
        .pipe(takeUntil(this.annotationsChanged$))
        .subscribe(() => {
          this.disposeAnnotationCopy(annotation);
        });
      annotation.exited
        .pipe(takeUntil(this.annotationsChanged$))
        .subscribe(() => {
          this.disposeAnnotationCopy(annotation);
        });
    });
  }

  private disposeAnnotationCopy(annotation: CdkDrag) {
    const item = this.listItems.get(annotation);
    const copy = this.copiedNodes.get(annotation);
    if (item) {
      item.classList.remove('annotation-copy', 'cdk-drag-dragging');
    }
    if (copy) {
      copy.parentElement?.removeChild(copy);
    }
  }

  private handleDragStart(event: CdkDragStart, annotation: CdkDrag) {
    const item = event.source.element.nativeElement;
    const container = event.source.dropContainer.element.nativeElement;
    const dataIndex = item.dataset.index;
    if (!dataIndex) {
      return;
    }
    const originalItem = container.querySelector(
      `[data-index="${dataIndex}"]`
    ) as HTMLElement;
    if (!originalItem) {
      return;
    }
    if (!originalItem.classList.contains('annotation-copy')) {
      originalItem.classList.add('annotation-copy');
    }
    if (!originalItem.classList.contains('cdk-drag-dragging')) {
      originalItem.classList.add('cdk-drag-dragging');
    }
    this.listItems.set(annotation, originalItem);
  }

  private handleDragEnter(event: CdkDragEnter, annotation: CdkDrag) {
    const item = event.item.element.nativeElement;
    const container = event.item.dropContainer.element.nativeElement;
    this.addAnnotationCopyToDropContainer(item, container, annotation);
  }

  private addAnnotationCopyToDropContainer(
    originalItem: HTMLElement,
    container: HTMLElement,
    annotation: CdkDrag
  ) {
    const dataIndex = Number(originalItem.dataset.index);
    const previousItem = container.querySelector(
      `[data-index="${dataIndex - 1}"]`
    ) as HTMLElement | null;
    const nextItem = container.querySelector(
      `[data-index="${dataIndex + 1}"]`
    ) as HTMLElement | null;
    const nodeCopy = originalItem.cloneNode(true) as HTMLElement;
    if (!nodeCopy.classList.contains('annotation-copy')) {
      nodeCopy.classList.add('annotation-copy');
    }
    if (!nodeCopy.classList.contains('cdk-drag-dragging')) {
      nodeCopy.classList.add('cdk-drag-dragging');
    }
    nodeCopy.removeAttribute('style');
    if (previousItem && previousItem.nextElementSibling) {
      // If there is a previous item, insert after it
      container.insertBefore(nodeCopy, previousItem.nextElementSibling);
    } else if (nextItem) {
      // If there is a next item, insert before it
      container.insertBefore(nodeCopy, nextItem);
    } else {
      // If there are no previous or next items, append to the end
      container.appendChild(nodeCopy);
    }
    this.copiedNodes.set(annotation, nodeCopy);
  }

  onSearchChange(value: string | null): void {
    const v = value ?? '';
    this.searchTerm.set(v);
    this.search$.next(v);
    if (v === '') {
      this.filteredFields.set([]);
    }
  }
}
