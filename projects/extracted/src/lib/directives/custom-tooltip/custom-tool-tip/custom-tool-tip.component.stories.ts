import type { Meta, StoryObj } from '@storybook/angular';
import { CustomToolTipComponent } from './custom-tool-tip.component';

const meta: Meta<CustomToolTipComponent> = {
  title: 'Directives/Custom Tooltip',
  component: CustomToolTipComponent,
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Tooltip surface used by `CustomTooltipDirective`. Renders either plain `text` or a projected template ref.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CustomToolTipComponent>;

export const PlainText: Story = {
  args: { text: 'Tip: drag a row to reorder.' },
};

export const Long: Story = {
  args: {
    text: 'Approving this request will move it from Under Review to Approved and notify the assigned processor.',
  },
};
