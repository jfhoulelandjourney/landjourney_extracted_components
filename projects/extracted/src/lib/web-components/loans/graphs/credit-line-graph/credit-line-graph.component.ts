import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import {
  DetailedCreditLineCompoundSchema,
  isMainlineCreditLine,
  isNLOCType,
  isStandaloneCreditLine,
  type CreditLine,
  type StepInterestRate,
} from '../../../../services/lending/models/credit-lines.models';
import {
  formatAmountFromCents,
  formatPercent,
} from '../../../../utils/numberUtil';
import { readableDateFromTimestamp } from '../../../../utils/timeUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-graph',
  templateUrl: './credit-line-graph.component.html',
  styleUrls: ['./credit-line-graph.component.scss'],
  imports: [],
})
export class CreditLineGraphComponent {
  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();

  /**
   * Calculate total credit in use, aggregating from sublines when they exist
   */
  creditInUse = computed(() => {
    const line = this.creditLine();
    if (!line) return 0;

    // For mainline credit lines with sublines, sum all subline usage
    if (line.sublines && line.sublines.length > 0) {
      return line.sublines.reduce(
        (total, subline) => total + (subline.usageCents ?? 0),
        0
      );
    }

    // For standalone credit lines, use direct usageCents
    return line.usageCents ?? 0;
  });

  /** Calculate total available credit */
  availableCredit = computed(() => {
    const line = this.creditLine();
    if (!line) return 0;
    const limit: number = line.currentCommitmentCents;
    return limit - this.creditInUse();
  });

  preApprovedCredit = computed(() => {
    return this.creditLine()?.currentCommitmentCents ?? 0;
  });

  creditInUseWidth = computed(() => {
    const totalCreditAvailable = this.creditInUse() + this.availableCredit();
    if (totalCreditAvailable === 0) return 0;
    return (this.creditInUse() / totalCreditAvailable) * 100;
  });

  availableCreditWidth = computed(() => {
    return 100 - this.creditInUseWidth();
  });

  preApprovedCreditWidth = signal(0);

  showPreApprovedCredit = computed(() => {
    const line = this.creditLine();
    if (!line) return false;

    const creditInUse = this.creditInUse();
    const availableCredit = this.availableCredit();
    const preApprovedCredit = this.preApprovedCredit();

    const byPassNLOCGraph =
      preApprovedCredit === creditInUse ||
      preApprovedCredit === availableCredit;

    return isNLOCType(line.accountType) && !byPassNLOCGraph;
  });

