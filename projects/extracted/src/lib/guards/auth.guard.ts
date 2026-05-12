import { inject } from '@angular/core';
import { CanMatchFn, GuardResult, MaybeAsync, Router } from '@angular/router';
import { IAMService } from '../services/identity/iam.service';

export const authenticatedMatchGuard: CanMatchFn =
  (): MaybeAsync<GuardResult> => {
    const router = inject(Router);
    const iamService = inject(IAMService);

    const path = `${window.location.pathname}${window.location.search}`;

    if (
      path.toLowerCase().includes('login') ||
      path.toLowerCase().includes('auth')
    ) {
      iamService.setReturnUrl(undefined);
    } else {
      iamService.setReturnUrl(path);
    }

    if (iamService.isLoggedIn()) {
      return true;
    } else {
      router.navigateByUrl('/login');
      return false;
    }
  };
