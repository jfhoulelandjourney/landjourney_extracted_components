import type { Meta, StoryObj } from '@storybook/angular';
import { LjSliderTabItemComponent } from './slider-tab-item.component';

const meta: Meta<LjSliderTabItemComponent> = {
  title: 'Web Components / Slider Tab / Slider Tab Item',
  component: LjSliderTabItemComponent,
  tags: ['autodocs'],
  argTypes: {
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LjSliderTabItemComponent>;

export const Selected: Story = {
  args: { selected: true },
  render: (args) => ({
    props: args,
    template: `<lj-slider-tab [selected]="selected" [disabled]="disabled">Pending</lj-slider-tab>`,
  }),
};

export const Idle: Story = {
  args: { selected: false },
  render: (args) => ({
    props: args,
    template: `<lj-slider-tab [selected]="selected" [disabled]="disabled">Approved</lj-slider-tab>`,
  }),
};

export const Disabled: Story = {
  args: { selected: false, disabled: true },
  render: (args) => ({
    props: args,
    template: `<lj-slider-tab [selected]="selected" [disabled]="disabled">Archived</lj-slider-tab>`,
  }),
};
