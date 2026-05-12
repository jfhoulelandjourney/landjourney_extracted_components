import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressBarComponent } from './progress-bar.component';

const meta: Meta<ProgressBarComponent> = {
  title: 'Web Components/Feedback/Progress Bar',
  component: ProgressBarComponent,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    max: { control: 'number' },
    startLabel: { control: 'text' },
    endLabel: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<ProgressBarComponent>;

export const Default: Story = {
  args: { value: 40, max: 100 },
};

export const WithLabels: Story = {
  args: { value: 6, max: 10, startLabel: 'Step 6', endLabel: 'of 10' },
};

export const Empty: Story = {
  args: { value: 0, max: 100, startLabel: 'Just started' },
};

export const Complete: Story = {
  args: { value: 100, max: 100, startLabel: 'Complete', endLabel: '✓' },
};

export const Stages: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 480px;">
        <lj-progress-bar [value]="10" [max]="100" startLabel="Uploading"></lj-progress-bar>
        <lj-progress-bar [value]="55" [max]="100" startLabel="Processing"></lj-progress-bar>
        <lj-progress-bar [value]="90" [max]="100" startLabel="Almost done"></lj-progress-bar>
      </div>
    `,
  }),
};
