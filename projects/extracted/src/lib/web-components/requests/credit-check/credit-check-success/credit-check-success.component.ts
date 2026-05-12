
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, timer } from 'rxjs';
import type { Request } from '../../../../models/requestModels';
import { TaskStatuses, type Section } from '../../../../models/sectionModels';
import { ClientRequestsService } from '../../../../services/client/requests/client-requests.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-check-success',
  templateUrl: './credit-check-success.component.html',
  styleUrls: ['./credit-check-success.component.scss'],
  imports: [MatIconModule],
})
export class CreditCheckSuccessComponent implements OnInit {
  readonly clientRequestsService = inject(ClientRequestsService);

  creditCheckScore = input<number | undefined>(undefined);
  isMobile = input(false);
  name = input<string>();
  request = input<Request>();
  section = input.required<Section>();

  ngOnInit() {
    if (this.request()) {
      timer(500)
        .pipe(
          switchMap(() =>
            this.clientRequestsService.uploadFilesToSection(
              this.request(),
              this.section(),
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              this.section().tasks[0]!,
              (this.section().tasks[0]?.attachments ?? []).map(attachment => ({
                ...attachment,
                status: TaskStatuses.APPROVED,
              }))
            )
          )
        )
        .subscribe({});
    }
  }

  getScoreCategory(): string {
    const score = this.creditCheckScore();
    if (!score) return '';

    if (score >= 800) return 'excellent';
    if (score >= 740) return 'very-good';
    if (score >= 670) return 'good';
    if (score >= 580) return 'fair';
    return 'poor';
  }

  getScoreRating(): string {
    const category = this.getScoreCategory();
    const ratings: Record<string, string> = {
      excellent: 'Excellent',
      'very-good': 'Very Good',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor',
    };
    return ratings[category] || 'N/A';
  }

  getScoreDescription(): string {
    const category = this.getScoreCategory();
    const descriptions: Record<string, string> = {
      excellent:
        'Outstanding creditworthiness with the best loan terms available',
      'very-good': 'Very strong credit profile with excellent loan terms',
      good: 'Good credit standing with favorable loan terms',
      fair: 'Below average credit with higher interest rates',
      poor: 'Poor credit history requiring significant improvement',
    };
    return descriptions[category] || '';
  }

  getScoreColor(): string {
    const category = this.getScoreCategory();
    const colors: Record<string, string> = {
      excellent: '#10b981', // Green
      'very-good': '#3b82f6', // Blue
      good: '#8b5cf6', // Purple
      fair: '#f59e0b', // Orange
      poor: '#ef4444', // Red
    };
    return colors[category] || '#9ca3af';
  }

  getScoreRatingClass(): string {
    return `rating-${this.getScoreCategory()}`;
  }

  getCircumference(): number {
    return 2 * Math.PI * 85; // 85 is the radius
  }

  getStrokeDashOffset(): number {
    const score = this.creditCheckScore() || 0;
    const percentage = (score - 300) / (850 - 300); // Normalize to 0-1 range (300-850 scale)
    const circumference = this.getCircumference();
    return circumference * (1 - percentage);
  }
}
