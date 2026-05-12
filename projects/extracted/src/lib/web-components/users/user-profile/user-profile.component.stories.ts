import type { Meta, StoryObj } from '@storybook/angular';
import { UserProfileComponent } from './user-profile.component';

const meta: Meta<UserProfileComponent> = {
  title: 'Web Components / Users / User Profile',
  component: UserProfileComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A presentational wrapper for user profile content. Slot the profile body — avatar, name, contact info, edit form — into the default `<ng-content>`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<UserProfileComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <lj-user-profile>
        <div style="padding: 24px;">
          <h2 style="margin: 0 0 12px;">Pat Smith</h2>
          <p>pat.smith@example.com</p>
          <p>(515) 555-0142</p>
          <p>Member since 2024</p>
        </div>
      </lj-user-profile>
    `,
  }),
};
