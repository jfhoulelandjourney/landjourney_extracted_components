import { MessageFrequencies } from '../../models/requestModels';
import { TimeUtil } from '../timeUtil';

const ONE_DAY_SECONDS = 86400;

// The backend batch job runs daily at hour 16 (4 PM) in UTC
const BATCH_JOB_HOUR = 16;

/**
 * Calculates the number of days for a given attempt based on the frequency.
 */
export function getDaysForAttempt(
  frequency: MessageFrequencies,
  value: number,
  attempt: number
): number {
  switch (frequency) {
    case MessageFrequencies.DAILY:
      return attempt;
    case MessageFrequencies.WEEKLY:
      return attempt * 7;
    case MessageFrequencies.EVERY_X_DAY:
      return attempt * value;
    case MessageFrequencies.EVERY_X_WEEK:
      return attempt * value * 7;
    default:
      return attempt * value;
  }
}

/**
 * Calculates the expected send timestamp for a reminder attempt.
 *
 * @param referenceTimestamp - Start timestamp in seconds (stage change or creation date)
 * @param frequency - The cadence frequency
 * @param value - The cadence value (for EVERY_X_DAY/WEEK)
 * @param attempt - The attempt number (1-based)
 * @returns The expected send timestamp in seconds
 */
export function getExpectedReminderDate(
  referenceTimestamp: number,
  frequency: MessageFrequencies,
  value: number,
  attempt: number
): number {
  const daysToAdd = getDaysForAttempt(frequency, value, attempt);
  const minTimestamp = referenceTimestamp + daysToAdd * ONE_DAY_SECONDS;

  // Snap to the next batch job run (daily at 4 PM UTC)
  const minDate = TimeUtil.convertSecondTimestampToDate(minTimestamp);
  const batchDate = new Date(minDate);
  batchDate.setUTCHours(BATCH_JOB_HOUR, 0, 0, 0);

  if (batchDate.getTime() < minDate.getTime()) {
    batchDate.setUTCDate(batchDate.getUTCDate() + 1);
  }

  return TimeUtil.convertDateToSecondTimestamp(batchDate);
}
