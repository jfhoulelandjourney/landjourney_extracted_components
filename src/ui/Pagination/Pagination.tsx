import React from 'react';
import './Pagination.scss';

export interface PaginationProps {
  page: number;        // 1-based
  pageCount: number;
  onChange: (page: number) => void;
  variant?: 'simple' | 'numbered';
}

export const Pagination: React.FC<PaginationProps> = ({ page, pageCount, onChange, variant = 'simple' }) => {
  const can = (target: number) => target >= 1 && target <= pageCount && target !== page;
  if (variant === 'simple') {
    return (
      <div className="lj-pagination lj-pagination--simple">
        Page {page} of {pageCount}
      </div>
    );
  }
  const nums = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="lj-pagination lj-pagination--numbered">
      <button disabled={!can(page - 1)} onClick={() => can(page - 1) && onChange(page - 1)} aria-label="Previous page">
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      {nums.map(n => (
        <button
          key={n}
          className={n === page ? 'is-active' : ''}
          onClick={() => can(n) && onChange(n)}
        >{n}</button>
      ))}
      <button disabled={!can(page + 1)} onClick={() => can(page + 1) && onChange(page + 1)} aria-label="Next page">
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
};
