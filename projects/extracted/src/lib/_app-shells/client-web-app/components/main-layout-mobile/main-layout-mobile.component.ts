import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MobileLayoutStore } from '../../stores/mobile-layout.store';

@Component({
  selector: 'lj-main-layout-mobile',
  templateUrl: './main-layout-mobile.component.html',
  styleUrl: './main-layout-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collaborators-compact]':
      'mobileLayoutStore.collaboratorState() === "compact"',
    '[class.collaborators-open]': 'mobileLayoutStore.collaboratorsOpen()',
    '[style.--collaborator-panel-entities-count]':
      'mobileLayoutStore.collaboratorPanelEntitiesCount()',
    '[style.--panel-action-buttons-count]':
      'mobileLayoutStore.actionButtonsInPanelCount()',
  },
})
export class MainLayoutMobileComponent {
  protected readonly mobileLayoutStore = inject(MobileLayoutStore);
}
