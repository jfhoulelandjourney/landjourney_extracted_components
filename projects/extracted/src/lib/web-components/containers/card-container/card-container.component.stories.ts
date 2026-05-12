import type { Meta, StoryObj } from '@storybook/angular';
import { CardContainerComponent } from './card-container.component';

const meta: Meta<CardContainerComponent> = {
  title: 'Web Components/Layout/Card Container',
  component: CardContainerComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subTitle: { control: 'text' },
    carousel: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<CardContainerComponent>;

export const Default: Story = {
  args: { title: 'Active loans', subTitle: 'Updated 5 minutes ago' },
  render: (args) => ({
    props: args,
    template: `
      <landjourney-card-container [title]="title" [subTitle]="subTitle">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          <div style="padding: 16px; background: #f1f5f9; border-radius: 8px;">Card 1</div>
          <div style="padding: 16px; background: #f1f5f9; border-radius: 8px;">Card 2</div>
          <div style="padding: 16px; background: #f1f5f9; border-radius: 8px;">Card 3</div>
        </div>
      </landjourney-card-container>
    `,
  }),
};

export const Carousel: Story = {
  args: { title: 'Featured products', carousel: true },
  render: (args) => ({
    props: args,
    template: `
      <landjourney-card-container [title]="title" [carousel]="carousel">
        <div style="padding: 16px; background: #f1f5f9; border-radius: 8px; min-width: 200px;">Featured 1</div>
        <div style="padding: 16px; background: #f1f5f9; border-radius: 8px; min-width: 200px;">Featured 2</div>
        <div style="padding: 16px; background: #f1f5f9; border-radius: 8px; min-width: 200px;">Featured 3</div>
        <div style="padding: 16px; background: #f1f5f9; border-radius: 8px; min-width: 200px;">Featured 4</div>
      </landjourney-card-container>
    `,
  }),
};
