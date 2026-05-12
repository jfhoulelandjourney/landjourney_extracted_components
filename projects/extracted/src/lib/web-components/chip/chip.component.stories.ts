import type { Meta, StoryObj } from '@storybook/angular';
import { ChipComponent } from './chip.component';

const meta: Meta<ChipComponent> = {
  title: 'Web Components/Display/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['danger', 'info', 'muted', 'success', 'warning'],
    },
    size: { control: 'select', options: ['default', 'small'] },
    text: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<ChipComponent>;

export const Success: Story = {
  args: { variant: 'success', text: 'Approved' },
};

export const Warning: Story = {
  args: { variant: 'warning', text: 'Pending review' },
};

export const Danger: Story = {
  args: { variant: 'danger', text: 'Rejected' },
};

export const Info: Story = {
  args: { variant: 'info', text: 'New' },
};

export const Muted: Story = {
  args: { variant: 'muted', text: 'Draft' },
};

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <lj-chip variant="success" text="Success"></lj-chip>
        <lj-chip variant="info" text="Info"></lj-chip>
        <lj-chip variant="warning" text="Warning"></lj-chip>
        <lj-chip variant="danger" text="Danger"></lj-chip>
        <lj-chip variant="muted" text="Muted"></lj-chip>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <lj-chip variant="success" size="default" text="Default"></lj-chip>
        <lj-chip variant="success" size="small" text="Small"></lj-chip>
      </div>
    `,
  }),
};
