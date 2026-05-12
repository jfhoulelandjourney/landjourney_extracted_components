import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import type { UserProfile } from '../../../models/userModels';
import { IAMService } from '../../../services/identity/iam.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { OrganizationUIConfiguration } from '../../../services/organization/organization.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { PermissionService } from '../../../services/permission/permission.service';
import { isNonNullable } from '../../../utils/nullishUtil';
import { LjButton2Component } from '../../button2/button.component';
import { LoadingComponent } from '../../loading/loading.component';

@Component({
  selector: 'landjourney-complete-login',
  imports: [LoadingComponent, ActivateDirective, LjButton2Component],
  templateUrl: './complete-login.component.html',
  styleUrl: './complete-login.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompleteLoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);
  private uiNotification = inject(UiNotificationService);
  private permissionService = inject(PermissionService);
  private router = inject(Router);

  showSharedDomainTenantSelection = signal(false);
  path: string | undefined = undefined;
  configurations = signal<OrganizationUIConfiguration[]>([]);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // eslint-disable-next-line
      const redirect = params['redirect'] == 'true';

      if (isNonNullable(params['token'])) {
        this.iamService.setToken(params['token']);
      }

      if (redirect) {
        if (this.iamService.isLoggedIn()) {
          this.iamService.getOwnProfile().subscribe({
            next: user => {
              this.iamService.setActiveUser(user, !this.isBackoffice());

              if (this.organizationService.uiConfiguration.sharedDomain) {
                this.showSharedDomainTenantSelectionScreen(
                  params['path'],
                  params['organization']
                );
              } else {
                this.continueLogin(params['path']);
              }
            },
            error: _error => {
              this.iamService.logout();
            },
          });
        } else {
          this.iamService.logout();
        }
      } else {
        window.close();
      }
    });
  }

  showSharedDomainTenantSelectionScreen(
    path: string | undefined,
    organization: string | undefined
  ) {
    this.path = path;

    this.organizationService
      .getSharedDomainConfigurations(
        this.organizationService.getOrganizationId()
      )
      .subscribe({
        next: configurations => {
          this.configurations.set(configurations);
          this.organizationService.setSharedDomainUIConfigurations(
            configurations
          );

          const selectedOrganizationKey =
            organization ?? this.organizationService.getSelectedOrganization();
          const selectedOrganization = configurations.find(
            configuration => configuration.dnsPrefix === selectedOrganizationKey
          );

          if (selectedOrganization) {
            this.selectOrganization(selectedOrganization);
            return;
          }

          const firstConfiguration = configurations.at(0);
          if (configurations.length === 1 && firstConfiguration) {
            this.selectOrganization(firstConfiguration);
            return;
          }

          // DO SOMETHING IF LIST IS EMPTY (FORM TO REGISTER?)

          this.showSharedDomainTenantSelection.set(true);
        },
        error: _ => {
          this.uiNotification.showSnackbar(
            'An error happened when getting the organization configurations.',
            'red'
          );
        },
      });
  }

  getLogo(): string {
    return this.organizationService.getLogo();
  }

  logout() {
    this.iamService.logout();
  }

  selectOrganization(configuration: OrganizationUIConfiguration) {
    this.organizationService.setUIConfiguration(configuration);
    this.organizationService.setSelectedOrganization(configuration.dnsPrefix);
    this.continueLogin(this.path);
  }

  continueLogin(path: string | undefined) {
    this.iamService.getOwnProfile().subscribe({
      next: (user: UserProfile) => {
        this.iamService.setActiveUser(user, true);
        const isScopedView = this.permissionService.isScopedViewComputed();

        if (
          this.organizationService.isFeatureFlagActivated(
            'ENFORCE_CLIENT_MOBILE_NUMBER'
          ) &&
          !this.isBackoffice() &&
          !isScopedView &&
          (!user.phoneNumber || user.phoneNumber.trim() === '')
        ) {
          if (path) {
            this.router.navigateByUrl(`/add-mobile-number?redirect=${path}`);
          } else {
            this.router.navigateByUrl('/add-mobile-number');
          }
        } else {
          if (path) {
            this.router.navigateByUrl(path, { state: {} });
          } else {
            this.iamService.redirectAfterLogin('/home');
          }
        }
      },
      error: _error => {
        this.iamService.logout();
      },
    });
  }

  isBackoffice(): boolean {
    return (
      window.location.hostname.toLowerCase().includes('backoffice.') ||
      window.location.hostname.toLowerCase().includes('backoffice-test.') ||
      window.location.hostname
        .toLowerCase()
        .includes('backoffice-integration.') ||
      Boolean(
        this.organizationService.uiConfiguration.backofficeFQDN?.includes(
          window.location.hostname
        )
      )
    );
  }
}
