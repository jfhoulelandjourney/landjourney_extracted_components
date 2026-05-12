import type { Meta, StoryObj } from '@storybook/angular';
import { LjRoundHeaderChipComponent } from './lj-round-header-chip.component';

const meta: Meta<LjRoundHeaderChipComponent> = {
  title: 'Web Components/Display/Round Header Chip',
  component: LjRoundHeaderChipComponent,
  tags: ['autodocs'],
  argTypes: {
    number: { control: 'number' },
    text: { control: 'text' },
    color: { control: 'select', options: ['brand', 'gray', 'white'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
};

export default meta;
type Story = StoryObj<LjRoundHeaderChipComponent>;

export const Default: Story = {
  args: { number: 3, text: 'requests' },
};

export const Brand: Story = {
  args: { number: 12, text: 'pending', color: 'brand' },
};

export const SizeRange: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; align-items: center;">
        <lj-round-header-chip [number]="2" text="small" size="small"></lj-round-header-chip>
        <lj-round-header-chip [number]="2" text="medium" size="medium"></lj-round-header-chip>
        <lj-round-header-chip [number]="2" text="large" size="large"></lj-round-header-chip>
      </div>
    `,
  }),
};

export const ColorRange: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; align-items: center; padding: 12px; background: #1f2937;">
        <lj-round-header-chip [number]="5" text="brand" color="brand"></lj-round-header-chip>
        <lj-round-header-chip [number]="5" text="gray" color="gray"></lj-round-header-chip>
        <lj-round-header-chip [number]="5" text="white" color="white"></lj-round-header-chip>
      </div>
    `,
  }),
};
