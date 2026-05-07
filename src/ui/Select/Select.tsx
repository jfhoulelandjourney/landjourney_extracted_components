import React, { useEffect, useId, useRef, useState } from 'react';
import './Select.scss';

export interface SelectOption<V extends string | number = string> {
  value: V;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps<V extends string | number = string> {
  options: SelectOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
}

export function Select<V extends string | number = string>({
  options, value, onChange, placeholder = 'Select…',
  label, hint, error, disabled, fullWidth, size = 'md'
}: SelectProps<V>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const current = options.find(o => o.value === value) ?? null;

  return (
    <div
      ref={ref}
      className={['lj-select', 'lj-select--' + size, fullWidth ? 'lj-select--block' : '', error ? 'is-invalid' : '', disabled ? 'is-disabled' : '', open ? 'is-open' : ''].filter(Boolean).join(' ')}
    >
      {label && <label htmlFor={id} className="lj-select__label">{label}</label>}
      <button id={id} type="button" className="lj-select__control" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className={'lj-select__value' + (current ? '' : ' is-placeholder')}>
          {current ? current.label : placeholder}
        </span>
        <span className="material-symbols-outlined" aria-hidden>{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <ul className="lj-select__menu" role="listbox">
          {options.map(o => (
            <li
              key={String(o.value)}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              className={(o.value === value ? 'is-selected ' : '') + (o.disabled ? 'is-disabled' : '')}
              onClick={() => { if (!o.disabled) { onChange(o.value); setOpen(false); } }}
            >{o.label}</li>
          ))}
        </ul>
      )}
      {(error || hint) && <span className={'lj-select__msg ' + (error ? 'is-error' : '')}>{error || hint}</span>}
    </div>
  );
}
