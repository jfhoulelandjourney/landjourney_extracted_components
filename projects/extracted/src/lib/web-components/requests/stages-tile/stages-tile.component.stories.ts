import type { Meta, StoryObj } from '@storybook/angular';
import {
  RequestStatuses,
  type Request,
} from '../../../models/requestModels';
import { StagesTileComponent } from './stages-tile.component';

const baseRequest = (
  partial: Partial<Request> & { status: string },
): Request =>
  ({
    name: 'Operating Loan — Pat Smith',
    products: ['op-loan'],
    requestType: 'STANDARD',
    productType: 'LENDING',
    statusFlow: [
      RequestStatuses.DRAFT,
      RequestStatuses.INITIATED,
      RequestStatuses.UNDER_REVIEW,
      RequestStatuses.UNDERWRITING,
      RequestStatuses.APPROVED,
      RequestStatuses.CLOSING,
      RequestStatuses.CLOSED,
    ],
    requestDigest: 'abc',
    sections: [],
    businesses: [],
    users: [],
    requestSteps: {},
    workgroupId: null,
    mode: 'STANDARD',
    clientCanInitiate: false,
    configuration: {} as Request['configuration'],
    ...partial,
  }) as unknown as Request;

const meta: Meta<StagesTileComponent> = {
  title: 'Web Components / Requests / Stages Tile',
  component: StagesTileComponent,
  tags: ['autodocs'],
  argTypes: {
    isMobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<StagesTileComponent>;

export const EarlyDraft: Story = {
  args: {
    request: baseRequest({ status: RequestStatuses.DRAFT }),
  },
};

export const UnderReview: Story = {
  args: {
    request: baseRequest({ status: RequestStatuses.UNDER_REVIEW }),
  },
};

export const Underwriting: Story = {
  args: {
    request: baseRequest({ status: RequestStatuses.UNDERWRITING }),
  },
};

export const Approved: Story = {
  args: {
    request: baseRequest({ status: RequestStatuses.APPROVED }),
  },
};

export const Closing: Story = {
  args: {
    request: baseRequest({ status: RequestStatuses.CLOSING }),
  },
};

export const Mobile: Story = {
  args: {
    request: baseRequest({ status: RequestStatuses.UNDER_REVIEW }),
    isMobile: true,
  },
};
