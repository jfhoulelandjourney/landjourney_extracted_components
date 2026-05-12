import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ZoomService } from 'common';

import { MobileLayoutStore } from '../../stores/mobile-layout.store';

@Component({
  selector: 'lj-main-layout',
  imports: [RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
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
export class MainLayoutComponent {
  protected readonly mobileLayoutStore = inject(MobileLayoutStore);
  protected readonly zoomService = inject(ZoomService);
}
