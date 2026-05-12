import type { Meta, StoryObj } from '@storybook/angular';
import { ContentPanelComponent } from './content-panel.component';

const meta: Meta<ContentPanelComponent> = {
  title: 'Web Components/Layout/Content Panel',
  component: ContentPanelComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    titleColor: { control: 'select', options: ['gray', 'white'] },
    panelPosition: { control: 'select', options: ['left', 'center', 'right'] },
  },
};

export default meta;
type Story = StoryObj<ContentPanelComponent>;

export const Default: Story = {
  args: { title: 'Application summary', panelPosition: 'center' },
  render: (args) => ({
    props: args,
    template: `
      <lj-content-panel [title]="title" [titleColor]="titleColor" [panelPosition]="panelPosition">
        <p>Borrower: Pat Smith</p>
        <p>Requested: $250,000</p>
        <p>Purpose: Operating capital</p>
      </lj-content-panel>
    `,
  }),
};

export const WhiteTitleOnDark: Story = {
  args: { title: 'On dark background', titleColor: 'white' },
  render: (args) => ({
    props: args,
    template: `
      <div style="background: #0f172a; padding: 24px;">
        <lj-content-panel [title]="title" [titleColor]="titleColor">
          <p style="color: white;">Panel sitting on a dark surface.</p>
        </lj-content-panel>
      </div>
    `,
  }),
};

export const Untitled: Story = {
  render: () => ({
    template: `<lj-content-panel><p>Panel without a title.</p></lj-content-panel>`,
  }),
};
