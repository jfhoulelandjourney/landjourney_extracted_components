import { updateState } from '@angular-architects/ngrx-toolkit';
import { computed, inject } from '@angular/core';
import {
  signalStoreFeature,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { DeviceDetectorService } from 'ngx-device-detector';

type MobileLayoutBaseState = {
  menuOpen: boolean;
};

export function withMobileLayoutBase() {
  return signalStoreFeature(
    withState<MobileLayoutBaseState>({
      menuOpen: false,
    }),
    withProps(() => ({
      deviceDetector: inject(DeviceDetectorService),
    })),
    withComputed(store => ({
      isMobile: computed(() => store.deviceDetector.isMobile()),
      mobileViewEnabled: computed(() => store.deviceDetector.isMobile()),
    })),
    withMethods(store => ({
      toggleMenu(): void {
        updateState(store, '[MobileLayout] Toggle Menu', {
          menuOpen: !store.menuOpen(),
        });
      },
      closeMenu(): void {
        updateState(store, '[MobileLayout] Close Menu', { menuOpen: false });
      },
      applyMobileBodyClass(): void {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (store.mobileViewEnabled()) {
          document.body.classList.add('mobile');
          if (viewportMeta) {
            viewportMeta.setAttribute(
              'content',
              'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover'
            );
          }
        } else {
          document.body.classList.remove('mobile');
          if (viewportMeta) {
            viewportMeta.setAttribute(
              'content',
              'width=device-width, initial-scale=1'
            );
          }
        }
      },
    }))
  );
}