  isMainlineCreditLine = isMainlineCreditLine;
  isStandaloneCreditLine = isStandaloneCreditLine;

  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }

  getSublineUsagePercentage(creditSubline: CreditLine): number {
    const totalCreditAvailable = this.creditInUse() + this.availableCredit();
    if (totalCreditAvailable === 0) {
      return 0;
    }
    const percentage =
      ((creditSubline.usageCents ?? 0) / totalCreditAvailable) * 100;
    return percentage;
  }

  /**
   * Generate a consistent color for a subline based on its index
   * @param index - The index of the subline in the array
   * @returns A CSS color string
   */
  getSublineColor(index: number): string {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316', // Orange
      '#6366F1', // Indigo
      '#84CC16', // Lime
    ];

    return colors[index % colors.length] ?? '#3B82F6';
  }

  /**
   * Get the effective interest rate for a subline from stepInterestRates
   */
  getEffectiveRate(subline: CreditLine): string {
    const now = Date.now() / 1000; // Convert to seconds

    if (!subline.stepInterestRates || subline.stepInterestRates.length === 0) {
      return formatPercent(subline.interestRatePerc / 100);
    }

    // Find the active rate (current time is within the rate's period)
    // Rates should be sorted chronologically, so find the first one that has started and not expired
    const activeRate = subline.stepInterestRates.find(rate => {
      const hasStarted = rate.startOn <= now;
      const notExpired = rate.endOn === null || rate.endOn > now;
      return hasStarted && notExpired;
    });

    if (!activeRate) {
      return formatPercent(subline.interestRatePerc / 100);
    }

    // For variable rates, use effectiveVariableRate if available
    if (activeRate.rateType === 'VARIABLE') {
      if (
        activeRate.effectiveVariableRate !== null &&
        activeRate.effectiveVariableRate !== undefined
      ) {
        return formatPercent(activeRate.effectiveVariableRate / 100);
      }

      // Fallback to basis + spread format
      const { rateBasis, rateSpread } = activeRate;
      if (!rateBasis) {
        return 'N/A';
      }

      if (rateSpread === null || rateSpread === 0) {
        return rateBasis;
      }

      return `${rateBasis} ${rateSpread >= 0 ? '+' : ''}${formatPercent(rateSpread / 100)}`;
    }

    // For fixed rates
    if (
      activeRate.interestRatePerc !== null &&
      activeRate.interestRatePerc !== undefined
    ) {
      return formatPercent(activeRate.interestRatePerc / 100);
    }

    return formatPercent(subline.interestRatePerc / 100);
  }

  /**
   * Get promo end date formatted from stepInterestRates
   */
  getPromoEndDate(subline: CreditLine): string | null {
    const now = Date.now() / 1000; // Convert to seconds

    if (!subline.stepInterestRates || subline.stepInterestRates.length === 0) {
      return null;
    }

    // Find active promotional rate
    // Promo rates are identified by "promo" in comments (as per products.utils.ts)
    const promoRate = subline.stepInterestRates.find(rate => {
      const isPromoPeriod =
        rate.period?.toLowerCase().includes('promo') ||
        rate.comment?.toLowerCase().includes('promo');
      const hasStarted = rate.startOn <= now;
      const notExpired = rate.endOn === null || rate.endOn > now;

      return isPromoPeriod && hasStarted && notExpired;
    });

    if (promoRate && promoRate.endOn !== null) {
      return readableDateFromTimestamp(promoRate.endOn, 'short');
    }

    return null;
  }

  /**
   * Check if subline has active promo
   * A promo is considered active if there's a stepInterestRate with:
   * - period or comment containing "promo"
   * - current time is between startOn and endOn (or endOn is null)
   */
  hasActivePromo(subline: CreditLine): boolean {
    const now = Date.now() / 1000; // Convert to seconds for comparison with Unix timestamps

    if (!subline.stepInterestRates || subline.stepInterestRates.length === 0) {
      return false;
    }

    return subline.stepInterestRates.some(rate => {
      // Promo rates are identified by "promo" in comments (as per products.utils.ts)
      const isPromoPeriod =
        rate.period?.toLowerCase().includes('promo') ||
        rate.comment?.toLowerCase().includes('promo');
      const hasStarted = rate.startOn <= now;
      const notExpired = rate.endOn === null || rate.endOn > now;

      return isPromoPeriod && hasStarted && notExpired;
    });
  }

  /**
   * Get the rate type (FIXED or VARIABLE) for the currently active rate period
   */
  getRateType(subline: CreditLine): string {
    const now = Date.now() / 1000; // Convert to seconds
    if (!subline.stepInterestRates || subline.stepInterestRates.length === 0) {
      return 'UNKNOWN';
    }

    // Find the active rate (current time is within the rate's period)
    const activeRate = subline.stepInterestRates.find(rate => {
      const hasStarted = rate.startOn <= now;
      const notExpired = rate.endOn === null || rate.endOn > now;
      return hasStarted && notExpired;
    });

    return activeRate?.rateType ?? 'UNKNOWN';
  }

  /**
   * Get all stepInterestRates sorted chronologically (by startOn)
   */
  getSortedRates(subline: CreditLine): StepInterestRate[] {
    if (!subline.stepInterestRates || subline.stepInterestRates.length === 0) {
      return [];
    }
    return [...subline.stepInterestRates].sort((a, b) => a.startOn - b.startOn);
  }

  /**
   * Get effective rates timeline showing best promo rates first, then base rates
   * Handles multiple active promo rates by selecting the best (lowest) one
   * Chains rates together: when best promo ends, show next best rate (promo or base)
   */
  getEffectiveRatesTimeline(subline: CreditLine): StepInterestRate[] {
    const now = Date.now() / 1000; // Convert to seconds
    if (!subline.stepInterestRates || subline.stepInterestRates.length === 0) {
      return [];
    }

    const effectiveRates: StepInterestRate[] = [];
    let currentTime: number = now;

    // Sort all rates by startOn
    const allRates = [...subline.stepInterestRates].sort(
      (a, b) => a.startOn - b.startOn
    );

    // Build timeline: at each point in time, find the best available rate
    while (currentTime !== null && currentTime !== Infinity) {
      // Find all rates that are available at currentTime
      const availableRates = allRates.filter(rate => {
        const hasStarted = rate.startOn <= currentTime;
        const notExpired = rate.endOn === null || rate.endOn > currentTime;
        return hasStarted && notExpired;
      });

      if (availableRates.length === 0) {
        break;
      }

      // Find the best (lowest) rate among available rates
      let bestRate: StepInterestRate | null = null;
      let bestRateValue: number | null = null;

      for (const rate of availableRates) {
        const rateValue = this.getRateValueForComparison(rate);
        if (rateValue !== null) {
          if (bestRateValue === null || rateValue < bestRateValue) {
            bestRate = rate;
            bestRateValue = rateValue;
          }
        }
      }

      if (!bestRate) {
        break;
      }

      // Determine when this rate ends (either its natural end or when a better rate becomes available)
      let rateEndTime: number | null = bestRate.endOn;

      // Check if any other rate becomes available before this rate ends
      const bestRateStart = bestRate.startOn;
      const bestRateEnd = bestRate.endOn;
      const futureRates = allRates.filter(rate => {
        if (rate.startOn === bestRateStart && rate.endOn === bestRateEnd) {
          return false; // Same rate
        }
        const startsBeforeCurrentEnd =
          rate.startOn > currentTime &&
          (rateEndTime === null || rate.startOn < rateEndTime);
        return startsBeforeCurrentEnd;
      });

      // Find if any future rate is better
      for (const futureRate of futureRates) {
        const futureRateValue = this.getRateValueForComparison(futureRate);
        if (futureRateValue !== null && bestRateValue !== null) {
          if (futureRateValue < bestRateValue) {
            // This future rate is better, so current rate should end when it starts
            rateEndTime = futureRate.startOn;
            break;
          }
        }
      }

      // Add the rate with adjusted end time
      effectiveRates.push({
        ...bestRate,
        startOn: currentTime,
        endOn: rateEndTime,
      });

      // Move to the next time point
      if (rateEndTime === null) {
        break; // Open-ended rate, no more rates
      }
      currentTime = rateEndTime;
    }

    return effectiveRates;
  }

  /**
   * Get rate value for comparison (returns the numeric rate value)
   */
  private getRateValueForComparison(rate: StepInterestRate): number | null {
    if (rate.rateType === 'FIXED' && rate.interestRatePerc !== null) {
      return rate.interestRatePerc;
    }
    if (
      rate.rateType === 'VARIABLE' &&
      rate.effectiveVariableRate !== null &&
      rate.effectiveVariableRate !== undefined
    ) {
      return rate.effectiveVariableRate;
    }
    // For variable rates without effective rate, we can't compare properly
    return null;
  }

  /**
   * Format a single rate display value (without dates)
   */
  formatRateDisplay(rate: StepInterestRate): string {
    let rateValue = 'N/A';
    if (rate.rateType === 'FIXED' && rate.interestRatePerc !== null) {
      rateValue = formatPercent(rate.interestRatePerc / 100);
    } else if (rate.rateType === 'VARIABLE') {
      if (
        rate.effectiveVariableRate !== null &&
        rate.effectiveVariableRate !== undefined
      ) {
        rateValue = formatPercent(rate.effectiveVariableRate / 100);
      } else if (rate.rateBasis) {
        if (rate.rateSpread === null || rate.rateSpread === 0) {
          rateValue = rate.rateBasis;
        } else {
          rateValue = `${rate.rateBasis} ${rate.rateSpread >= 0 ? '+' : ''}${formatPercent(rate.rateSpread / 100)}`;
        }
      }
    }

    return rateValue;
  }

  /**
   * Format date range for a rate
   */
  formatRateDateRange(rate: StepInterestRate): string {
    const startDate = readableDateFromTimestamp(rate.startOn, 'short');
    const endDate = rate.endOn
      ? readableDateFromTimestamp(rate.endOn, 'short')
      : 'Open-ended';
    return `${startDate} - ${endDate}`;
  }

  /**
   * Check if a rate is currently active
   */
  isRateActive(rate: StepInterestRate): boolean {
    const now = Date.now() / 1000; // Convert to seconds
    const hasStarted = rate.startOn <= now;
    const notExpired = rate.endOn === null || rate.endOn > now;
    return hasStarted && notExpired;
  }

  /**
   * Check if a rate is a promo rate
   */
  isPromoRate(rate: StepInterestRate): boolean {
    return (
      rate.period?.toLowerCase().includes('promo') ||
      rate.comment?.toLowerCase().includes('promo') ||
      false
    );
  }
}
