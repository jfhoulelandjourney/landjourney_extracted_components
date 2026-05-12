import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { interval, Subscription } from 'rxjs';
import { TimeUtil } from '../../utils/timeUtil';

const VERSION_CHECK_INTERVAL_IN_SECONDS = 60;
const VERSION_FILE_PATH = '/version.json';
const MAINTENANCE_FILE_PATH = '/maintenance.json';

interface VersionFile {
  name: string;
  version: string;
}

export interface IncidentInfo {
  icon: string;
  message: string;
}

export interface MaintenanceInfo {
  startTime: number;
  endTime: number;
  message: string;
  plannedMessage: string;
}

export interface MaintenanceFile {
  incidentInfo?: IncidentInfo;
  maintenances: MaintenanceInfo[];
}

@Injectable({
  providedIn: 'root',
})
export class SoftwareUpdateService {
  private http = inject(HttpClient);
  private snackbar = inject(MatSnackBar);

  private currentTimestamp =
    localStorage.getItem('applicationVersion') ??
    '{{POST_BUILD_ENTERS_TIMESTAMP_HERE}}';
  private checkSubscription: Subscription | undefined;

  maintenanceFile: MaintenanceFile | undefined = undefined;

  public readonly activeIncident = signal<IncidentInfo | undefined>(undefined);
  public readonly activeMaintenance = signal<MaintenanceInfo | undefined>(
    undefined
  );
  public readonly plannedMaintenances = signal<MaintenanceInfo[]>([]);

  public startVersionChecks() {
    this.runApplicationCheck(false, true);

    this.checkSubscription = interval(
      VERSION_CHECK_INTERVAL_IN_SECONDS * 1000
    ).subscribe(() => this.runApplicationCheck(false));
  }

  public stopVersionChecks() {
    if (this.checkSubscription) {
      this.checkSubscription.unsubscribe();
    }
  }

  private runApplicationCheck(forceReload = false, initialLoad = false): void {
    const versionUrl = `${VERSION_FILE_PATH}`;

    this.http
      .get<VersionFile>(versionUrl + '?t=' + new Date().getTime()) // REQUIRED TO INVALIDATE CACHE
      .subscribe({
        next: response => {
          const newTimestamp = response.version;

          if (this.versionMismatch(newTimestamp)) {
            this.currentTimestamp = newTimestamp;
            localStorage.setItem('applicationVersion', newTimestamp);

            if (initialLoad) {
              this.updateApplication(true);
            } else {
              this.updateApplication(forceReload);
            }
          }
        },
        error: _ => {
          this.stopVersionChecks();
        },
      });

    const maintenanceUrl = `${MAINTENANCE_FILE_PATH}`;

    this.http
      .get<MaintenanceFile>(maintenanceUrl + '?t=' + new Date().getTime()) // REQUIRED TO INVALIDATE CACHE
      .subscribe({
        next: response => {
          this.maintenanceFile = response;
          this.updateMaintenanceSignals();
        },
        error: _ => {
          // Nothing to do.
        },
      });
  }

  private updateMaintenanceSignals() {
    this.activeIncident.set(this.maintenanceFile?.incidentInfo);

    const currentTimestamp = TimeUtil.getTimestampSeconds();
    const plannedMaintenances: MaintenanceInfo[] = [];

    for (const maintenance of this.maintenanceFile?.maintenances ?? []) {
      if (
        maintenance.startTime <= currentTimestamp &&
        maintenance.endTime >= currentTimestamp
      ) {
        this.activeMaintenance.set(structuredClone(maintenance));
      }

      if (maintenance.startTime > currentTimestamp) {
        plannedMaintenances.push(structuredClone(maintenance));
      }
    }

    this.plannedMaintenances.set(plannedMaintenances);
  }

  private updateApplication(forceReload: boolean): void {
    if (forceReload) {
      window.location.reload();
    } else {
      const snackBarRef = this.snackbar.open(
        'A new version of the application is available.',
        'Click here to update',
        {
          panelClass: ['neutral-snackbar'],
          duration: undefined,
        }
      );
      snackBarRef.onAction().subscribe(() => {
        // ADD UNIQUE TIMESTAMP?
        window.location.reload();
      });
    }
  }

  private versionMismatch(newTimestamp: string): boolean {
    return this.currentTimestamp !== newTimestamp;
  }
}
