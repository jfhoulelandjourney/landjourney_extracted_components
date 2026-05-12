import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { KeyValueService } from './keyValue.service';
import type { CreditCheckInput } from './models/credit-check.models';

@Injectable({
  providedIn: 'root',
})
export class CreditCheckService {
  private keyValueService = inject(KeyValueService);

  private readonly KV_KEY = 'credit_check_score_demo';

  /**
   * Get credit check data from KeyValueService for a specific organization user
   */
  public getCreditCheckData(
    organizationUserId: string
  ): Observable<number | undefined> {
    return this.keyValueService
      .getKeyValueForUser(organizationUserId, this.KV_KEY)
      .pipe(
        map(record => {
          const creditCheckValue = record?.data[0]?.data?.value;
          if (creditCheckValue) {
            return creditCheckValue as unknown as number;
          }
          return undefined;
        }),
        catchError(() => of(undefined))
      );
  }

  /**
   * Perform a credit check and store the result in KeyValueService
   * Generates a random credit score between 300-850
   */
  public check(data: CreditCheckInput): Observable<number | undefined> {
    // Generate a realistic random credit score
    const score = this.generateCreditScore();

    // Store in KeyValueService
    return this.keyValueService
      .upsertKeyValueForUser(data.organizationUserId, {
        key: this.KV_KEY,
        value: score,
      })
      .pipe(
        map(() => score),
        catchError(() => of(score)) // Return score even if storage fails
      );
  }

  // Private helper methods

  private generateCreditScore(): number {
    // Generate a weighted random score that follows realistic distribution
    // Most scores fall between 600-750
    const random = Math.random();

    if (random < 0.1) {
      // 10% chance: Poor (300-579)
      return Math.floor(Math.random() * 280) + 300;
    } else if (random < 0.25) {
      // 15% chance: Fair (580-669)
      return Math.floor(Math.random() * 90) + 580;
    } else if (random < 0.6) {
      // 35% chance: Good (670-739)
      return Math.floor(Math.random() * 70) + 670;
    } else if (random < 0.85) {
      // 25% chance: Very Good (740-799)
      return Math.floor(Math.random() * 60) + 740;
    } else {
      // 15% chance: Excellent (800-850)
      return Math.floor(Math.random() * 51) + 800;
    }
  }
}
