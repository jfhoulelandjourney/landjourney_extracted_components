import React, { useState, forwardRef } from 'react';
import { TextField, TextFieldProps } from '../TextField/TextField';

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'iconRight'> {
  /** Label for the eye toggle (defaults to 'Show password' / 'Hide password') */
  showLabel?: string;
  hideLabel?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { showLabel = 'Show password', hideLabel = 'Hide password', ...rest }, ref
) {
  const [shown, setShown] = useState(false);
  return (
    <div className="lj-password-wrap" style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', width: rest.fullWidth ? '100%' : undefined }}>
      <TextField
        ref={ref}
        {...rest}
        type={shown ? 'text' : 'password'}
        iconRight={shown ? 'visibility_off' : 'visibility'}
      />
      <button
        type="button"
        onClick={() => setShown(s => !s)}
        aria-label={shown ? hideLabel : showLabel}
        title={shown ? hideLabel : showLabel}
        style={{ position: 'absolute', right: 8, top: rest.label ? 28 : 6, background: 'transparent', border: 0, cursor: 'pointer', color: '#6b7280', padding: 4 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{shown ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
  );
});
