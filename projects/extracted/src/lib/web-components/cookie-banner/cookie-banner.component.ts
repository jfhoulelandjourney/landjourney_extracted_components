import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../directives/activate/activate.directive';
import { CookieConsentService } from '../../services/cookie-consent/cookie-consent.service';
import { EnvironmentService } from '../../services/environment/environment.service';
import { IAMService } from '../../services/identity/iam.service';
import { OpenReplayService } from '../../services/openreplay.service';
import { OrganizationService } from '../../services/organization/organization.service';
import { LjButtonComponent } from '../button/button.component';

@Component({
  selector: 'lj-cookie-banner',
  imports: [LjButtonComponent, ActivateDirective, MatIconModule],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieBannerComponent {
  private readonly cookieConsent = inject(CookieConsentService);
  private readonly organizationService = inject(OrganizationService);
  private readonly openReplayService = inject(OpenReplayService);
  private readonly iamService = inject(IAMService);
  private readonly environmentService = inject(EnvironmentService);
  private uiConfig = toSignal(this.organizationService.uiConfiguration$);

  cookiePolicyUrl = computed(
    () => this.uiConfig()?.cookiePolicyUrl ?? undefined
  );

  visible = computed(
    () =>
      this.organizationService.isFeatureFlagActivated(
        'COOKIE_CONSENT_BANNER'
      ) && this.cookieConsent.shouldShowBanner()
  );

  accept(): void {
    this.cookieConsent.setConsent('accepted');
    if (!this.environmentService.isLocal() && this.iamService.isLoggedIn()) {
      this.openReplayService.start();
    }
  }

  reject(): void {
    this.cookieConsent.setConsent('rejected');
    this.openReplayService.stop();
  }
}
