import { Injectable } from '@angular/core';
import { type MatDateFormats, NativeDateAdapter } from '@angular/material/core';

export const YMD_APP_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'YYYY/MM/DD',
  },
  display: {
    dateInput: 'input',
    monthYearLabel: 'YYYY/MM',
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

@Injectable({
  providedIn: 'root',
})
export class YMDDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(value)) {
      const parts = value.split('/');
      const day = parseInt(parts.at(2) ?? '', 10);
      const month = parseInt(parts.at(1) ?? '', 10) - 1;
      const year = parseInt(parts.at(0) ?? '', 10);
      return new Date(year, month, day);
    }
    return super.parse(value);
  }

  override format(date: Date, displayFormat: string): string {
    if (displayFormat === 'input') {
      const day = ('0' + date.getDate()).slice(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const year = date.getFullYear();
      return `${year}/${month}/${day}`;
    }
    return super.format(date, displayFormat);
  }
}
