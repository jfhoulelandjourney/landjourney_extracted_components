import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  GuardResult,
  MaybeAsync,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Actions, Resources } from '../models/organizationModels';
import { IAMService } from '../services/identity/iam.service';
import { PermissionService } from '../services/permission/permission.service';

export const userMeGuard: CanActivateFn = (
  _: ActivatedRouteSnapshot,
  __: RouterStateSnapshot
): MaybeAsync<GuardResult> => {
  const router = inject(Router);
  const iamService = inject(IAMService);
  const permissionService = inject(PermissionService);

  try {
    if (!iamService.isLoggedIn()) {
      router.navigateByUrl('/login');
      return false;
    }

    const token = iamService.getJWTToken();
    if (!token) {
      router.navigateByUrl('/login');
      return false;
    }

    if (!token.scope || token.scope.length === 0) {
      // No scope field, allow access
      return true;
    }

    const currentUser = iamService.getActiveUser();
    if (!currentUser) {
      router.navigateByUrl('/login');
      return false;
    }

    const organizationId = currentUser.activeOrganization;
    if (!organizationId) {
      router.navigateByUrl('/404');
      return false;
    }

    const organizationUserId = currentUser.activeOrganizationUserId;
    if (!organizationUserId) {
      router.navigateByUrl('/404');
      return false;
    }

    // Parse scope entries to find USERS:3:{UUID} permission
    const usersPermission = token.scope.find(scopeEntry => {
      const parts = scopeEntry.split(':');

      if (parts.length !== 3) {
        return false;
      }

      const [resource, actionNumber, uuid] = parts;

      return (
        resource === Resources.USERS &&
        actionNumber === '3' &&
        uuid === organizationUserId
      );
    });

    if (!usersPermission) {
      // No matching USERS:3:{UUID} permission found in scope
      router.navigateByUrl('/404');
      return false;
    }

    // Check if user has the specific permission USERS:READ (which corresponds to action 3)
    const requiredPermission = {
      resource: Resources.USERS,
      action: Actions.READ,
    };

    return permissionService
      .hasPermission(requiredPermission.resource, requiredPermission.action)
      .pipe(
        map(hasPermission => {
          if (!hasPermission) {
            router.navigateByUrl('/404');
            return false;
          }

          return true;
        }),
        catchError(() => {
          router.navigateByUrl('/404');
          return of(false);
        })
      );
  } catch (error) {
    console.error('Error:', error);
    router.navigateByUrl('/404');
    return false;
  }
};
