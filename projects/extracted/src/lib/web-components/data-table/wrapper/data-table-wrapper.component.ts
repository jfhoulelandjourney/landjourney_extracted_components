import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  inject,
  input,
  isSignal,
  output,
} from '@angular/core';
import { isNotNil } from 'es-toolkit';
import { Subject, takeUntil } from 'rxjs';
import { ActionButton } from '../action-buttons/table-action-buttons.component';
import {
  TableColumnDefWithMeta,
  TableCustomActionEvent,
} from '../data-table.model';
import { DataTableService } from '../service/data-table.service';

@Component({
  selector: 'lj-data-table-wrapper',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataTableService],
})
export abstract class DataTableWrapperComponent<
  Data extends object,
  TableColumnId extends string = string,
>
  implements OnDestroy, OnInit
{
  protected readonly dataTableService: DataTableService<Data> = inject(
    DataTableService<Data>,
    { self: true }
  );
  protected readonly destroy$ = new Subject<void>();

  abstract title: string;
  abstract columns:
    | TableColumnDefWithMeta<Data>[]
    | Signal<TableColumnDefWithMeta<Data>[]>;

  control = input<'local' | 'server'>('local');

  pagination = input(true);
  currentPage = input<number>(0);
  pageSize = input<number | undefined>();
  totalCount = input<number | undefined>();

  search = input('');
  searchable = input(false);

  // TODO: Fix it as boolean after removing all loaded usages
  tableLoading = input<boolean | undefined>();
  actionButtons = input<ActionButton[]>(['edit', 'delete']);
  customColumns = input<(TableColumnId | TableColumnDefWithMeta<Data>)[]>();

  actualColumns = computed((): TableColumnDefWithMeta<Data>[] => {
    const columns = this.customColumns();
    const defaultColumns = isSignal(this.columns)
      ? this.columns()
      : this.columns;

    if (!columns || columns.length === 0) {
      return defaultColumns;
    }

    return columns
      .map(column => {
        if (typeof column === 'string') {
          return defaultColumns.find(col => col.id === column);
        }

        return column;
      })
      .filter(isNotNil);
  });

  readonly changePage = output<number>();
  readonly customAction = output<TableCustomActionEvent<Data>>();
  readonly rowActivated = output<Data>();
  readonly editChild = output<unknown>();
  readonly deleteChild = output<unknown>();
  readonly searchChange = output<string>();
  readonly copy = output<Data>();
  readonly edit = output<Data>();
  readonly delete = output<Data>();
  readonly remove = output<Data>();
  readonly configure = output<Data>();
  readonly view = output<Data>();

  createInjector(): Injector {
    return Injector.create({
      providers: [
        { provide: DataTableService, useValue: this.dataTableService },
      ],
    });
  }

  ngOnInit() {
    this.dataTableService.customAction
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleCustomAction(event);
        switch (event.action) {
          case 'copy':
            this.handleCopyAction(event);
            break;
          case 'view':
            this.handleViewAction(event);
            break;
          case 'edit':
            this.handleEditAction(event);
            break;
          case 'delete':
            this.handleDeleteAction(event);
            break;
          case 'remove':
            this.handleRemoveAction(event);
            break;
          case 'configure':
            this.handleConfigure(event);
        }
      });

    this.dataTableService.editChild
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleEditChildAction(event);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleSearchChange(term: string): void {
    this.searchChange.emit(term);
  }

  handleRowActivated(event: Data): void {
    this.rowActivated.emit(event);
  }

  handleEditChildAction(event: unknown) {
    this.editChild.emit(event);
  }

  handleDeleteChildAction(event: unknown) {
    this.deleteChild.emit(event);
  }

  handleChangePage(event: number): void {
    this.changePage.emit(event);
  }

  handleCustomAction(event: TableCustomActionEvent<Data>): void {
    this.customAction.emit(event);
  }

  handleCopyAction(event: TableCustomActionEvent<Data>): void {
    this.copy.emit(event.value);
  }

  handleEditAction(event: TableCustomActionEvent<Data>): void {
    this.edit.emit(event.value);
  }

  handleDeleteAction(event: TableCustomActionEvent<Data>): void {
    this.delete.emit(event.value);
  }

  handleRemoveAction(event: TableCustomActionEvent<Data>): void {
    this.remove.emit(event.value);
  }

  handleConfigure(event: TableCustomActionEvent<Data>): void {
    this.configure.emit(event.value);
  }

  handleViewAction(event: TableCustomActionEvent<Data>): void {
    this.view.emit(event.value);
  }
}
