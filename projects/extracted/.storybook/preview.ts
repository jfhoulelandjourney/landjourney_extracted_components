import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { applicationConfig, type Preview } from '@storybook/angular';
import player from 'lottie-web/build/player/lottie_svg';
import { provideLottieOptions } from 'ngx-lottie';
import { GLOBAL_STUB_PROVIDERS } from '../src/lib/_mocks/global-stub.providers';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
    options: {
      storySort: {
        order: [
          'Foundations',
          ['Tokens', 'Typography', 'Colors', 'Spacing'],
          'Design System',
          ['Primitives', 'Molecules', 'Organisms'],
          'Web Components',
          ['Form', 'Layout', 'Display', 'Feedback'],
          'Dynamic Forms',
          'User Guide',
          '*',
        ],
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [
        provideAnimations(),
        // Default empty router so stories using routerLink / RouterModule
        // can boot without requiring per-story setup.
        provideRouter([]),
        // Lottie player wired globally so any component pulling
        // `<ng-lottie>` (loading spinners, illustrations) renders.
        provideLottieOptions({ player: () => player }),
        // Auto-generated stub providers for every service in the lib.
        // Each story can override any of these with its own `applicationConfig`
        // — local providers win over global ones. See
        // scripts/generate-mock-providers.mjs and _mocks/auto-stub.ts.
        ...GLOBAL_STUB_PROVIDERS,
      ],
    }),
  ],
};

export default preview;
