import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  QualifyingEnum,
  RuleTypeKeyEnum,
  type ProductDisplay,
  type ProductPart,
  type ProductRuleDisplay,
  type ProductSectionDisplay,
} from '../../../models/products/products.model';

@Component({
  selector: 'lj-product',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ActivateDirective],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductComponent {
  productDisplay = input.required<ProductDisplay>();
  onlyProgram = input<boolean>(false);
  showProductRate = input<boolean>(false);
  isCurrentProduct = input<boolean>(false);
  showProductParts = input.required<ProductPart[]>();
  showDeleteIcon = input<boolean>(false);
  readonly deleteIconClick = output<ProductDisplay>();

  // Expose enums to template
  QualifyingEnum = QualifyingEnum;
  RuleTypeKeyEnum = RuleTypeKeyEnum;

  // Track expanded categories by ID
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

  getQualifyingIcon(qualifying: QualifyingEnum): string {
    switch (qualifying) {
      case QualifyingEnum.QUALIFYING:
        return 'thumb_up';
      case QualifyingEnum.MISSING:
        return 'frame_exclamation';
      case QualifyingEnum.NOT_QUALIFYING:
        return 'block';
      default:
        return 'thumb_up';
    }
  }

  getQualifyingColor(qualifying: QualifyingEnum): string {
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

  getSectionStatusText(qualifying: QualifyingEnum): string {
    switch (qualifying) {
      case QualifyingEnum.QUALIFYING:
        return this.productDisplay().wordDisplay ?? 'Qualifying';
      case QualifyingEnum.MISSING:
        return 'Missing';
      case QualifyingEnum.NOT_QUALIFYING:
        return `Not ${this.productDisplay().wordDisplay ?? 'Qualifying'}`;
      default:
        return 'Missing';
    }
  }

  shouldShowSection(part: ProductPart): boolean {
    return this.showProductParts().includes(part);
  }

  getSectionByType(type: ProductPart): ProductSectionDisplay | undefined {
    return this.productDisplay().sections.find(
      section => section.type === type
    );
  }

  getRuleTypeDisplayName(ruleType: RuleTypeKeyEnum): string {
    const prefix = this.onlyProgram() ? 'Program' : 'Product';
    switch (ruleType) {
      case RuleTypeKeyEnum.ELIGIBILITY_RULES:
        return `${prefix} Eligibility Rules`;
      case RuleTypeKeyEnum.RENEWAL_ELIGIBILITY_RULES:
        return `${prefix} Renewal Eligibility Rules`;
      case RuleTypeKeyEnum.PRICING_RULES:
        return `${prefix} Pricing Rules`;
      default:
        return 'Rules';
    }
  }

  getRuleTypeCategoryId(ruleType: RuleTypeKeyEnum): string {
    switch (ruleType) {
      case RuleTypeKeyEnum.ELIGIBILITY_RULES:
        return 'eligibility-rules';
      case RuleTypeKeyEnum.RENEWAL_ELIGIBILITY_RULES:
        return 'renewal-eligibility-rules';
      case RuleTypeKeyEnum.PRICING_RULES:
        return 'pricing-rules';
      default:
        return 'rules';
    }
  }

  getRuleTypeValues(): RuleTypeKeyEnum[] {
    return Object.values(RuleTypeKeyEnum);
  }

  onDeleteIconClick() {
    this.deleteIconClick.emit(this.productDisplay());
  }
}
