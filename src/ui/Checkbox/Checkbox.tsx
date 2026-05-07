import React from 'react';
import './Checkbox.scss';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, indeterminate, className, ...rest }) => {
  const ref = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <label className={['lj-check', rest.disabled ? 'is-disabled' : '', className || ''].filter(Boolean).join(' ')}>
      <input ref={ref} type="checkbox" {...rest} />
      <span className="lj-check__box" aria-hidden>
        <span className="lj-check__mark material-symbols-outlined">{indeterminate ? 'remove' : 'check'}</span>
      </span>
      {label && <span className="lj-check__label">{label}</span>}
    </label>
  );
};
