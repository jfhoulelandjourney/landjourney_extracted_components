import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { ActivateDirective, PermissionService } from 'common';

export interface Breadcrumb {
  title: string;
  path?: string;
}

@Component({
  selector: 'lj-breadcrumbs',
  imports: [RouterModule, ActivateDirective, MatIconModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  private location = inject(Location);
  private router = inject(Router);

  breadcrumbs = input.required<Breadcrumb[]>();
  permissionService = inject(PermissionService);

  filteredBreadcrumbs = computed(() => {
    if (this.permissionService.isScopedViewComputed()) {
      return this.breadcrumbs().filter(
        breadcrumb => !['/home', '/requests'].includes(breadcrumb.path ?? '')
      );
    }

    return this.breadcrumbs();
  });

  goBack(): void {
    const hasPreviousNavigation = this.router.lastSuccessfulNavigation()?.previousNavigation !== null;
    if (hasPreviousNavigation) {
      this.location.back();
    } else {
      const url = this.router.lastSuccessfulNavigation()?.finalUrl?.toString() ?? '';
      const match = url.match(/^\/requests\/([^/?]+)/);
      const requestId = match?.[1] ?? null;
      if (requestId) {
        this.router.navigate(['/requests', requestId]);
      } else {
        this.router.navigate(['/home']);
      }
    }
  }
}
