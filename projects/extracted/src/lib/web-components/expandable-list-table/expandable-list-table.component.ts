import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'lj-expandable-list-table',
  templateUrl: './expandable-list-table.component.html',
  styleUrl: './expandable-list-table.component.scss',
  imports: [PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandableListTableComponent {
  title = input<string>('');
  searchable = input(false);
  search = input('');
  currentPage = input(0);
  totalCount = input(0);
  pageSize = input(10);

  readonly searchChange = output<string>();
  readonly changePage = output<number>();

  onSearchInput(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
