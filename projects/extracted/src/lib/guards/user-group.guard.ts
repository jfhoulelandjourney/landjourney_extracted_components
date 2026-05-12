import { inject } from '@angular/core';
import { CanMatchFn, GuardResult, MaybeAsync, Router } from '@angular/router';
import { IAMService } from '../services/identity/iam.service';
import { OrganizationService } from '../services/organization/organization.service';
import { SystemGroups } from '../models/authModels';
import { isSubset } from 'es-toolkit';

export const userGroupGuard = (
  requiredUserGroup: SystemGroups[]
): CanMatchFn => {
  return (): MaybeAsync<GuardResult> => {
    const router = inject(Router);
    const iamService = inject(IAMService);
    const organizationService = inject(OrganizationService);

    const userGroups: string[] = iamService.getUserGroups(
      organizationService.getOrganizationId()
    );

    const hasRequiredUserGroups: boolean = isSubset(
      userGroups,
      requiredUserGroup
    );

    if (hasRequiredUserGroups) {
      return true;
    } else {
      router.navigateByUrl('/404');
      return false;
    }
  };
};
