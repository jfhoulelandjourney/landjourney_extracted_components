import type { Meta, StoryObj } from '@storybook/angular';
import { EditableAvatarComponent } from './editable-avatar.component';

const meta: Meta<EditableAvatarComponent> = {
  title: 'Design System/Organisms/Editable Avatar',
  component: EditableAvatarComponent,
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
type Story = StoryObj<EditableAvatarComponent>;

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
