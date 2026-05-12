import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import * as StringUtil from '../../utils/stringUtil';
import type { Business } from '../../models/businessModels';
import type { UserProfile } from '../../models/userModels';
import { OrganizationService } from '../../services/organization/organization.service';
import { ActivateDirective } from '../../directives/activate/activate.directive';
import { AvatarComponent } from '../../design-system';
import { MobileSearchPlaceholderDirective } from '../../directives/mobile-search-placeholder/mobile-search-placeholder.directive';

export type CustomerOrBusiness =
  | { type: 'user'; item: UserProfile }
  | { type: 'business'; item: Business };

function userId(u: UserProfile): string {
  return u.id ?? (u as { userId?: string }).userId ?? '';
}

function getRowKey(row: CustomerOrBusiness): string {
  if (row.type === 'user') return `user:${userId(row.item)}`;
  return `business:${row.item.id ?? ''}`;
}

@Component({
  selector: 'lj-customer-business-selector',
  templateUrl: './customer-business-selector.component.html',
  styleUrl: './customer-business-selector.component.scss',
  imports: [
    FormsModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    ActivateDirective,
    AvatarComponent,
    MobileSearchPlaceholderDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerBusinessSelectorComponent implements OnInit, OnDestroy {
  private organizationService = inject(OrganizationService);
  private destroy$ = new Subject<void>();

  scrollResults = input(true);
  /** Initial selection (e.g. when re-opening). */
  initialSelection = input<CustomerOrBusiness[]>([]);

  modelChanged = new Subject<string>();
  id = StringUtil.getRandomString(12);
  searchExpression = '';
  debounceTimeMs = 200;

  results = signal<CustomerOrBusiness[]>([]);
  selected = signal<CustomerOrBusiness[]>([]);
  showResults = signal<boolean>(false);

  readonly selectionChange = output<{ users: UserProfile[]; businesses: Business[] }>();

  ngOnInit(): void {
    const initial = this.initialSelection();
    if (initial.length) {
      this.selected.set([...initial]);
    }
    this.modelChanged
      .pipe(debounceTime(this.debounceTimeMs), takeUntil(this.destroy$))
      .subscribe(() => this.search());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  registerModelChange(): void {
    this.showResults.set(true);
    this.modelChanged.next(this.searchExpression);
  }

  search(): void {
    const q = this.searchExpression.trim();
    if (!q) {
      this.results.set([]);
      this.showResults.set(false);
      return;
    }
    const excludeUserIds = new Set(
      this.selected()
        .filter(
          (s): s is { type: 'user'; item: UserProfile } => s.type === 'user'
        )
        .map(s => userId(s.item))
        .filter(Boolean)
    );
    const excludeBusinessIds = new Set(
      this.selected()
        .filter(
          (s): s is { type: 'business'; item: Business } => s.type === 'business'
        )
        .map(s => s.item.id ?? '')
        .filter(Boolean)
    );

    forkJoin({
      users: this.organizationService.searchUsers(q, false, null, true),
      businesses: this.organizationService.searchBusinesses(q),
    }).subscribe({
      next: ({ users, businesses }) => {
        const userItems: CustomerOrBusiness[] = users
          .filter(u => !excludeUserIds.has(userId(u)))
          .map(u => ({ type: 'user' as const, item: u }));
        const businessItems: CustomerOrBusiness[] = businesses
          .filter(b => !excludeBusinessIds.has(b.id ?? ''))
          .map(b => ({ type: 'business' as const, item: b }));
        this.results.set([...userItems, ...businessItems]);
      },
      error: () => this.results.set([]),
    });
  }

  displayName(row: CustomerOrBusiness): string {
    if (row.type === 'user') {
      return `${row.item.firstName} ${row.item.lastName}`;
    }
    return row.item.name;
  }

  subtitle(row: CustomerOrBusiness): string {
    return row.type === 'user' ? 'Customer' : 'Business';
  }

  avatarName(row: CustomerOrBusiness): string {
    return this.displayName(row);
  }

  avatarUrl(row: CustomerOrBusiness): string {
    if (row.type === 'user' && row.item.avatarUri) {
      return row.item.avatarUri;
    }
    return '';
  }

  selectItem(row: CustomerOrBusiness): void {
    const sel = this.selected();
    const key = getRowKey(row);
    const exists = sel.some(s => getRowKey(s) === key);
    if (exists) return;
    const next = [...sel, row];
    this.selected.set(next);
    this.emitSelection(next);
    this.showResults.set(false);
    this.searchExpression = '';
    this.results.set([]);
  }

  removeSelected(item: CustomerOrBusiness): void {
    const key = getRowKey(item);
    const sel = this.selected().filter(s => getRowKey(s) !== key);
    this.selected.set(sel);
    this.emitSelection(sel);
    this.search();
  }

  rowKey(row: CustomerOrBusiness): string {
    return getRowKey(row);
  }

  private emitSelection(sel: CustomerOrBusiness[]): void {
    const users = sel
      .filter((s): s is { type: 'user'; item: UserProfile } => s.type === 'user')
      .map(s => s.item);
    const businesses = sel
      .filter(
        (s): s is { type: 'business'; item: Business } => s.type === 'business'
      )
      .map(s => s.item);
    this.selectionChange.emit({ users, businesses });
  }
}
