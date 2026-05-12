import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { PermissionService } from '../../../../services/permission/permission.service';
import {
  BreadcrumbsComponent,
  type Breadcrumb,
} from './breadcrumbs.component';

const permissionStub = {
  isScopedViewComputed: () => false,
} as unknown as PermissionService;

const scopedPermissionStub = {
  isScopedViewComputed: () => true,
} as unknown as PermissionService;

const meta: Meta<BreadcrumbsComponent> = {
  title: 'App Shells / Client Web App / Breadcrumbs',
  component: BreadcrumbsComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<BreadcrumbsComponent>;

const homeChain: Breadcrumb[] = [
  { title: 'Home', path: '/home' },
  { title: 'Loans', path: '/loans' },
  { title: 'Operating Loan #1042' },
];

const requestsChain: Breadcrumb[] = [
  { title: 'Home', path: '/home' },
  { title: 'Requests', path: '/requests' },
  { title: 'Pat Smith', path: '/requests/req-42' },
  { title: 'Identity verification' },
];

const settingsChain: Breadcrumb[] = [
  { title: 'Home', path: '/home' },
  { title: 'Settings', path: '/settings' },
  { title: 'Notifications' },
];

export const ShortChain: Story = {
  args: { breadcrumbs: homeChain },
  decorators: [
    applicationConfig({
      providers: [{ provide: PermissionService, useValue: permissionStub }],
    }),
  ],
};

export const DeepChain: Story = {
  args: { breadcrumbs: requestsChain },
  decorators: [
    applicationConfig({
      providers: [{ provide: PermissionService, useValue: permissionStub }],
    }),
  ],
};

export const Settings: Story = {
  args: { breadcrumbs: settingsChain },
  decorators: [
    applicationConfig({
      providers: [{ provide: PermissionService, useValue: permissionStub }],
    }),
  ],
};

export const ScopedView: Story = {
  args: { breadcrumbs: requestsChain },
  decorators: [
    applicationConfig({
      providers: [
        { provide: PermissionService, useValue: scopedPermissionStub },
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When PermissionService.isScopedViewComputed() returns true (e.g. a third-party with limited access), `/home` and `/requests` are filtered out of the breadcrumb chain.',
      },
    },
  },
};
