import React from 'react';
import './Button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outlined';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Material symbol name to render before the label */
  iconLeft?: string;
  /** Material symbol name to render after the label */
  iconRight?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', iconLeft, iconRight, loading,
  fullWidth, className, children, disabled, ...rest
}) => (
  <button
    {...rest}
    type={rest.type ?? 'button'}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={[
      'lj-btn',
      'lj-btn--' + variant,
      'lj-btn--' + size,
      fullWidth ? 'lj-btn--block' : '',
      loading ? 'is-loading' : '',
      className || ''
    ].filter(Boolean).join(' ')}
  >
    {iconLeft && !loading && <span className="material-symbols-outlined" aria-hidden>{iconLeft}</span>}
    {loading && <span className="lj-btn__spinner" aria-hidden />}
    <span className="lj-btn__label">{children}</span>
    {iconRight && !loading && <span className="material-symbols-outlined" aria-hidden>{iconRight}</span>}
  </button>
);

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string; // for screen readers
  size?: ButtonSize;
  variant?: 'plain' | 'tonal' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, label, size = 'md', variant = 'plain', className, ...rest }) => (
  <button
    {...rest}
    type={rest.type ?? 'button'}
    aria-label={label}
    title={label}
    className={['lj-icon-btn', 'lj-icon-btn--' + size, 'lj-icon-btn--' + variant, className || ''].filter(Boolean).join(' ')}
  >
    <span className="material-symbols-outlined">{icon}</span>
  </button>
);
