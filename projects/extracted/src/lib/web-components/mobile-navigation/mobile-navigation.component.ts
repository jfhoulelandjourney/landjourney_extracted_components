import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs';

import { BottomToolbarItem } from './mobile-navigation.model';

@Component({
  selector: 'lj-mobile-nav-bar',
  imports: [RouterModule, MatIconModule, MatMenuModule],
  templateUrl: './mobile-navigation.component.html',
  styleUrl: './mobile-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'navigation',
    'aria-label': 'Mobile navigation',
    class: 'mobile-navigation',
  },
})
export class MobileNavBarComponent {
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly primaryItems = input.required<BottomToolbarItem[]>();
  readonly moreItems = input<BottomToolbarItem[]>([]);
  readonly itemAction = output<BottomToolbarItem>();

  @ViewChild(MatMenuTrigger) menuTrigger?: MatMenuTrigger;

  readonly isMoreMenuOpen = signal<boolean>(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isAnyMoreItemActive = computed(() => {
    const currentUrl = this.currentUrl();
    return this.moreItems().some(
      item => item.route && currentUrl.includes(item.route)
    );
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isMoreMenuOpen()) {
      const clickedInside = this.elementRef.nativeElement.contains(
        event.target
      );
      const clickedMenu = (event.target as HTMLElement).closest(
        '.mat-mdc-menu-panel'
      );

      if (!clickedInside && !clickedMenu) {
        this.closeMoreMenu();
      }
    }
  }

  onItemClick(item: BottomToolbarItem): void {
    this.itemAction.emit(item);
  }

  onMenuOpened(): void {
    this.isMoreMenuOpen.set(true);
  }

  onMenuClosed(): void {
    this.isMoreMenuOpen.set(false);
  }

  closeMoreMenu(): void {
    this.menuTrigger?.closeMenu();
  }
}
