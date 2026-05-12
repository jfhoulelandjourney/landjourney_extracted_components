import type { Meta, StoryObj } from '@storybook/angular';
import { StatusTagComponent } from './status-tag.component';

const meta: Meta<StatusTagComponent> = {
  title: 'Web Components/Display/Status Tag',
  component: StatusTagComponent,
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
    color: { control: 'select', options: ['gray', 'green', 'yellow', 'red'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    clickable: { control: 'boolean' },
    statusChange: { action: 'statusChange' },
  },
};

export default meta;
type Story = StoryObj<StatusTagComponent>;

export const Approved: Story = {
  args: { text: 'Approved', color: 'green' },
};

export const Pending: Story = {
  args: { text: 'Pending', color: 'yellow' },
};

export const Rejected: Story = {
  args: { text: 'Rejected', color: 'red' },
};

export const Neutral: Story = {
  args: { text: 'Draft', color: 'gray' },
};

export const Editable: Story = {
  args: {
    text: 'Pending',
    color: 'yellow',
    clickable: true,
    availableStatuses: [
      { label: 'Approved', color: 'green' },
      { label: 'Rejected', color: 'red' },
      { label: 'Pending', color: 'yellow' },
    ],
  },
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; align-items: center;">
        <landjourney-status-tag text="Small" color="green" size="small"></landjourney-status-tag>
        <landjourney-status-tag text="Medium" color="green" size="medium"></landjourney-status-tag>
        <landjourney-status-tag text="Large" color="green" size="large"></landjourney-status-tag>
      </div>
    `,
  }),
};
