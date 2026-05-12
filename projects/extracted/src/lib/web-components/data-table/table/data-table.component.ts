import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ColumnFiltersState,
  createAngularTable,
  FilterFn,
  FlexRenderDirective,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  Header,
  SortingState,
  TableOptions,
} from '@tanstack/angular-table';
import { rankItem } from '@tanstack/match-sorter-utils';
import { isNil } from 'es-toolkit';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { debounceTime, distinctUntilChanged, filter, map, Subject } from 'rxjs';
import { TIMING, TIMING_VALUES } from '../../../constants/timing';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { extractTargetAndValue } from '../../../utils/eventUtil';
import { PaginationComponent } from '../../pagination/pagination.component';
import {
  TableColumnDefWithMeta,
  TableCustomActionEvent,
} from '../data-table.model';
import { DataTableService } from '../service/data-table.service';

export const DEFAULT_PAGINATION_VALUES = {
  pageSize: 10,
  currentPage: 0,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterFunction: FilterFn<any> = (row, columnId, filterValue) => {
  const cellValue = row.getValue(columnId);
  return (
    cellValue?.toString().toLowerCase().includes(filterValue.toLowerCase()) ??
    false
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta({ itemRank });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

@Component({
  selector: 'lj-data-table',
  imports: [
    CommonModule,
    ActivateDirective,
    FlexRenderDirective,
    FormsModule,
    PaginationComponent,
    NgxSkeletonLoaderModule,
    MatTooltipModule,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'table',
    '[attr.aria-label]': 'title()',
  },
})
export class DataTableComponent<Data extends object>
  implements OnInit, OnDestroy
{
  private dataTableService = inject<DataTableService<Data>>(DataTableService);

  private destroy$ = new Subject<void>();
  private unsubscribeFns: VoidFunction[] = [];
  timing = inject(TIMING, { optional: true });

  // LOADING STATES
  /** @deprecated */
  loaded = input<boolean>(true);
  // TODO: Fix it as boolean after removing all loaded usages
  tableLoading = input<boolean | undefined>();

  // BASE DATA
  control = input<'local' | 'server'>('local');
  columns = input<TableColumnDefWithMeta<Data>[]>([]);
  data = input<Data[] | undefined>([]);
  emptyMessage = input<string>('');
  hasFooter = input<boolean>(false);
  rowClickable = input<boolean>(true);
  title = input<string>('');
  totalCount = input<number | undefined>();
  rowClasses = input<Record<string, string>>({});
  childrenFieldName = input<string | undefined>(undefined);
  expandedRows = signal<Record<string, boolean>>({});

  // PAGINATION SETTINGS
  pagination = input<boolean>(true);
  currentPage = model<number | undefined>(0);
  pageSize = input<number | undefined>();

  // SEARCH SETTINGS
  searchable = input<boolean>(false);
  search = model('');

  protected fractionSizeTotal = computed(() => {
    return this.columns().reduce((acc, col) => {
      const meta = col.meta;
      return acc + (meta?.fractionSize ?? 1);
    }, 0);
  });

  readonly searchChange = output<string>();
  readonly rowActivated = output<Data>();
  readonly changePage = output<number>();
  readonly customAction = output<TableCustomActionEvent<Data>>();
  readonly editChild = output<unknown>();
  readonly deleteChild = output<unknown>();

  columnFilters = signal<ColumnFiltersState>([]);
  sorting = signal<SortingState>([]);

  pageCount = computed<number | undefined>(() => {
    const totalCount = this.totalCount();
    const pageSize = this.pageSize();

    if (isNil(totalCount) || totalCount < 0 || !pageSize || pageSize < 0) {
      return undefined;
    }

    return Math.ceil(totalCount / pageSize);
  });

  tableOptions = computed<TableOptions<Data>>(() => {
    const data = this.data() ?? [];
    const columns =
      this.columns().map(col => {
        return {
          ...col,
          enableGlobalFilter: col.filterable ?? false,
        };
      }) ?? [];
    const pagination = this.pagination();
    const pageCount = this.pageCount();
    const searchTerm = this.search();

    const options: TableOptions<Data> = {
      data,
      columns,
      manualPagination: this.control() === 'server',
      manualFiltering: this.control() === 'server',
      getCoreRowModel: getCoreRowModel(),
      globalFilterFn: filterFunction,
      autoResetPageIndex: false,
      debugTable: false,
      state: {
        globalFilter: searchTerm,
        pagination: pagination
          ? {
              pageIndex:
                this.currentPage() ?? DEFAULT_PAGINATION_VALUES.currentPage,
              pageSize: this.pageSize() ?? DEFAULT_PAGINATION_VALUES.pageSize,
            }
          : {
              pageIndex: 0,
              pageSize: Number.MAX_SAFE_INTEGER,
            },
      },
      onGlobalFilterChange: (_newValue: string) => {
        this.handleChangePage(0);
      },
    };

    if (!isNil(pageCount)) {
      Object.assign(options, {
        pageCount,
      });
    }

    if (this.control() === 'local') {
      Object.assign(options, {
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
      });
    }

    return options;
  });

  table: ReturnType<typeof createAngularTable<Data>>;

  constructor() {
    this.table = createAngularTable<Data>(this.tableOptions);
    this.listenSearchValue();
  }

  fakeRows(): number[] {
    return Array.from({ length: this.pageSize() ?? 10 }, (_, i) => i);
  }

  getDataId(row: unknown): string {
    // @ts-expect-error type unclear.
    if ('original' in row && 'id' in row.original) {
      return row.original.id as string;
    }

    return '';
  }

  ngOnInit(): void {
    const customActionSubscription =
      this.dataTableService.customAction.subscribe(event => {
        this.customAction.emit(event);
      });

    this.unsubscribeFns.push(
      customActionSubscription.unsubscribe.bind(customActionSubscription)
    );

    const editChildSubscription = this.dataTableService.editChild.subscribe(
      event => {
        this.editChild.emit(event);
      }
    );

    const deleteChildSubscription = this.dataTableService.deleteChild.subscribe(
      event => {
        this.deleteChild.emit(event);
      }
    );

    this.unsubscribeFns.push(
      editChildSubscription.unsubscribe.bind(editChildSubscription)
    );

    this.unsubscribeFns.push(
      deleteChildSubscription.unsubscribe.bind(deleteChildSubscription)
    );
  }

  ngOnDestroy(): void {
    this.unsubscribeFns.forEach(fn => fn());
    this.destroy$.next();
    this.destroy$.complete();
  }

  listenSearchValue(): void {
    toObservable(this.search)
      .pipe(
        filter(() => {
          return this.searchable();
        }),
        debounceTime(
          this.timing?.typing.debounce ?? TIMING_VALUES.typing.debounce
        ),
        map(value => {
          return value?.trim() ?? '';
        }),
        distinctUntilChanged()
      )
      .subscribe(term => {
        this.handleSearchChange(term);
      });
  }

  getColumnWidth(
    header: Header<Data, unknown>,
    column: TableColumnDefWithMeta<Data>
  ): string {
    const fractionDeclared = this.table
      .getAllColumns()
      .some(col => 'fractionSize' in (col.columnDef.meta ?? {}));

    if (!fractionDeclared) {
      return header.getSize() + 'px';
    }

    const meta = column.meta;
    const fractionSize = meta?.fractionSize ?? 1;
    const percentage = (fractionSize * 100) / this.fractionSizeTotal();
    return `${percentage}%`;
  }

  getToolTip(column: TableColumnDefWithMeta<Data>): string | undefined {
    return column.meta?.toolTip;
  }

  getHeaderCellStyle(
    column: TableColumnDefWithMeta<Data>
  ): Record<string, string> {
    const meta = column.meta;
    return meta?.headerCellStyle ?? {};
  }

  getBodyCellStyle(
    column: TableColumnDefWithMeta<Data>
  ): Record<string, string> {
    const meta = column.meta;
    return meta?.bodyCellStyle ?? {};
  }

  isChildCell(column: TableColumnDefWithMeta<Data>): boolean {
    const meta = column.meta;
    return meta?.childCell ?? false;
  }

  hasChildren(row: Data): boolean {
    if (!this.childrenFieldName()) {
      return false;
    }

    const childrenFieldName = this.childrenFieldName() ?? '';
    if (childrenFieldName in row) {
      // @ts-expect-error type not detected...
      return row[childrenFieldName] && row[childrenFieldName].length > 0;
    }

    return false;
  }

  rowIsExpanded(row: Data): boolean {
    if (!this.childrenFieldName() || !this.hasChildren(row)) {
      return false;
    }

    // @ts-expect-error type not detected...
    return this.expandedRows()[row.id] ?? false;
  }

  onPageInputChange(event: Event): void {
    const [target, value] = extractTargetAndValue(event);
    if (!target) {
      return;
    }
    this.handleChangePage(Number(value));
  }

  onPageSizeChange(event: Event): void {
    const [target, value] = extractTargetAndValue(event);
    if (!target) {
      return;
    }
    const numericValue = Number(value);
    const pageSize = Number.isNaN(numericValue)
      ? numericValue
      : DEFAULT_PAGINATION_VALUES.pageSize;
    this.table.setPageSize(pageSize);
    this.table.setState(state => {
      return {
        ...state,
        pagination: {
          ...state.pagination,
          pageSize,
        },
      };
    });
  }

  handleRowClick(data: Data): void {
    if (this.rowClickable()) {
      this.rowActivated.emit(data);
      this.dataTableService.rowActivated.next(data);
    }

    if (this.hasChildren(data)) {
      const expandedRows = this.expandedRows();
      // @ts-expect-error type not detected
      expandedRows[data.id] = !expandedRows[data.id];
      this.expandedRows.set(expandedRows);
    }
  }

  handleSearchChange(term: string): void {
    this.table.setGlobalFilter(term);
    this.searchChange.emit(term);
    this.dataTableService.searchChange.next(term);
    this.table.setState(state => {
      return {
        ...state,
        globalFilter: term,
      };
    });
  }

  handleChangePage(page: number): void {
    const pageCount = this.pageCount();

    if (page < 0) {
      return;
    }
    if (pageCount && page >= pageCount) {
      return;
    }

    this.changePage.emit(page);
    this.dataTableService.changePage.next(page);
    this.currentPage.set(page);
    this.table.setPageIndex(page);
    this.table.setState(state => {
      return {
        ...state,
        pagination: {
          ...state.pagination,
          pageIndex: page,
        },
      };
    });
  }
}
