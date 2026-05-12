import type { Meta, StoryObj } from '@storybook/angular';
import { BoxComponent } from './box.component';

const meta: Meta<BoxComponent> = {
  title: 'Web Components/Layout/Box',
  component: BoxComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A spacing primitive with `padding*` host inputs from `SpacingDirective`. Use as a wrapper that applies design-system padding tokens.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<BoxComponent>;

export const Padded: Story = {
  render: () => ({
    template: `
      <lj-box padding="md" style="background: #f1f5f9; border-radius: 8px;">
        <div>I have <code>padding="md"</code></div>
      </lj-box>
    `,
  }),
};

export const Asymmetric: Story = {
  render: () => ({
    template: `
      <lj-box paddingBlock="lg" paddingInline="sm" style="background: #fef3c7; border-radius: 8px;">
        <div>Block padding lg, inline padding sm</div>
      </lj-box>
    `,
  }),
};

export const SizesGrid: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <lj-box padding="xs" style="background: #ecfeff; border-radius: 6px;">padding="xs"</lj-box>
        <lj-box padding="sm" style="background: #ecfeff; border-radius: 6px;">padding="sm"</lj-box>
        <lj-box padding="md" style="background: #ecfeff; border-radius: 6px;">padding="md"</lj-box>
        <lj-box padding="lg" style="background: #ecfeff; border-radius: 6px;">padding="lg"</lj-box>
        <lj-box padding="xl" style="background: #ecfeff; border-radius: 6px;">padding="xl"</lj-box>
      </div>
    `,
  }),
};
