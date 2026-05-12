import type { Meta, StoryObj } from '@storybook/angular';
import { TopBarAvatarComponent } from './top-bar-avatar.component';

const meta: Meta<TopBarAvatarComponent> = {
  title: 'Web Components/Layout/Top Bar Avatar',
  component: TopBarAvatarComponent,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    avatarUrl: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<TopBarAvatarComponent>;

export const Initials: Story = {
  args: { name: 'Pat Smith', avatarUrl: null },
};

export const WithImage: Story = {
  args: {
    name: 'Casey Lee',
    avatarUrl: 'https://i.pravatar.cc/64?img=12',
  },
};

export const LongName: Story = {
  args: { name: 'Mary Anne O\'Connor-Patel', avatarUrl: null },
};
