import { Injectable, OnDestroy, computed, signal, inject } from '@angular/core';
import { isNil, isNotNil } from 'es-toolkit';
import {
  BehaviorSubject,
  Observable,
  Subject,
  filter,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { Actions, Resources } from '../../models/organizationModels';
import { PermissionUtil } from '../../utils/permissionUtil';
import { AuthMessages, IAMService } from '../identity/iam.service';
import { type UserPermission } from './permission.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService implements OnDestroy {
  private iamService = inject(IAMService);

  private readonly destroy$ = new Subject<void>();
  private userPermissionSubject = new BehaviorSubject<UserPermission | null>(
    null
  );
  userPermission$ = this.userPermissionSubject
    .asObservable()
    .pipe(map(data => (isNil(data) ? {} : data)));

  private readonly scopedViewSignal = signal<boolean>(false);
  public readonly isScopedViewComputed = computed(() =>
    this.scopedViewSignal()
  );

  constructor() {
    if (this.iamService.isLoggedIn()) {
      this.iamService
        .getOwnProfile()
        .pipe(
          map(userProfile => userProfile.activeOrganization ?? ''),
          switchMap(organization => {
            const permissions =
              this.iamService.getUserPermissions(organization);
            return of(permissions);
          })
        )
        .subscribe(data => {
          this.userPermissionSubject.next(data);
          this.updateScopedView(); // Update scoped view when permissions change
        });
    }

    this.iamService.loggedIn$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.iamService.isLoggedIn()) {
        this.refreshPermissions();
      }
    });

    // Listen to auth service messages to handle login/logout events
    this.iamService.authServiceMessages.subscribe(message => {
      if (message === AuthMessages.TOKEN_REFRESH) {
        this.refreshPermissions();
      } else if (message === AuthMessages.LOGOUT) {
        this.scopedViewSignal.set(false);
        this.userPermissionSubject.next({});
        this.refreshPermissions();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshPermissions() {
    const activeUser = this.iamService.getActiveUser();

    if (!activeUser) {
      // Even if there's no active user, we should update the scoped view state
      // This is important for logout scenarios
      this.scopedViewSignal.set(false);
      this.userPermissionSubject.next({});
      this.updateScopedView();
      return;
    }

    const organization = activeUser.activeOrganization ?? '';
    const permissions = this.iamService.getUserPermissions(organization);
    this.userPermissionSubject.next(permissions);
    this.updateScopedView();
  }

  private updateScopedView(): void {
    const token = this.iamService.getJWTToken();

    if (!token) {
      this.scopedViewSignal.set(false);
      return;
    }

    if (!token.scope || token.scope.length === 0) {
      // No scope field or empty array, not scoped view
      this.scopedViewSignal.set(false);
      return;
    }

    const currentUser = this.iamService.getActiveUser();
    if (!currentUser) {
      this.scopedViewSignal.set(false);
      return;
    }

    const organizationId = currentUser.activeOrganization;
    if (!organizationId) {
      this.scopedViewSignal.set(false);
      return;
    }

    const organizationUserId = currentUser.activeOrganizationUserId;
    if (!organizationUserId) {
      this.scopedViewSignal.set(false);
      return;
    }

    // Parse scope entries to find USERS:3:{UUID} permission
    const usersPermission = token.scope.find(scopeEntry => {
      const parts = scopeEntry.split(':');
      if (parts.length !== 3) {
        return false;
      }

      const [resource, actionNumber, uuid] = parts;
      const matches =
        resource === 'USERS' &&
        actionNumber === '3' &&
        uuid === organizationUserId;

      return matches;
    });

    if (!usersPermission) {
      // No matching USERS:3:{user_id} permission found in scope
      // This means we have a scope but it doesn't contain USERS:3 for current user
      // So we're in a scoped view
      this.scopedViewSignal.set(true);
      return;
    }

    // We found a USERS:3:{user_id} permission that matches the current user
    // This means we're NOT in a scoped view (we have access to our own data)
    this.scopedViewSignal.set(false);
  }

  isAuthorized(
    userPermissions: UserPermission,
    resource: Resources,
    action: Actions
  ): boolean {
    return PermissionUtil.isAuthorized(userPermissions, resource, action);
  }

  hasPermission(resource: Resources, action: Actions): Observable<boolean> {
    return this.userPermissionSubject.pipe(
      filter(isNotNil),
      map((userPermissions: UserPermission) =>
        this.isAuthorized(userPermissions, resource, action)
      )
    );
  }

  /**
   * Checks if the current user would pass the userMeGuard conditions
   * without actually running the guard (no redirects)
   */
  isScopedView(): Observable<boolean> {
    const token = this.iamService.getJWTToken();
    if (!token) {
      return new Observable(subscriber => subscriber.next(false));
    }

    if (!token.scope || token.scope.length === 0) {
      // No scope field, allow access
      return new Observable(subscriber => subscriber.next(true));
    }

    const currentUser = this.iamService.getActiveUser();
    if (!currentUser) {
      return new Observable(subscriber => subscriber.next(false));
    }

    const organizationId = currentUser.activeOrganization;
    if (!organizationId) {
      return new Observable(subscriber => subscriber.next(false));
    }

    const organizationUserId = currentUser.activeOrganizationUserId;
    if (!organizationUserId) {
      return new Observable(subscriber => subscriber.next(false));
    }

    const usersPermission = token.scope.find(scopeEntry => {
      const parts = scopeEntry.split(':');
      if (parts.length !== 3) {
        return false;
      }

      const [resource, actionNumber, uuid] = parts;
      return (
        resource === 'USERS' &&
        actionNumber === '3' &&
        uuid === organizationUserId
      );
    });

    if (!usersPermission) {
      // No matching USERS:3:{UUID} permission found in scope
      return new Observable(subscriber => subscriber.next(false));
    }

    // Check if user has the specific permission USERS:READ (which corresponds to action 3)
    const requiredPermission = {
      resource: Resources.USERS,
      action: Actions.READ,
    };

    return this.hasPermission(
      requiredPermission.resource,
      requiredPermission.action
    );
  }
}
