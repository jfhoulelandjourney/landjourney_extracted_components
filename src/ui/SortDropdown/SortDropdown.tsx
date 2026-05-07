import React from 'react';
import { Select, SelectOption } from '../Select/Select';

export interface SortValue<F extends string = string> { field: F; dir: 'asc' | 'desc' }
export interface SortDropdownProps<F extends string = string> {
  fields: { value: F; label: string }[];
  value: SortValue<F>;
  onChange: (next: SortValue<F>) => void;
}

export function SortDropdown<F extends string>({ fields, value, onChange }: SortDropdownProps<F>) {
  // Build the option list as 'Field ↓' / 'Field ↑'
  const opts: SelectOption<string>[] = fields.flatMap(f => [
    { value: f.value + '|desc', label: f.label + ' ↓' },
    { value: f.value + '|asc',  label: f.label + ' ↑' },
  ]);
  return (
    <Select
      options={opts}
      value={value.field + '|' + value.dir}
      onChange={(v) => {
        const [field, dir] = v.split('|');
        onChange({ field: field as F, dir: dir as 'asc' | 'desc' });
      }}
      size="sm"
    />
  );
}
