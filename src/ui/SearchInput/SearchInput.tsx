import React from 'react';
import './SearchInput.scss';

export interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Big bordered variant matches the Requests page header search */
  variant?: 'inline' | 'banner';
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Search', variant = 'inline' }) => (
  <div className={'lj-search lj-search--' + variant}>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
    <span className="material-symbols-outlined" aria-hidden>search</span>
  </div>
);
