import type { Meta, StoryObj } from '@storybook/angular';
import { SectionContainerComponent } from './section-container.component';

const meta: Meta<SectionContainerComponent> = {
  title: 'Web Components/Layout/Section Container',
  component: SectionContainerComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    odd: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<SectionContainerComponent>;

export const WithTitle: Story = {
  args: { title: 'Active Loans' },
  render: (args) => ({
    props: args,
    template: `
      <lj-section-container [title]="title">
        <p>Section body content goes here.</p>
      </lj-section-container>
    `,
  }),
};

export const Untitled: Story = {
  render: () => ({
    template: `
      <lj-section-container>
        <p>A section without a title — useful as a generic visual grouping.</p>
      </lj-section-container>
    `,
  }),
};

export const Stacked: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <lj-section-container title="Identity verification">
          <p>Borrower identity has been confirmed via KYC.</p>
        </lj-section-container>
        <lj-section-container title="Credit check" [odd]="true">
          <p>Credit pulled 2026-04-01 — score 742.</p>
        </lj-section-container>
        <lj-section-container title="Documents">
          <p>3 of 5 documents uploaded.</p>
        </lj-section-container>
      </div>
    `,
  }),
};
