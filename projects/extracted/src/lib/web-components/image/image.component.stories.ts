import type { Meta, StoryObj } from '@storybook/angular';
import { LjImageComponent } from './image.component';

const meta: Meta<LjImageComponent> = {
  title: 'Web Components/Display/Image',
  component: LjImageComponent,
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    width: { control: 'text' },
    height: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<LjImageComponent>;

export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
    alt: 'Field at sunset',
    width: '480',
    height: '320',
  },
};

export const Square: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
    alt: 'Field at sunset',
    width: '320',
    height: '320',
  },
};

export const BrokenSrcShowsError: Story = {
  args: {
    src: 'https://example.invalid/does-not-exist.jpg',
    alt: 'Will fail to load — should render the error state',
    width: '320',
    height: '200',
  },
};
