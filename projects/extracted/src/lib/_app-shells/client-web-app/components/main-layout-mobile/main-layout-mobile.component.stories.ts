import type { Meta, StoryObj } from '@storybook/angular';
import { MainLayoutMobileComponent } from './main-layout-mobile.component';

const meta: Meta<MainLayoutMobileComponent> = {
  title: 'App Shells / Client Web App / Main Layout (Mobile)',
  component: MainLayoutMobileComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The mobile-only chrome wrapper used by the client-facing app. Hosts collaborator panels and action buttons via `MobileLayoutStore`. Slot the page content inside its default `<ng-content>`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<MainLayoutMobileComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="width: 390px; height: 720px; border: 1px solid #cbd5e1; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);">
        <lj-main-layout-mobile>
          <div style="padding: 16px;">
            <h2 style="margin: 0 0 12px;">Loans</h2>
            <p style="color: #475569;">Mobile page content slotted into the layout.</p>
          </div>
        </lj-main-layout-mobile>
      </div>
    `,
  }),
};
