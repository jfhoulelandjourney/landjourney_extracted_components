import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts', '../src/**/*.mdx'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@chromatic-com/storybook',
    '@storybook/addon-a11y',
  ],
  staticDirs: [
    {
      from: '../src/lib/assets',
      to: '/assets/',
    },
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};
export default config;
