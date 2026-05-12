import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { CacheService } from '../../cache/cache.service';
import {
  DetailedLoanCompoundSchema,
  YearLoanHistoryOverviewSchema,
} from '../../lending/models/loans.models';
import { ClientLoansService } from './client-loans.service';

/**
 * Mock service that overrides only getLoanHistory to provide deterministic
 * fake data cached in localStorage for 14 days.
 */
@Injectable({ providedIn: 'root' })
export class ClientLoansMockService extends ClientLoansService {
  private static readonly STORAGE_PREFIX = 'lj.mock.loanHistory';
  private static readonly STORAGE_PREFIX_PAYMENTS = 'lj.mock.loanPayments';
  private static readonly TTL_MINUTES = 14 * 24 * 60; // 14 days

  private cacheService = inject(CacheService);

  override getLoanHistory(
    loanId: string
  ): Observable<YearLoanHistoryOverviewSchema[]> {
    const cached = this.readFromCache(loanId);
    if (cached) {
      return of(cached);
    }

    // Generate deterministically seeded fake history using loan details when available.
    return this.getLoanHistoryFromGeneratedData(loanId);
  }

  private getLoanHistoryFromGeneratedData(
    loanId: string
  ): Observable<YearLoanHistoryOverviewSchema[]> {
    // Try to use existing loan data (e.g., origination date) to constrain years
    // Fallback to current year if unavailable.
    return super.getLoanById(loanId).pipe(
      map((loan: DetailedLoanCompoundSchema) => {
        const history = this.generateHistory(loanId, loan);
        this.writeToCache(loanId, history);
        return history;
      })
    );
  }

  /**
   * Returns 5 to 7 mock payment transactions for the given loan.
   * Each payment includes a YYYY-mm-dd date string, amount in cents, and method ("wired" | "manual").
   * Results are cached for 14 days via CacheService.
   */
  getLoanPayments(
    loanId: string,
    amountCents: number
  ): Observable<
    Array<{ date: string; amountCents: number; method: 'wired' | 'manual' }>
  > {
    const cached = this.readPaymentsFromCache(loanId);
    if (cached) {
      return of(cached);
    }

    // If provided amount is unrealistically low, derive a realistic base
    const MIN_THRESHOLD = 100_00; // $100
    if (!amountCents || amountCents < MIN_THRESHOLD) {
      return super.getLoanById(loanId).pipe(
        map(loan => {
          const outstanding =
            loan?.outstandingBalanceCents ??
            loan?.currentCommitmentCents ??
            500_00;
          // Roughly 1.25% of outstanding balance; bounded to [$2,000, $35,000]
          const derivedBase = Math.min(
            Math.max(Math.round(outstanding * 0.0125), 2_000_00),
            3_500_000
          );
          const payments = this.generatePayments(loanId, derivedBase);
          this.writePaymentsToCache(loanId, payments);
          return payments;
        })
      );
    }

    const payments = this.generatePayments(loanId, amountCents);
    this.writePaymentsToCache(loanId, payments);
    return of(payments);
  }

  private generatePayments(
    loanId: string,
    amountCents: number
  ): Array<{ date: string; amountCents: number; method: 'wired' | 'manual' }> {
    const rng = this.seededRandom(this.hashStringToInt(`${loanId}:payments`));

    // from 5 to 7 payments
    const count = 5 + Math.floor(rng() * 3); // 5, 6, or 7

    // produce dates in the past, spaced 10-45 days apart
    const payments: Array<{
      date: string;
      amountCents: number;
      method: 'wired' | 'manual';
    }> = [];
    let cursor = new Date();
    for (let i = 0; i < count; i++) {
      // decrement between 10 and 45 days
      const daysBack = 10 + Math.floor(rng() * 36);
      cursor = new Date(cursor.getTime() - daysBack * 24 * 60 * 60 * 1000);

      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      const date = `${y}-${m}-${d}`;

      // small variation ~±15% of the provided amount to look realistic
      const variance = 0.85 + rng() * 0.3; // [0.85, 1.15)
      const base = Math.max(1, Math.abs(amountCents));
      const amt = Math.max(1, Math.round(base * variance));

      const method: 'wired' | 'manual' = rng() < 0.5 ? 'wired' : 'manual';
      payments.push({ date, amountCents: amt, method });
    }

    // newest first (descending by date)
    payments.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return payments;
  }

  private getPaymentsCacheKey(loanId: string): string {
    return `${ClientLoansMockService.STORAGE_PREFIX_PAYMENTS}:${loanId}`;
  }

