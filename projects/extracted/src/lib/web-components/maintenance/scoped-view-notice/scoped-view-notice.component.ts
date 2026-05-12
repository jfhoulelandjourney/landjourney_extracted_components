import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import {
  AuthMessages,
  IAMService,
} from '../../../services/identity/iam.service';
import { PermissionService } from '../../../services/permission/permission.service';

@Component({
  selector: 'lj-scoped-view-notice',
  imports: [MatIconModule, MatButtonModule, ActivateDirective],
  templateUrl: './scoped-view-notice.component.html',
  styleUrl: './scoped-view-notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScopedViewNoticeComponent implements OnDestroy {
  private readonly permissionService = inject(PermissionService);
  private readonly iamService = inject(IAMService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly STORAGE_KEY = 'scoped-view-notice-dismissed';

  public readonly dismissed = signal<boolean>(this.getDismissedFromStorage());

  isLoginPage = signal(false);

  constructor() {
    // Listen to auth service messages and update scoped view state

    this.router.events.subscribe(() => {
      if (window.location.href.toLowerCase().includes('/login')) {
        this.isLoginPage.set(true);
      } else {
        this.isLoginPage.set(false);
      }
    });

    if (window.location.href.toLowerCase().includes('/login')) {
      this.isLoginPage.set(true);
    }

    this.iamService.authServiceMessages
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message === AuthMessages.LOGOUT) {
          // When logout occurs, immediately clear dismissed state and stop timer
          this.dismissed.set(false);
          this.clearDismissedFromStorage();
          // The scoped view will be set to false by PermissionService
        } else if (message === AuthMessages.TOKEN_REFRESH) {
          // When login occurs, refresh permissions to update scoped view state
          this.permissionService.refreshPermissions();
          // Reset dismissed state
          this.dismissed.set(this.getDismissedFromStorage());
        }
      });
  }

  logout() {
    this.iamService.logout();
    this.router.navigateByUrl('/login');
  }

  dismiss() {
    this.dismissed.set(true);
    this.saveDismissedToStorage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getDismissedFromStorage(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  }

  private saveDismissedToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, 'true');
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  private clearDismissedFromStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  isScopedView() {
    return this.permissionService.isScopedViewComputed();
  }
}
