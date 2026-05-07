import React from 'react';
import { Pagination } from '../Pagination/Pagination';
import './DataTable.scss';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<Row> {
  id: string;
  header: React.ReactNode;
  /** width hint, e.g. '160px' or '1fr' (treated as flex hint) */
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  cell: (row: Row, rowIndex: number) => React.ReactNode;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  loading?: boolean;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  emptyMessage?: React.ReactNode;
  onRowClick?: (row: Row) => void;
  sort?: { id: string; dir: SortDirection };
  onSortChange?: (id: string, dir: SortDirection) => void;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<Row>({
  columns, rows, rowKey, loading, skeletonRows = 4, emptyMessage = 'No items to display.',
  onRowClick, sort, onSortChange, page, pageCount, onPageChange,
}: DataTableProps<Row>) {
  const handleSort = (col: DataTableColumn<Row>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir: SortDirection = sort?.id === col.id && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange(col.id, nextDir);
  };

  return (
    <div className="lj-table">
      <table>
        <thead>
          <tr>
            {columns.map(c => (
              <th
                key={c.id}
                style={{ textAlign: c.align ?? 'left', width: c.width }}
                aria-sort={sort?.id === c.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                className={c.sortable ? 'is-sortable' : undefined}
                onClick={() => handleSort(c)}
              >
                <span className="lj-table__th-inner">
                  {c.header}
                  {c.sortable && (
                    <span className="lj-table__sort">
                      <span className="material-symbols-outlined">
                        {sort?.id === c.id ? (sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: skeletonRows }).map((_, r) => (
            <tr key={'s' + r} className="lj-table__skeleton-row">
              {columns.map(c => (
                <td key={c.id}><span className="lj-table__skeleton" /></td>
              ))}
            </tr>
          ))}

          {!loading && rows.length === 0 && (
            <tr><td colSpan={columns.length} className="lj-table__empty">{emptyMessage}</td></tr>
          )}

          {!loading && rows.map((row, rIdx) => (
            <tr
              key={rowKey(row, rIdx)}
              className={onRowClick ? 'is-clickable' : undefined}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(c => (
                <td key={c.id} style={{ textAlign: c.align ?? 'left' }}>{c.cell(row, rIdx)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {(page !== undefined && pageCount !== undefined) && (
        <div className="lj-table__footer">
          {onPageChange ? (
            <Pagination page={page} pageCount={pageCount} onChange={onPageChange} />
          ) : (
            <span>Page {page} of {pageCount}</span>
          )}
        </div>
      )}
    </div>
  );
}
