import React, { forwardRef } from 'react';
import { TextField, TextFieldProps } from '../TextField/TextField';

export interface NumberFieldProps extends Omit<TextFieldProps, 'type' | 'value' | 'onChange'> {
  value: number | '';
  onChange: (next: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  /** Optional display formatter, e.g. add a percent suffix */
  format?: (value: number | '') => string;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { value, onChange, min, max, step, format, ...rest }, ref
) {
  return (
    <TextField
      ref={ref}
      {...rest}
      inputMode="decimal"
      type="text"
      value={format ? format(value) : (value === '' ? '' : String(value))}
      onChange={(e) => {
        const v = e.target.value.trim();
        if (v === '') return onChange('');
        const n = Number(v.replace(',', '.'));
        if (Number.isFinite(n)) onChange(n);
      }}
      onBlur={() => {
        if (value === '') return;
        let n = value as number;
        if (typeof min === 'number') n = Math.max(min, n);
        if (typeof max === 'number') n = Math.min(max, n);
        if (n !== value) onChange(n);
      }}
      min={min} max={max} step={step}
    />
  );
});
