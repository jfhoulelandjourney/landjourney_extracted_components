import { ColumnDef } from '@tanstack/angular-table';

export type TableColumnMeta = {
  fractionSize?: number;
  headerCellStyle?: Record<string, string>;
  bodyCellStyle?: Record<string, string>;
  childCell?: boolean;
  toolTip?: string;
};

export type TableColumnDefWithMeta<T> = ColumnDef<T> & {
  meta?: TableColumnMeta;
  filterable?: boolean;
};

export type TableCustomAction =
  | 'view'
  | 'edit'
  | 'delete'
  | 'copy'
  | 'remove'
  | 'configure';

export type TableCustomActionEvent<T extends object> = {
  action: TableCustomAction;
  value: T;
};
