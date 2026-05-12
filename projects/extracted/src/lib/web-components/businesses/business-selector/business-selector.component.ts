import { ChangeDetectionStrategy, Component, input, OnInit, output, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, debounceTime, filter, switchMap } from 'rxjs';
import * as StringUtil from '../../../utils/stringUtil';
import { OrganizationService } from '../../../services/organization/organization.service';
import type { Business } from '../../../models/businessModels';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { AvatarComponent } from '../../../design-system';

@Component({
  selector: 'lj-business-selector',
  templateUrl: './business-selector.component.html',
  styleUrls: ['./business-selector.component.scss'],
  imports: [
    FormsModule,
    MatInputModule,
    ActivateDirective,
    MatIconModule,
    AvatarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessSelectorComponent implements OnInit {
  private organizationService = inject(OrganizationService);

  scrollResults = input(true);
  excludeIds = input<string[]>([]);
  clearOnSelection = input(false);
  userId = input<string | undefined>(undefined);

  modelChanged: Subject<string> = new Subject<string>();

  id: string = StringUtil.getRandomString(12);
  searchExpression = '';
  debounceTime = 200;
  businesses = signal<Business[]>([]);
  private scopedBusinesses = signal<Business[]>([]);

  readonly businessSelected = output<Business>();

  ngOnInit() {
    this.modelChanged.pipe(debounceTime(this.debounceTime)).subscribe(() => {
      this.search();
    });

    toObservable(this.userId)
      .pipe(
        filter((id): id is string => Boolean(id)),
        switchMap(() => this.organizationService.getBusinessesForUser())
      )
      .subscribe({
        next: (businesses: Business[]) => {
          this.scopedBusinesses.set(businesses);
          this.applyClientFilter();
        },
        error: () => {
          this.scopedBusinesses.set([]);
          this.businesses.set([]);
        },
      });
  }

  private applyClientFilter() {
    const term = this.searchExpression.toLowerCase();
    const filtered = term
      ? this.scopedBusinesses().filter(b => b.name?.toLowerCase().includes(term))
      : this.scopedBusinesses();
    this.businesses.set(filtered.filter(b => !this.excludeIds().includes(b.id ?? '')));
  }

  registerModelChange() {
    this.modelChanged.next(this.searchExpression);
  }

  search() {
    if (this.userId()) {
      this.applyClientFilter();
      return;
    }
    this.organizationService.searchBusinesses(this.searchExpression).subscribe({
      next: (businesses: Business[]) => {
        this.businesses.set(
          businesses.filter(u => !this.excludeIds().includes(u.id ?? ''))
        );
      },
      error: () => {
        this.businesses.set([]);
      },
    });
  }

  formatName(business: Business): string {
    return `${business.name}`;
  }

  businessClicked(business: Business) {
    this.businessSelected.emit(business);

    if (this.clearOnSelection()) {
      this.searchExpression = '';
      this.businesses.set([]);
    }
  }

  public focus() {
    document.getElementById(this.id)?.focus();
  }
}