  private readPaymentsFromCache(loanId: string): Array<{
    date: string;
    amountCents: number;
    method: 'wired' | 'manual';
  }> | null {
    try {
      const key = this.getPaymentsCacheKey(loanId);
      const value = this.cacheService.get(key) as Array<{
        date: string;
        amountCents: number;
        method: 'wired' | 'manual';
      }> | null;
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writePaymentsToCache(
    loanId: string,
    data: Array<{
      date: string;
      amountCents: number;
      method: 'wired' | 'manual';
    }>
  ): void {
    try {
      const key = this.getPaymentsCacheKey(loanId);
      this.cacheService.put(key, data, ClientLoansMockService.TTL_MINUTES);
    } catch {
      // Ignore storage errors
    }
  }

  private generateHistory(
    loanId: string,
    loan?: DetailedLoanCompoundSchema
  ): YearLoanHistoryOverviewSchema[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const originationYear = loan?.originationDate
      ? new Date(loan.originationDate).getFullYear()
      : currentYear;

    const rng = this.seededRandom(this.hashStringToInt(loanId));

    // Determine between 1 and 3 years of history deterministically per loan.
    const numYears = 1 + Math.floor(rng() * 3);

    const years: number[] = [];
    let yearCursor = currentYear;
    while (years.length < numYears && yearCursor >= originationYear) {
      years.push(yearCursor);
      yearCursor -= 1;
    }

    const history = years.map(year => {
      // Create a per-year RNG for stable numbers across fields
      const yearRng = this.seededRandom(
        this.hashStringToInt(`${loanId}:${year}`)
      );

      // Generate plausible cents values
      const principalPaid = this.roundToCents(500_00 + yearRng() * 25_000_00);
      const interestPaid = this.roundToCents(
        principalPaid * (0.08 + yearRng() * 0.12)
      );
      const principalAndInterestPaid = principalPaid + interestPaid;
      const accruedInterest = this.roundToCents(
        interestPaid * (0.05 + yearRng() * 0.1)
      );
      const lateFees = this.roundToCents(
        yearRng() < 0.3 ? 10_00 + yearRng() * 90_00 : 0
      );
      const nsfFees = this.roundToCents(
        yearRng() < 0.15 ? 10_00 + yearRng() * 40_00 : 0
      );

      const recordDate = new Date(year, 11, 31, 23, 59, 59, 999).getTime();

      return {
        loanId,
        year,
        recordDate,
        accruedInterestCents: accruedInterest,
        interestPaidCents: interestPaid,
        principalPaidCents: principalPaid,
        principalAndInterestPaidCents: principalAndInterestPaid,
        lateFeesPaidCents: lateFees,
        notSufficientFundsFeesPaidCents: nsfFees,
      } as YearLoanHistoryOverviewSchema;
    });

    // Sort newest first to match existing behavior
    history.sort((a, b) => (a.year < b.year ? 1 : -1));
    return history;
  }

  private roundToCents(value: number): number {
    return Math.max(0, Math.round(value));
  }

  private getCacheKey(loanId: string): string {
    return `${ClientLoansMockService.STORAGE_PREFIX}:${loanId}`;
  }

  private readFromCache(
    loanId: string
  ): YearLoanHistoryOverviewSchema[] | null {
    try {
      const key = this.getCacheKey(loanId);
      const value = this.cacheService.get(key) as
        | YearLoanHistoryOverviewSchema[]
        | null;
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeToCache(
    loanId: string,
    data: YearLoanHistoryOverviewSchema[]
  ): void {
    try {
      const key = this.getCacheKey(loanId);
      this.cacheService.put(key, data, ClientLoansMockService.TTL_MINUTES);
    } catch {
      // Ignore storage errors
    }
  }

  private hashStringToInt(input: string): number {
    // Simple 32-bit FNV-1a hash
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash >>> 0;
  }

  private seededRandom(seed: number): () => number {
    // Mulberry32 PRNG
    let t = seed >>> 0;
    return () => {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Registers a new payment transaction by prepending it to the cached list.
   * If no cached payments exist, initializes with just the new payment.
   */
  registerPayment(
    loanId: string,
    payment: {
      date: string;
      amountCents: number;
      method: 'wired' | 'manual';
      chequeNumber?: string | null;
    }
  ): Observable<void> {
    const cached = this.readPaymentsFromCache(loanId) ?? [];

    // Add the new payment at the start (most recent first)
    const updatedPayments = [
      {
        date: payment.date,
        amountCents: payment.amountCents,
        method: payment.method,
      },
      ...cached,
    ];

    // Re-sort to maintain newest first
    updatedPayments.sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );

    this.writePaymentsToCache(loanId, updatedPayments);
    return of(void 0);
  }
}
