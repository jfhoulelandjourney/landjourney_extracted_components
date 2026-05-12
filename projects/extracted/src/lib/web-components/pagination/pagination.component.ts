import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    OnDestroy,
    output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, map, merge, Subject, takeUntil } from 'rxjs';
import { ActivateDirective } from '../../directives/activate/activate.directive';

@Component({
  selector: 'lj-pagination',
  imports: [ActivateDirective, MatButtonModule, MatIconModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent implements OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  nextPage$ = new Subject<void>();
  prevPage$ = new Subject<void>();

  currentPageIndex = input.required<number>({
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: 'currentPage',
  });
  totalCount = input.required<number>();
  pageSize = input.required<number>();

  readonly changePage = output<number>();

  currentPageLabel = computed(() => {
    return this.currentPageIndex() + 1;
  });

  totalPages = computed(() => {
    const totalCount = this.totalCount();
    const pageSize = this.pageSize();
    if (pageSize < 1 || totalCount < 0) {
      return 0;
    }
    return Math.ceil(totalCount / pageSize);
  });

  previousPageDisabled = computed(() => {
    return this.currentPageIndex() <= 0;
  });

  nextPageDisabled = computed(() => {
    const totalPages = this.totalPages();
    const currentPageIndex = this.currentPageIndex();
    return currentPageIndex >= totalPages - 1;
  });

  ngAfterViewInit() {
    merge(this.nextPage$.pipe(map(() => 1)), this.prevPage$.pipe(map(() => -1)))
      .pipe(
        map(direction => this.currentPageIndex() + direction),
        filter(updatedPageIndex => {
          return updatedPageIndex >= 0 && updatedPageIndex < this.totalPages();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(updatedPageIndex => {
        this.changePage.emit(updatedPageIndex);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
