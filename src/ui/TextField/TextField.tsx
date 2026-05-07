import React, { forwardRef } from 'react';
import './TextField.scss';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: string;
  iconRight?: string;
  fullWidth?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, iconLeft, iconRight, fullWidth, className, id, ...rest }, ref
) {
  const inputId = id || ('lj-tf-' + Math.random().toString(36).slice(2, 8));
  return (
    <div className={['lj-field', fullWidth ? 'lj-field--block' : '', error ? 'is-invalid' : '', rest.disabled ? 'is-disabled' : '', className || ''].filter(Boolean).join(' ')}>
      {label && <label className="lj-field__label" htmlFor={inputId}>{label}</label>}
      <div className="lj-field__control">
        {iconLeft && <span className="lj-field__icon material-symbols-outlined" aria-hidden>{iconLeft}</span>}
        <input id={inputId} ref={ref} {...rest} type={rest.type ?? 'text'} />
        {iconRight && <span className="lj-field__icon material-symbols-outlined" aria-hidden>{iconRight}</span>}
      </div>
      {(error || hint) && <span className={'lj-field__msg ' + (error ? 'is-error' : '')}>{error || hint}</span>}
    </div>
  );
});
