import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { of } from 'rxjs';
import { Group } from '../../../models/organizationModels';
import { OrganizationService } from '../../../services/organization/organization.service';
import { GroupSelectorComponent } from './group-selector.component';

const sampleGroups: Group[] = [
  {
    id: 'g1',
    organizationId: 'org-1',
    name: 'Loan officers',
    permissions: [],
    system: false,
    workgroup: true,
  },
  {
    id: 'g2',
    organizationId: 'org-1',
    name: 'Underwriting',
    permissions: [],
    system: false,
    workgroup: true,
  },
  {
    id: 'g3',
    organizationId: 'org-1',
    name: 'Servicing',
    permissions: [],
    system: false,
    workgroup: true,
  },
  {
    id: 'g4',
    organizationId: 'org-1',
    name: 'Admins',
    permissions: [],
    system: true,
    workgroup: false,
  },
  {
    id: 'g5',
    organizationId: 'org-1',
    name: 'Read-only',
    permissions: [],
    system: true,
    workgroup: false,
  },
];

const organizationStub = {
  getGroups: () => of(sampleGroups),
} as unknown as OrganizationService;

const meta: Meta<GroupSelectorComponent> = {
  title: 'Web Components/Form/Group Selector',
  component: GroupSelectorComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [{ provide: OrganizationService, useValue: organizationStub }],
    }),
  ],
  argTypes: {
    workgroupsOnly: { control: 'boolean' },
    scrollResults: { control: 'boolean' },
    clearOnSelection: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<GroupSelectorComponent>;

export const All: Story = {
  args: { workgroupsOnly: false, scrollResults: true },
};

export const WorkgroupsOnly: Story = {
  args: { workgroupsOnly: true, scrollResults: true },
};

export const ExcludeAdmins: Story = {
  args: {
    excludeIds: ['g4'],
    workgroupsOnly: false,
  },
};
