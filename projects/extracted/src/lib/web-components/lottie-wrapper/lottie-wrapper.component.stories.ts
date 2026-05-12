import type { Meta, StoryObj } from '@storybook/angular';
import { LottieWrapperComponent } from './lottie-wrapper.component';

const meta: Meta<LottieWrapperComponent> = {
  title: 'Web Components/Display/Lottie Wrapper',
  component: LottieWrapperComponent,
  tags: ['autodocs'],
  argTypes: {
    jsonPath: { control: 'text' },
    width: { control: 'text' },
    height: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Wraps `ng-lottie` so callers pass a `jsonPath` instead of an `AnimationOptions` object. Provide the player globally with `provideLottieOptions` (already wired in this Storybook).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<LottieWrapperComponent>;

export const FixedSize: Story = {
  args: {
    jsonPath:
      'https://assets10.lottiefiles.com/packages/lf20_HpFqiS.json',
    width: '320px',
    height: '320px',
  },
};

export const Inline: Story = {
  args: {
    jsonPath:
      'https://assets10.lottiefiles.com/packages/lf20_HpFqiS.json',
    width: '120px',
    height: '120px',
  },
};
