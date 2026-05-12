import type { Meta, StoryObj } from '@storybook/angular';
import { CollapsiblePanelComponent } from './collapsible-panel.component';

const meta: Meta<CollapsiblePanelComponent> = {
  title: 'Web Components/Layout/Collapsible Panel',
  component: CollapsiblePanelComponent,
  tags: ['autodocs'],
  argTypes: {
    expanded: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<CollapsiblePanelComponent>;

export const Collapsed: Story = {
  args: { expanded: false },
  render: (args) => ({
    props: args,
    template: `
      <lj-collapsible-panel [expanded]="expanded">
        <span header>Show advanced options</span>
        <div>
          <p>Hidden until the panel is expanded.</p>
          <ul>
            <li>Loan term overrides</li>
            <li>Custom rate schedule</li>
          </ul>
        </div>
      </lj-collapsible-panel>
    `,
  }),
};

export const Expanded: Story = {
  args: { expanded: true },
  render: (args) => ({
    props: args,
    template: `
      <lj-collapsible-panel [expanded]="expanded">
        <span header>Application details</span>
        <div>
          <p>Visible because the panel is expanded.</p>
          <p>Use for non-essential context that should not crowd the page.</p>
        </div>
      </lj-collapsible-panel>
    `,
  }),
};
