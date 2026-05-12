import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { LjSliderTabItemComponent } from '../slider-tab-item/slider-tab-item.component';
import { LjSliderTabGroupComponent } from './slider-tab-group.component';

const meta: Meta<LjSliderTabGroupComponent> = {
  title: 'Web Components / Slider Tab / Slider Tab Group',
  component: LjSliderTabGroupComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [LjSliderTabItemComponent] })],
  argTypes: {
    mode: { control: 'select', options: ['horizontal', 'vertical'] },
  },
};

export default meta;
type Story = StoryObj<LjSliderTabGroupComponent>;

export const Horizontal: Story = {
  args: { mode: 'horizontal' },
  render: (args) => ({
    props: args,
    template: `
      <lj-slider-tab-group [mode]="mode" style="display: inline-block;">
        <lj-slider-tab [selected]="true">Pending</lj-slider-tab>
        <lj-slider-tab>Approved</lj-slider-tab>
        <lj-slider-tab>Rejected</lj-slider-tab>
        <lj-slider-tab [disabled]="true">Archived</lj-slider-tab>
      </lj-slider-tab-group>
    `,
  }),
};

export const Vertical: Story = {
  args: { mode: 'vertical' },
  render: (args) => ({
    props: args,
    template: `
      <lj-slider-tab-group [mode]="mode" style="display: inline-flex; flex-direction: column;">
        <lj-slider-tab [selected]="true">Overview</lj-slider-tab>
        <lj-slider-tab>Documents</lj-slider-tab>
        <lj-slider-tab>History</lj-slider-tab>
        <lj-slider-tab>Activity</lj-slider-tab>
      </lj-slider-tab-group>
    `,
  }),
};

export const ManyTabs: Story = {
  args: { mode: 'horizontal' },
  render: (args) => ({
    props: args,
    template: `
      <lj-slider-tab-group [mode]="mode">
        <lj-slider-tab [selected]="true">All</lj-slider-tab>
        <lj-slider-tab>Active</lj-slider-tab>
        <lj-slider-tab>Approved</lj-slider-tab>
        <lj-slider-tab>Pending</lj-slider-tab>
        <lj-slider-tab>Closed</lj-slider-tab>
        <lj-slider-tab>Archived</lj-slider-tab>
      </lj-slider-tab-group>
    `,
  }),
};
