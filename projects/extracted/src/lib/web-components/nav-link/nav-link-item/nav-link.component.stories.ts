import { provideRouter } from '@angular/router';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { NavLinkComponent } from './nav-link.component';

const meta: Meta<NavLinkComponent> = {
  title: 'Web Components/Layout/Nav Link',
  component: NavLinkComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  argTypes: {
    href: { control: 'text' },
    icon: { control: 'text' },
    variant: {
      control: 'select',
      options: ['icon-only', 'text-only', 'icon-and-text'],
    },
    customSvg: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<NavLinkComponent>;

export const IconAndText: Story = {
  args: {
    href: '/dashboard',
    icon: 'dashboard',
    variant: 'icon-and-text',
  },
  render: (args) => ({
    props: args,
    template: `
      <lj-nav-link [href]="href" [icon]="icon" [variant]="variant">Dashboard</lj-nav-link>
    `,
  }),
};

export const IconOnly: Story = {
  args: { href: '/notifications', icon: 'notifications', variant: 'icon-only' },
  render: (args) => ({
    props: args,
    template: `<lj-nav-link [href]="href" [icon]="icon" [variant]="variant">Notifications</lj-nav-link>`,
  }),
};

export const TextOnly: Story = {
  args: { href: '/reports', variant: 'text-only' },
  render: (args) => ({
    props: args,
    template: `<lj-nav-link [href]="href" [variant]="variant">Reports</lj-nav-link>`,
  }),
};

export const ButtonForm: Story = {
  args: { icon: 'logout' },
  render: (args) => ({
    props: args,
    template: `<lj-nav-link [icon]="icon">Sign out</lj-nav-link>`,
  }),
};
