import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { LjTabComponent } from '../tab/tab.component';
import { LjTabsComponent } from './tabs.component';

const meta: Meta<LjTabsComponent> = {
  title: 'Web Components/Layout/Tabs (lj-tabs)',
  component: LjTabsComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [LjTabComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'A simpler tab pattern than the design-system molecule — `<lj-tab>` children declare each tab and toggle their own `selected` state. Pair with content panels driven by the same selection.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<LjTabsComponent>;

export const Three: Story = {
  render: () => ({
    template: `
      <lj-tabs>
        <lj-tab name="overview" [selected]="true">Overview</lj-tab>
        <lj-tab name="details">Details</lj-tab>
        <lj-tab name="history">History</lj-tab>
      </lj-tabs>
    `,
  }),
};

export const WithDisabled: Story = {
  render: () => ({
    template: `
      <lj-tabs>
        <lj-tab name="loans" [selected]="true">Loans</lj-tab>
        <lj-tab name="docs">Documents</lj-tab>
        <lj-tab name="reports" [disabled]="true">Reports</lj-tab>
      </lj-tabs>
    `,
  }),
};

export const Many: Story = {
  render: () => ({
    template: `
      <lj-tabs>
        <lj-tab name="t1" [selected]="true">Pending</lj-tab>
        <lj-tab name="t2">Approved</lj-tab>
        <lj-tab name="t3">Rejected</lj-tab>
        <lj-tab name="t4">Closed</lj-tab>
        <lj-tab name="t5">Archived</lj-tab>
      </lj-tabs>
    `,
  }),
};
