import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrganizationService } from '../organization/organization.service';

export type SnackbarStyles = 'green' | 'neutral' | 'red';

@Injectable({
  providedIn: 'root',
})
export class UiNotificationService {
  private snackbar = inject(MatSnackBar);
  private organizationService = inject(OrganizationService);

  showSnackbar(
    message: string,
    style: SnackbarStyles,
    duration = 2000,
    closeText: string | undefined = 'X'
  ) {
    if (
      this.organizationService.isFeatureFlagActivated(
        'DISABLE_ERROR_NOTIFICATIONS'
      ) &&
      style === 'red'
    ) {
      return;
    }

    this.snackbar.open(message, closeText, {
      panelClass: [`${style}-snackbar`],
      duration: duration,
    });
  }
}
