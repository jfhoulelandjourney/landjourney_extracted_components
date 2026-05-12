import type { Meta, StoryObj } from '@storybook/angular';
import { LoadingComponent } from './loading.component';

const meta: Meta<LoadingComponent> = {
  title: 'Web Components/Feedback/Loading',
  component: LoadingComponent,
  tags: ['autodocs'],
  argTypes: {
    inline: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Standard Landjourney loading spinner. Backed by a Lottie animation. Use `inline` to fit it into a row of content.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<LoadingComponent>;

export const FullCenter: Story = {
  args: { inline: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 320px; border: 1px dashed #cbd5e1; border-radius: 8px; display: grid; place-items: center;">
        <landjourney-loading [inline]="inline"></landjourney-loading>
      </div>
    `,
  }),
};

export const Inline: Story = {
  args: { inline: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; align-items: center; gap: 12px;">
        <landjourney-loading [inline]="inline"></landjourney-loading>
        <span>Loading 12 of 50 documents…</span>
      </div>
    `,
  }),
};
