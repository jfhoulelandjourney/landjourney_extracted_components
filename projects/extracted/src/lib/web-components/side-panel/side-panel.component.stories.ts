import type { Meta, StoryObj } from '@storybook/angular';
import { SidePanelComponent } from './side-panel.component';

const meta: Meta<SidePanelComponent> = {
  title: 'Web Components/Layout/Side Panel',
  component: SidePanelComponent,
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' },
    closeButtonText: { control: 'text' },
    panelWidth: { control: 'text' },
    closePanel: { action: 'closePanel' },
  },
};

export default meta;
type Story = StoryObj<SidePanelComponent>;

export const Open: Story = {
  args: { isOpen: true, panelWidth: '420px' },
  render: (args) => ({
    props: args,
    template: `
      <lj-side-panel [isOpen]="isOpen" [panelWidth]="panelWidth">
        <h3 style="margin: 0 0 12px;">Loan #1042</h3>
        <p>Borrower: Pat Smith</p>
        <p>Amount: $250,000</p>
        <p>Status: Under review</p>
      </lj-side-panel>
    `,
  }),
};

export const Closed: Story = {
  args: { isOpen: false },
  render: (args) => ({
    props: args,
    template: `
      <lj-side-panel [isOpen]="isOpen">
        <p>Toggle <code>isOpen</code> to <code>true</code> to see the panel slide in.</p>
      </lj-side-panel>
    `,
  }),
};

export const Wide: Story = {
  args: { isOpen: true, panelWidth: '720px', closeButtonText: 'Done' },
  render: (args) => ({
    props: args,
    template: `
      <lj-side-panel [isOpen]="isOpen" [panelWidth]="panelWidth" [closeButtonText]="closeButtonText">
        <h3>Application details</h3>
        <p>Wider panel for review/edit flows.</p>
      </lj-side-panel>
    `,
  }),
};
