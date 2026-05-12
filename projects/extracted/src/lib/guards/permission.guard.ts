import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { Actions, Resources } from '../models/organizationModels';
import { PermissionService } from '../services/permission/permission.service';

export const permissionGuard = (requiredPermission: {
  resource: Resources;
  action: Actions;
}): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const permissionService = inject(PermissionService);

    return permissionService
      .hasPermission(requiredPermission.resource, requiredPermission.action)
      .pipe(
        map(hasPermission => {
          if (hasPermission) {
            return true;
          } else {
            router.navigateByUrl('/404');
            return false;
          }
        })
      );
  };
};
