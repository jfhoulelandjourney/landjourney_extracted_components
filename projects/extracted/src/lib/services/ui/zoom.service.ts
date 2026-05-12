import { Injectable, signal, OnDestroy, inject } from '@angular/core';
import { noop } from 'es-toolkit';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root',
})
export class ZoomService implements OnDestroy {
  private static readonly MOBILE_ZOOM_BASE_WIDTH = 1000;

  private deviceDetector = inject(DeviceDetectorService);

  private abortController = new AbortController();
  private removeDppxListener = noop;
  currentPixelRatio = window.devicePixelRatio;
  pixelRatioCheck: number | undefined = undefined;

  zoom = 100;

  sidebarContainerStyle = signal<string>('');
  layoutContainerStyle = signal<string>('');
  layoutPageStyle = signal<string>('');
  dialogStyle = signal<string>('');
  selectItemStyle = signal<string>('');

  ngOnDestroy() {
    this.abortController.abort();
  }

  private listenPixelRatioChange() {
    this.removeDppxListener?.();
    const mediaQueryString = `(resolution: ${window.devicePixelRatio}dppx)`;
    const media = matchMedia(mediaQueryString);
    const callback = () => {
      this.checkPixelRatio();
    };
    media.addEventListener('change', callback, {
      signal: this.abortController.signal,
    });
    this.removeDppxListener = () => {
      media.removeEventListener('change', callback);
    };
  }

  constructor() {
    if (!this.deviceDetector.isMobile()) {
      this.currentPixelRatio = window.devicePixelRatio;
      this.adjustSize();
      this.listenPixelRatioChange();
    }
  }

  checkPixelRatio() {
    if (this.currentPixelRatio !== window.devicePixelRatio) {
      this.currentPixelRatio = window.devicePixelRatio;
      this.adjustSize();
      this.listenPixelRatioChange();
    }
  }

  adjustSize() {
    const innerWidth = window.innerWidth;

    if (innerWidth < 1400) {
      const zoom = Math.round((innerWidth / 1400) * 100);
      const marginLeft = Math.round((70 * zoom) / 100);

      this.sidebarContainerStyle.set(`zoom: ${zoom}%;`);
      this.layoutContainerStyle.set(`zoom: ${zoom}%;`);
      this.layoutPageStyle.set(
        `margin-left: calc(${marginLeft}px + var(--padding-comfortable))`
      );
      this.dialogStyle.set(`zoom: ${zoom}%;`);
      this.selectItemStyle.set(`zoom: ${devicePixelRatio};`);

      this.zoom = zoom;
    } else {
      this.sidebarContainerStyle.set('');
      this.layoutContainerStyle.set('');
      this.layoutPageStyle.set('');
      this.dialogStyle.set('');
      this.selectItemStyle.set('');

      this.zoom = 100;
    }
  }

  adjustMobileZoom(): void {
    const innerWidth = window.innerWidth;
    const zoom = Math.round((innerWidth / ZoomService.MOBILE_ZOOM_BASE_WIDTH) * 100);
    this.layoutContainerStyle.set(`zoom: ${zoom}%;`);
    this.layoutPageStyle.set('');
    this.sidebarContainerStyle.set('');
    this.dialogStyle.set(`zoom: ${zoom}%;`);
    this.zoom = zoom;
  }

  clearMobileZoom(): void {
    this.layoutContainerStyle.set('');
    this.layoutPageStyle.set('');
    this.sidebarContainerStyle.set('');
    this.dialogStyle.set('');
    this.zoom = 100;
  }
}
