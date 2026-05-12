import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DEFAULT_NAV_LINK_ITEM_VARIANT, NavLinkItemVariant } from '../model';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'lj-nav-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-link.component.html',
  styleUrl: './nav-link.component.scss',
  host: {
    role: 'listitem',
    '[class.icon-only]': "variant === 'icon-only'",
    '[class.text-only]': "variant === 'text-only'",
    '[class.icon-and-text]': "variant === 'icon-and-text' || !variant",
  },
})
export class NavLinkComponent {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);

  @Input() href: string | null = null;
  @Input() icon: string | null = null;
  @Input() variant?: NavLinkItemVariant = DEFAULT_NAV_LINK_ITEM_VARIANT;
  @Input() customSvg = false;

  constructor() {
    this.matIconRegistry.addSvgIcon(
      'loans',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icons/money-receiving-dollar-icon.svg'
      )
    );
  }

  resetFocus() {
    document.body.focus();
  }
}
