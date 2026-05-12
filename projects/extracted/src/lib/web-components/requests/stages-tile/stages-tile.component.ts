import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { Request } from '../../../models/requestModels';
import { capitalize } from '../../../utils/stringUtil';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'lj-request-stages-tile',
  templateUrl: './stages-tile.component.html',
  styleUrls: ['./stages-tile.component.scss'],
  imports: [MatIconModule, ActivateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StagesTileComponent {
  request = input<Request | undefined>();
  isMobile = input<boolean>(false);

  showAllStages = signal(false);

  currentIndex = computed(() => {
    return this.steps().findIndex(
      step => this.request()?.status === step.status
    );
  });

  toggleAllStages() {
    this.showAllStages.set(!this.showAllStages());
  }

  steps = computed(() => {
    const request = this.request();

    if (!request) {
      return [];
    }

    const steps = request.statusFlow.map((status, index) => {
      if (index === request.statusFlow.length - 1) {
        return {
          status,
          title: capitalize(status.toLowerCase()),
          asset: 'assets/misc/progress-step/crops_evolution_6.svg',
        };
      }

      if (index > 4) {
        return {
          status,
          title: capitalize(status.toLowerCase()),
          asset: 'assets/misc/progress-step/crops_evolution_5.svg',
        };
      }

      return {
        status,
        title: capitalize(status.toLowerCase()),
        asset: `assets/misc/progress-step/crops_evolution_${index + 1}.svg`,
      };
    });

    return steps;
  });
}
