import type { Meta, StoryObj } from '@storybook/angular';
import { MainLayoutComponent } from './main-layout.component';

const meta: Meta<MainLayoutComponent> = {
  title: 'App Shells / Client Web App / Main Layout (Desktop)',
  component: MainLayoutComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Desktop chrome wrapper. Hosts the routed content area; collaborator state is read from `MobileLayoutStore`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<MainLayoutComponent>;

export const WithContent: Story = {
  render: () => ({
    template: `
      <div style="width: 100%; min-height: 480px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        <lj-main-layout>
          <div style="padding: 24px;">
            <h2 style="margin: 0 0 12px;">Loans</h2>
            <p style="color: #475569;">Routed page content lives here, fed by the &lt;router-outlet&gt;.</p>
          </div>
        </lj-main-layout>
      </div>
    `,
  }),
};
