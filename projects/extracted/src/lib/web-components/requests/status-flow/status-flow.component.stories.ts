import type { Meta, StoryObj } from '@storybook/angular';
import { RequestStatuses } from '../../../models/requestModels';
import { StatusFlowComponent } from './status-flow.component';

const flow = [
  RequestStatuses.DRAFT,
  RequestStatuses.INITIATED,
  RequestStatuses.UNDER_REVIEW,
  RequestStatuses.UNDERWRITING,
  RequestStatuses.APPROVED,
  RequestStatuses.CLOSING,
  RequestStatuses.CLOSED,
];

const meta: Meta<StatusFlowComponent> = {
  title: 'Web Components / Requests / Status Flow',
  component: StatusFlowComponent,
  tags: ['autodocs'],
  argTypes: {
    statusClicked: { action: 'statusClicked' },
  },
};

export default meta;
type Story = StoryObj<StatusFlowComponent>;

export const AtBeginning: Story = {
  args: {
    statusFlow: flow,
    currentStatus: RequestStatuses.DRAFT,
    displayedStatus: 'Draft',
  },
};

export const InMiddle: Story = {
  args: {
    statusFlow: flow,
    currentStatus: RequestStatuses.UNDER_REVIEW,
    displayedStatus: 'Under review',
  },
};

export const NearEnd: Story = {
  args: {
    statusFlow: flow,
    currentStatus: RequestStatuses.CLOSING,
    displayedStatus: 'Closing',
  },
};

export const Complete: Story = {
  args: {
    statusFlow: flow,
    currentStatus: RequestStatuses.CLOSED,
    displayedStatus: 'Closed',
  },
};

export const ShortFlow: Story = {
  args: {
    statusFlow: [
      RequestStatuses.DRAFT,
      RequestStatuses.UNDER_REVIEW,
      RequestStatuses.APPROVED,
    ],
    currentStatus: RequestStatuses.UNDER_REVIEW,
    displayedStatus: 'Under review',
  },
};
