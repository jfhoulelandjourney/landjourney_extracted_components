import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../directives/activate/activate.directive';
import { OrganizationService } from '../../services/organization/organization.service';
import { GuideContentService } from '../guide-content.service';
import { GuidePanelComponent } from '../guide-panel/guide-panel.component';

@Component({
  selector: 'lj-guide-toggle-button',
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    ActivateDirective,
    GuidePanelComponent,
  ],
  templateUrl: './guide-toggle-button.component.html',
  styleUrl: './guide-toggle-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideToggleButtonComponent {
  protected organizationService = inject(OrganizationService);
  protected guideContentService = inject(GuideContentService);

  readonly panelOpen = signal(false);

  toggle() {
    if (!this.guideContentService.hasContentForCurrentRoute()) {
      return;
    }
    this.panelOpen.update(open => !open);
  }

  onPanelClosed() {
    this.panelOpen.set(false);
  }

  isUserGuideEnabled() {
    const isBackoffice = this.guideContentService.isBackoffice();

    if (isBackoffice) {
      return this.organizationService.isFeatureFlagActivated(
        'USER_GUIDE_BACKOFFICE'
      );
    }

    return this.organizationService.isFeatureFlagActivated('USER_GUIDE_CLIENT');
  }
}
