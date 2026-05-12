import type { Meta, StoryObj } from '@storybook/angular';
import { SplashLayoutComponent } from './splash-layout.component';

const meta: Meta<SplashLayoutComponent> = {
  title: 'Web Components/Layout/Splash Layout',
  component: SplashLayoutComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Full-bleed splash chrome used for unauthenticated screens (sign-in, sign-up, password reset). Slot any centered content into the default `<ng-content>`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<SplashLayoutComponent>;

export const SignIn: Story = {
  render: () => ({
    template: `
      <landjourney-splash-layout>
        <h1 style="margin: 0 0 8px;">Welcome back</h1>
        <p style="color: #475569;">Sign in to continue to Landjourney.</p>
        <button lj-button="cta" style="margin-top: 16px;">Continue with email</button>
      </landjourney-splash-layout>
    `,
  }),
};

export const ResetPassword: Story = {
  render: () => ({
    template: `
      <landjourney-splash-layout>
        <h1 style="margin: 0 0 8px;">Reset your password</h1>
        <p style="color: #475569;">We'll send a recovery link to your email.</p>
      </landjourney-splash-layout>
    `,
  }),
};
