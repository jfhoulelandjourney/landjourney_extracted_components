import type { Meta, StoryObj } from '@storybook/angular';
import { LjTabComponent } from './tab.component';

const meta: Meta<LjTabComponent> = {
  title: 'Web Components/Layout/Tab (lj-tab)',
  component: LjTabComponent,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LjTabComponent>;

export const Selected: Story = {
  args: { name: 'overview', selected: true },
  render: (args) => ({
    props: args,
    template: `<lj-tab [name]="name" [selected]="selected">Overview</lj-tab>`,
  }),
};

export const Idle: Story = {
  args: { name: 'details', selected: false },
  render: (args) => ({
    props: args,
    template: `<lj-tab [name]="name" [selected]="selected">Details</lj-tab>`,
  }),
};

export const Disabled: Story = {
  args: { name: 'reports', disabled: true },
  render: (args) => ({
    props: args,
    template: `<lj-tab [name]="name" [disabled]="disabled">Reports</lj-tab>`,
  }),
};
