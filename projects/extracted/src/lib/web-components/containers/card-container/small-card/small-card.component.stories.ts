import { provideRouter } from '@angular/router';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { SmallCardComponent } from './small-card.component';

const meta: Meta<SmallCardComponent> = {
  title: 'Web Components/Display/Small Card',
  component: SmallCardComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    iconSrc: { control: 'text' },
    backgroundImage: { control: 'text' },
    dark: { control: 'boolean' },
    shape: { control: 'select', options: ['square', 'circle'] },
    alignContent: { control: 'select', options: ['left', 'center'] },
    linkText: { control: 'text' },
    url: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<SmallCardComponent>;

export const Default: Story = {
  args: {
    title: 'New request',
    subtitle: 'Start a fresh loan application',
    linkText: 'Begin →',
  },
};

export const Dark: Story = {
  args: {
    title: 'Premium offer',
    subtitle: 'Discounted operating loan for Q3',
    linkText: 'Learn more',
    dark: true,
    backgroundImage:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600',
  },
};

export const Centered: Story = {
  args: {
    title: 'Profile',
    subtitle: 'View account details',
    alignContent: 'center',
  },
};
