import { Injectable, InjectionToken } from '@angular/core';
import { Subject } from 'rxjs';
import { TableCustomActionEvent } from '../data-table.model';

export const DATA_TABLE_SERVICE_TOKEN = new InjectionToken<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DataTableService<any>
>('DataTableService');

@Injectable()
export class DataTableService<T extends object> {
  changePage = new Subject<number>();
  rowActivated = new Subject<T>();
  searchChange = new Subject<string>();
  customAction = new Subject<TableCustomActionEvent<T>>();
  editChild = new Subject<unknown>();
  deleteChild = new Subject<unknown>();
}
