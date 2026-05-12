import {
  withDevtools,
  withDevToolsStub,
  withGlitchTracking,
} from '@angular-architects/ngrx-toolkit';
import { isDevMode } from '@angular/core';
import { signalStore } from '@ngrx/signals';

import { withMobileLayoutBase } from './mobile-layout.feature';

const devtools = isDevMode()
  ? withDevtools('mobileLayout', withGlitchTracking())
  : withDevToolsStub('mobileLayout');

export const MobileLayoutStore = signalStore(
  { providedIn: 'root' },
  devtools,
  withMobileLayoutBase()
);
