import React from 'react';
import './FilterBar.scss';

export interface FilterChip {
  id: string;
  label: string;
  value?: React.ReactNode;
}

export interface FilterBarProps {
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onAdd?: () => void;
  addLabel?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ chips, onRemove, onAdd, addLabel = 'Add a filter' }) => (
  <div className="lj-filter-bar">
    {chips.map(c => (
      <span key={c.id} className="lj-filter-bar__chip">
        <strong>{c.label}</strong>
        {c.value !== undefined && <span className="lj-filter-bar__value">: {c.value}</span>}
        <button onClick={() => onRemove(c.id)} aria-label={'Remove filter ' + c.label}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </span>
    ))}
    {onAdd && (
      <button className="lj-filter-bar__add" onClick={onAdd} type="button">
        <span>{addLabel}</span>
        <span className="material-symbols-outlined">filter_alt</span>
      </button>
    )}
  </div>
);
