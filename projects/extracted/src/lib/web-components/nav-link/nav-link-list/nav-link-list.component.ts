import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { NavLinkItem } from '../model';
import { NavLinkComponent } from '../nav-link-item/nav-link.component';

@Component({
  selector: 'lj-nav-link-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavLinkComponent],
  templateUrl: './nav-link-list.component.html',
  styleUrl: './nav-link-list.component.scss',
  host: {
    role: 'list',
  },
})
export class NavLinkListComponent {
  @Input({
    required: true,
    transform: (value: NavLinkItem[] | null) => value ?? ([] as NavLinkItem[]),
  })
  links: NavLinkItem[] = [];

  protected isString(value?: unknown): value is string {
    return typeof value === 'string';
  }

  protected handleClick(event: Event, link: NavLinkItem): void {
    if ('href' in link) return;
    link.onClick?.(event);
  }
}
