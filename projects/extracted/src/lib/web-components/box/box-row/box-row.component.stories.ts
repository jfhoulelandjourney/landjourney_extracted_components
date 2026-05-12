import type { Meta, StoryObj } from '@storybook/angular';
import { BoxRowComponent } from './box-row.component';

const meta: Meta<BoxRowComponent> = {
  title: 'Web Components/Layout/Box Row',
  component: BoxRowComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A horizontal row primitive with `padding*` host inputs from `SpacingDirective`. Pairs with `<lj-box>` for layout.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<BoxRowComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <lj-box-row padding="md" style="background: #f1f5f9; border-radius: 8px; gap: 12px;">
        <span style="padding: 4px 12px; background: white; border-radius: 4px;">Item A</span>
        <span style="padding: 4px 12px; background: white; border-radius: 4px;">Item B</span>
        <span style="padding: 4px 12px; background: white; border-radius: 4px;">Item C</span>
      </lj-box-row>
    `,
  }),
};

export const Stacked: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <lj-box-row padding="sm" style="background: #ecfeff;">Row sm</lj-box-row>
        <lj-box-row padding="md" style="background: #ecfeff;">Row md</lj-box-row>
        <lj-box-row padding="lg" style="background: #ecfeff;">Row lg</lj-box-row>
      </div>
    `,
  }),
};
