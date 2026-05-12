import type { Meta, StoryObj } from '@storybook/angular';
import { PageComponent } from './page.component';

const meta: Meta<PageComponent> = {
  title: 'Web Components/Layout/Page',
  component: PageComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<PageComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <lj-page>
        <h1>Page Title</h1>
        <p>Standard page chrome — header, content area, max-width container, etc. The component is a thin layout wrapper used by every routed view.</p>
      </lj-page>
    `,
  }),
};
