import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { ZoomService } from '../../../services/ui/zoom.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'lj-base-dialog',
  imports: [],
  templateUrl: './base-dialog.component.html',
  styleUrl: './base-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDialogComponent implements OnDestroy {
  zoomService = inject(ZoomService);
  dialog = inject(ElementRef);

  destroy$ = new Subject<void>();

  constructor() {
    this.dialog.nativeElement.setAttribute(
      'style',
      this.zoomService.dialogStyle()
    );
    const openedDialogs = document.getElementsByClassName(
      'mat-mdc-dialog-panel'
    );
    const screenWidth = window.innerWidth;

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < openedDialogs.length; i++) {
      const item = openedDialogs[i];

      if (item) {
        const originalWidth = item.clientWidth;
        if (originalWidth > screenWidth * 0.7) {
          item.setAttribute('style', `width: ${screenWidth * 0.7}px;`);
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
