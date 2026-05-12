import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  IncidentInfo,
  MaintenanceInfo,
  SoftwareUpdateService,
} from '../../../services/ui/software-update.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { MatIconModule } from '@angular/material/icon';
import { TimeUtil } from '../../../utils/timeUtil';
import { Subject, takeUntil } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { LottieWrapperComponent } from '../../lottie-wrapper/lottie-wrapper.component';
import { OrganizationService } from '../../../services/organization/organization.service';
import { MatButtonModule } from '@angular/material/button';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'lj-maintenance-notices',
  imports: [
    MatButtonModule,
    MatIconModule,
    LottieWrapperComponent,
    ActivateDirective,
  ],
  templateUrl: './maintenance-notices.component.html',
  styleUrl: './maintenance-notices.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceNoticesComponent implements OnDestroy {
  private readonly organizationService = inject(OrganizationService);
  private readonly softwareUpdateService = inject(SoftwareUpdateService);
  protected readonly deviceDetector = inject(DeviceDetectorService);

  public readonly activeIncident = signal<IncidentInfo | undefined>(undefined);
  public readonly activeMaintenance = signal<MaintenanceInfo | undefined>(
    undefined
  );
  public readonly plannedMaintenances = signal<MaintenanceInfo[]>([]);

  dismissed = signal<string[]>([]);

  private readonly destroy$ = new Subject<void>();

  constructor() {
    toObservable(this.softwareUpdateService.activeMaintenance)
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.activeMaintenance.set(value);
      });

    toObservable(this.softwareUpdateService.activeIncident)
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.activeIncident.set(value);
      });

    toObservable(this.softwareUpdateService.plannedMaintenances)
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.plannedMaintenances.set(value);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getAnimation(): string {
    const animations = ['cow', 'pig', 'sheep'];
    const randomIndex = Math.floor(Math.random() * animations.length);
    return animations[randomIndex] ?? 'cow';
  }

  getFormattedDateTime(date: number) {
    const convertedDate = TimeUtil.convertSecondTimestampToDate(date);
    return `${convertedDate.toLocaleDateString()} around ${convertedDate.toLocaleTimeString()}`;
  }

  getLogo(): string {
    return this.organizationService.getLogo();
  }

  showBanner(item: MaintenanceInfo | IncidentInfo | undefined) {
    if (!item) {
      return false;
    }

    if ('startTime' in item) {
      return !this.dismissed().includes(`${item.startTime}:${item.endTime}`);
    }

    if ('message' in item) {
      return !this.dismissed().includes(item.message);
    }

    return false;
  }

  dismiss(item: MaintenanceInfo | IncidentInfo | undefined) {
    if (!item) {
      return;
    }

    const dismissed = structuredClone(this.dismissed());

    if ('startTime' in item) {
      dismissed.push(`${item.startTime}:${item.endTime}`);
    }

    if ('message' in item) {
      dismissed.push(item.message);
    }

    this.dismissed.set(dismissed);
  }
}
