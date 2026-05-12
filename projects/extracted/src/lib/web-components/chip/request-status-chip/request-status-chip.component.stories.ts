import type { Meta, StoryObj } from '@storybook/angular';
import { SectionStatuses } from '../../../models/sectionModels';
import { RequestStatusChipComponent } from './request-status-chip.component';

const meta: Meta<RequestStatusChipComponent> = {
  title: 'Web Components/Display/Request Status Chip',
  component: RequestStatusChipComponent,
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select', options: Object.values(SectionStatuses) },
    closed: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<RequestStatusChipComponent>;

export const Draft: Story = {
  args: { status: SectionStatuses.DRAFT, closed: false },
};

export const InProgress: Story = {
  args: { status: SectionStatuses.IN_PROGRESS, closed: false },
};

export const UnderReview: Story = {
  args: { status: SectionStatuses.UNDER_REVIEW, closed: false },
};

export const Closed: Story = {
  args: { status: SectionStatuses.IN_PROGRESS, closed: true },
};

export const AllStatuses: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <lj-request-status-chip status="DRAFT"></lj-request-status-chip>
        <lj-request-status-chip status="INCOMPLETE"></lj-request-status-chip>
        <lj-request-status-chip status="IN_PROGRESS"></lj-request-status-chip>
        <lj-request-status-chip status="SUBMITTED"></lj-request-status-chip>
        <lj-request-status-chip status="UNDER_REVIEW"></lj-request-status-chip>
        <lj-request-status-chip status="DRAFT" [closed]="true"></lj-request-status-chip>
      </div>
    `,
  }),
};
