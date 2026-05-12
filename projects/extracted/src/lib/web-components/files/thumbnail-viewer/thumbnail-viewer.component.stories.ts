import type { Meta, StoryObj } from '@storybook/angular';
import { ThumbnailViewerComponent } from './thumbnail-viewer.component';

const meta: Meta<ThumbnailViewerComponent> = {
  title: 'Web Components/Display/Thumbnail Viewer',
  component: ThumbnailViewerComponent,
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text' },
    pageCount: { control: 'number' },
    size: { control: 'select', options: ['tiny', 'small', 'normal'] },
    activate: { action: 'activate' },
  },
};

export default meta;
type Story = StoryObj<ThumbnailViewerComponent>;

export const Single: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
    pageCount: 1,
    size: 'normal',
  },
};

export const MultiPage: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400',
    pageCount: 12,
    size: 'normal',
  },
};

export const Small: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200',
    pageCount: 3,
    size: 'small',
  },
};

export const Tiny: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=120',
    pageCount: 1,
    size: 'tiny',
  },
};
