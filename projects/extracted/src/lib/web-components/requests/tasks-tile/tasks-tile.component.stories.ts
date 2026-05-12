import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import type { Request } from '../../../models/requestModels';
import { OrganizationService } from '../../../services/organization/organization.service';
import { TasksTileComponent } from './tasks-tile.component';

const organizationStub = {
  getOrganizationUserId: () => 'user-1',
} as unknown as OrganizationService;

const baseRequest = (
  partial: Partial<Request> & { id: string },
): Request =>
  ({
    name: 'Operating Loan — Pat Smith',
    products: ['op-loan'],
    requestType: 'STANDARD',
    productType: 'LENDING',
    statusFlow: ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'CLOSING', 'CLOSED'],
    status: 'UNDER_REVIEW',
    requestDigest: 'abc',
    sections: [],
    businesses: [],
    users: [
      {
        userId: 'user-1',
        userType: 'INDIVIDUAL',
        userRole: 'BORROWER',
        profile: { firstName: 'Pat', lastName: 'Smith' },
      },
    ],
    requestSteps: {},
    workgroupId: null,
    mode: 'STANDARD',
    clientCanInitiate: false,
    configuration: {} as Request['configuration'],
    ...partial,
  }) as unknown as Request;

const meta: Meta<TasksTileComponent> = {
  title: 'Web Components / Requests / Tasks Tile',
  component: TasksTileComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [{ provide: OrganizationService, useValue: organizationStub }],
    }),
  ],
  argTypes: {
    isMobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<TasksTileComponent>;

export const AllIncomplete: Story = {
  args: {
    request: baseRequest({ id: 'req-1' }),
  },
};

export const Mobile: Story = {
  args: {
    request: baseRequest({ id: 'req-1' }),
    isMobile: true,
  },
};
