import { provideRouter } from '@angular/router';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { NavLinkListComponent } from './nav-link-list.component';

const meta: Meta<NavLinkListComponent> = {
  title: 'Web Components/Layout/Nav Link List',
  component: NavLinkListComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
};

export default meta;
type Story = StoryObj<NavLinkListComponent>;

export const Standard: Story = {
  args: {
    links: [
      { title: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
      { title: 'Loans', href: '/loans', icon: 'loans' },
      { title: 'Documents', href: '/documents', icon: 'description' },
      { title: 'Settings', href: '/settings', icon: 'settings' },
    ],
  },
};

export const IconOnly: Story = {
  args: {
    links: [
      { title: 'Home', href: '/', icon: 'home', variant: 'icon-only' },
      {
        title: 'Notifications',
        href: '/notifications',
        icon: 'notifications',
        variant: 'icon-only',
      },
      {
        title: 'Profile',
        href: '/me',
        icon: 'account_circle',
        variant: 'icon-only',
      },
    ],
  },
};

export const TextOnly: Story = {
  args: {
    links: [
      { title: 'Overview', href: '/overview', variant: 'text-only' },
      { title: 'Activity', href: '/activity', variant: 'text-only' },
      { title: 'Reports', href: '/reports', variant: 'text-only' },
    ],
  },
};

export const WithClickHandlers: Story = {
  args: {
    links: [
      {
        title: 'Sign out',
        icon: 'logout',
        onClick: () => {
          // eslint-disable-next-line no-console
          console.log('sign out');
        },
      },
      {
        title: 'Help',
        icon: 'help',
        onClick: () => {
          // eslint-disable-next-line no-console
          console.log('help');
        },
      },
    ],
  },
};
