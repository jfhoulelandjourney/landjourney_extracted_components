import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { of } from 'rxjs';
import type { UserProfile } from '../../../models/userModels';
import { OrganizationService } from '../../../services/organization/organization.service';
import { UserSelectorComponent } from './user-selector.component';

const sampleUsers = [
  {
    id: 'u1',
    firstName: 'Pat',
    lastName: 'Smith',
    email: 'pat.smith@example.com',
  },
  {
    id: 'u2',
    firstName: 'Casey',
    lastName: 'Lee',
    email: 'casey.lee@aglender.com',
  },
  {
    id: 'u3',
    firstName: 'Morgan',
    lastName: 'Patel',
    email: 'morgan.patel@aglender.com',
  },
  {
    id: 'u4',
    firstName: 'Jordan',
    lastName: 'Brooks',
    email: 'jordan@example.com',
  },
] as unknown as UserProfile[];

const organizationStub = {
  searchUsers: () => of(sampleUsers),
} as unknown as OrganizationService;

const meta: Meta<UserSelectorComponent> = {
  title: 'Web Components / Users / User Selector',
  component: UserSelectorComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [{ provide: OrganizationService, useValue: organizationStub }],
    }),
  ],
  argTypes: {
    employeesOnly: { control: 'boolean' },
    customersOnly: { control: 'boolean' },
    scrollResults: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<UserSelectorComponent>;

export const All: Story = {
  args: { employeesOnly: false, customersOnly: false },
};

export const EmployeesOnly: Story = {
  args: { employeesOnly: true },
};

export const CustomersOnly: Story = {
  args: { customersOnly: true },
};

export const FilteredByGroup: Story = {
  args: {
    employeesOnly: true,
    groups: ['underwriting', 'servicing'],
  },
};

export const ExcludesSomeUsers: Story = {
  args: {
    excludeIds: ['u1', 'u2'],
  },
};
