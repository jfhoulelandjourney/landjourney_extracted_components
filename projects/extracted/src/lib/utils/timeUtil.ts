import {
  ONE_DAY_MS,
  ONE_HOUR_MS,
  ONE_MINUTE_MS,
  ONE_MONTH_MS,
  ONE_SECOND_MS,
  ONE_WEEK_MS,
  ONE_YEAR_MS,
} from '../constants/time';
import { isNil } from './nullishUtil';

export class TimeUtil {
  static isExpired(time: number, timeToLiveInSeconds: number): boolean {
    return TimeUtil.getTimestampSeconds() - time < timeToLiveInSeconds;
  }

  static getTimestampSeconds(): number {
    // added | 0 to ensure the result is an integer
    return (Date.now() / 1000) | 0;
  }

  static convertStringToSecondTimestamp(inputString: string): number {
    return (Date.parse(inputString) / 1000) | 0;
  }

  static convertStringToTimestamp(
    inputString: unknown,
    defaultValue: number
  ): number {
    if (isNil(inputString)) return defaultValue;

    try {
      return Number(inputString);
    } catch {
      return defaultValue;
    }
  }

  static parseDateStringToLocalDate(value: string): Date | undefined {
    try {
      return new Date(Date.parse(value.replaceAll('-', '/'))); // Forces date to be parses in local...
    } catch {
      return undefined;
    }
  }

  static convertSecondTimestampToDate(timestampSeconds: number): Date {
    return new Date(timestampSeconds * 1000);
  }

  static convertDateToSecondTimestamp(dateValue: Date): number {
    return (dateValue.getTime() / 1000) | 0;
  }

  static convertSecondTimestampToTime(
    timestampSeconds: number
  ): string | undefined {
    try {
      const hours =
        TimeUtil.convertSecondTimestampToDate(timestampSeconds).getHours();
      const minutes = TimeUtil.convertSecondTimestampToDate(timestampSeconds)
        .getMinutes()
        .toString()
        .padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return undefined;
    }
  }

  static convertSecondTimestampToLocaleDateString(
    timestampSeconds: number
  ): string | undefined {
    try {
      const isoString =
        TimeUtil.convertSecondTimestampToDate(timestampSeconds).toISOString();
      return isoString.toLowerCase().split('t')[0];
    } catch {
      return undefined;
    }
  }

  static formatRelativeTime(timestampSeconds: number): string {
    const now = TimeUtil.getTimestampSeconds();
    const diffInSeconds = now - timestampSeconds;

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return (
      TimeUtil.convertSecondTimestampToLocaleDateString(timestampSeconds) ?? '–'
    );
  }
}

const extendedDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

export function formatDate(
  date: Date,
  format: 'long' | 'short' | 'with-time' = 'long'
): string {
  switch (format) {
    case 'short':
      return shortDateFormatter.format(date);
    case 'long':
      return extendedDateFormatter.format(date);
    case 'with-time':
      return `${extendedDateFormatter.format(date)} - ${date.toLocaleTimeString()}`;
  }
}

export function readableDateFromTimestamp(
  date: number | undefined,
  format: 'long' | 'short' | 'with-time' = 'short'
): string {
  if (!date) {
    return '-';
  }

  return formatDate(new Date(date * 1000), format);
}

type Unit =
  | 'auto'
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';

export function diffTime(
  startDate: number,
  endDate: number,
  unit: Unit = 'auto'
): {
  value: number;
  unit: Exclude<Unit, 'auto'>;
} {
  const diff = endDate - startDate;
  const divisorPerUnit: Record<
    Exclude<Unit, 'auto' | 'millisecond'>,
    number
  > = {
    year: ONE_YEAR_MS,
    month: ONE_MONTH_MS,
    week: ONE_WEEK_MS,
    day: ONE_DAY_MS,
    hour: ONE_HOUR_MS,
    minute: ONE_MINUTE_MS,
    second: ONE_SECOND_MS,
  };

  let result: { value: number; unit: Exclude<Unit, 'auto'> } = {
    value: diff,
    unit: 'millisecond',
  };

  if (unit === 'millisecond') {
    return result;
  }

  if (unit !== 'auto') {
    return {
      value: diff / divisorPerUnit[unit],
      unit,
    };
  }

  for (const [key, divisor] of Object.entries(divisorPerUnit)) {
    const value = diff / divisor;
    const absValue = Math.abs(value);

    if (absValue > Math.abs(result.value)) {
      break;
    }

    if (absValue >= 1) {
      result = {
        value,
        unit: key as Exclude<Unit, 'auto' | 'millisecond'>,
      };
    }
  }

  return result;
}

export function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}
