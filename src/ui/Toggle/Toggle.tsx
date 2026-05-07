import React from 'react';
import './Toggle.scss';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
  /** Place label before or after the switch */
  labelPlacement?: 'start' | 'end';
}

export const Toggle: React.FC<ToggleProps> = ({ label, labelPlacement = 'end', className, ...rest }) => (
  <label className={['lj-toggle', 'lj-toggle--' + labelPlacement, rest.disabled ? 'is-disabled' : '', className || ''].filter(Boolean).join(' ')}>
    {label && labelPlacement === 'start' && <span className="lj-toggle__label">{label}</span>}
    <span className="lj-toggle__switch">
      <input type="checkbox" {...rest} />
      <span className="lj-toggle__track" aria-hidden>
        <span className="lj-toggle__thumb" />
      </span>
    </span>
    {label && labelPlacement === 'end' && <span className="lj-toggle__label">{label}</span>}
  </label>
);
