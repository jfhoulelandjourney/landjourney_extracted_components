import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../../utils/timeUtil';

@Pipe({
  standalone: true,
  name: 'dueDate',
  pure: true,
})
export class DueDatePipe implements PipeTransform {
  transform(value: number | undefined): string {
    if (!value) return '';

    const date =
      typeof value === 'number' ? new Date(value * 1000) : new Date(value);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diffDays = Math.floor(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === 2) return 'in Two Days';
    if (diffDays < 0) return 'Now';

    return `on ${formatDate(date, 'short')}`;
  }
}
