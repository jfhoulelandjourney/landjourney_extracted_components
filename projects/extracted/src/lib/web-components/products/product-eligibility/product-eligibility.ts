import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  QualifyingEnum,
  type ProductDisplay,
  type ProductRuleDisplay,
  type ProductSectionDisplay,
} from '../../../models/products/products.model';

@Component({
  selector: 'lj-product-eligibility',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ActivateDirective],
  templateUrl: './product-eligibility.html',
  styleUrls: ['./product-eligibility.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEligibilityComponent {
  productDisplay = input.required<ProductDisplay>();
  productDisplaySection = input.required<ProductSectionDisplay>();
  isRecommended = input<boolean>(false);
  showProductRate = input<boolean>(false);
  QualifyingEnum = QualifyingEnum;

  expandedCategoryIds = signal<Set<string>>(new Set());

  toggleCategory(categoryId: string, event: MouseEvent | KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const expanded = new Set(this.expandedCategoryIds());
    if (expanded.has(categoryId)) {
      expanded.delete(categoryId);
    } else {
      expanded.add(categoryId);
    }
    this.expandedCategoryIds.set(expanded);
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategoryIds().has(categoryId);
  }

  getEligibilityIcon(qualifying: QualifyingEnum): string {
    switch (qualifying) {
      case QualifyingEnum.QUALIFYING:
        return 'check';
      case QualifyingEnum.MISSING:
        return 'error_outline';
      case QualifyingEnum.NOT_QUALIFYING:
        return 'close';
      default:
        return 'check';
    }
  }

  getEligibilityColor(qualifying: QualifyingEnum): string {
    switch (qualifying) {
      case QualifyingEnum.QUALIFYING:
        return 'var(--status-success-700)';
      case QualifyingEnum.MISSING:
        return 'var(--color--accent--warning-600, #d97706)';
      case QualifyingEnum.NOT_QUALIFYING:
        return 'var(--color--accent--danger-600, #dc2626)';
      default:
        return 'var(--status-success-700)';
    }
  }

  getRuleValueDisplay(rule: ProductRuleDisplay): string {
    const value = String(rule.valueDisplay ?? '');

    if (rule.qualifying === QualifyingEnum.MISSING) {
      if (value === '') {
        return 'Not provided';
      } else {
        return `Partially provided: ${value}`;
      }
    }

    return value;
  }
}
