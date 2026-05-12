import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../../utils/timeUtil';

@Pipe({
  standalone: true,
  name: 'dateAgo',
  pure: true,
})
export class DateAgoPipe implements PipeTransform {
  transform(value: number | undefined): string {
    if (value) {
      const seconds = Math.floor(new Date().getTime() / 1000 - value);

      // less than 30 seconds return now
      if (seconds < 29) {
        return 'Now';
      }

      // more than a day just return the actual date
      if (seconds > 86401) {
        return formatDate(
          typeof value === 'number' ? new Date(value * 1000) : new Date(),
          'short'
        );
      }

      const intervals: Record<string, number> = {
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
      };

      for (const i in intervals) {
        const counter = Math.floor(seconds / (intervals[i] ?? 1));
        if (counter > 0)
          if (counter === 1) {
            return counter + ' ' + i + ' ago'; // singular (1 day ago)
          } else {
            return counter + ' ' + i + 's ago'; // plural (2 days ago)
          }
      }
    }

    return '';
  }
}
