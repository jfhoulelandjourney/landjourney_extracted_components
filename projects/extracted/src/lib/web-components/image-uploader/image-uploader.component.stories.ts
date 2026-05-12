import type { Meta, StoryObj } from '@storybook/angular';
import { ImageUploaderComponent } from './image-uploader.component';

const meta: Meta<ImageUploaderComponent> = {
  title: 'Web Components/Form/Image Uploader',
  component: ImageUploaderComponent,
  tags: ['autodocs'],
  argTypes: {
    logoUrl: { control: 'text' },
    onLogoChange: { action: 'onLogoChange' },
  },
};

export default meta;
type Story = StoryObj<ImageUploaderComponent>;

export const Empty: Story = {
  args: { logoUrl: undefined },
};

export const WithLogo: Story = {
  args: {
    logoUrl:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop',
  },
};

export const SquareLogo: Story = {
  args: {
    logoUrl: 'https://i.pravatar.cc/200?img=12',
  },
};
