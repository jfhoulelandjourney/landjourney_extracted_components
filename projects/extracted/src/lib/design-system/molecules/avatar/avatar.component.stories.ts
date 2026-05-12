import type { Meta, StoryObj } from '@storybook/angular';
import { AvatarComponent } from './avatar.component';

const meta: Meta<AvatarComponent> = {
  title: 'Design System/Molecules/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  argTypes: {
    avatarUrl: {
      control: 'text',
    },
    imagePadding: {
      control: 'boolean',
    },
    name: {
      control: 'text',
    },
    showBorder: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: ['tiny', 'small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<AvatarComponent>;

export const Primary: Story = {
  args: {
    name: 'Land Owner',
    avatarUrl: null,
  },
};

export const WithImage: Story = {
  args: {
    name: 'Land Owner',
    avatarUrl: 'https://picsum.photos/id/56/2880/1920',
    imagePadding: true,
  },
};
