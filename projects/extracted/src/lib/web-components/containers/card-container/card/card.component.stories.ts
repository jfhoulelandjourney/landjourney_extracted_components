import type { Meta, StoryObj } from '@storybook/angular';
import { CardComponent } from './card.component';

const meta: Meta<CardComponent> = {
  title: 'Web Components/Display/Card',
  component: CardComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    formattedId: { control: 'text' },
    amount: { control: 'number' },
    url: { control: 'text' },
    linkText: { control: 'text' },
    odd: { control: 'boolean' },
    showId: { control: 'boolean' },
    onClick: { action: 'onClick' },
  },
};

export default meta;
type Story = StoryObj<CardComponent>;

export const WithAmount: Story = {
  args: {
    formattedId: 'LJ-1042',
    title: 'Operating Loan',
    subtitle: 'Pat Smith',
    tags: ['active', 'priority'],
    amount: 250_000,
    showId: true,
  },
};

export const WithLinkText: Story = {
  args: {
    formattedId: 'LJ-1043',
    title: 'Equipment Loan',
    subtitle: 'Casey Lee',
    tags: ['pending'],
    linkText: 'Continue application →',
    showId: true,
  },
};

export const Minimal: Story = {
  args: {
    formattedId: 'LJ-1044',
    title: 'Land acquisition',
    subtitle: 'Morgan Patel',
    showId: true,
  },
};

export const Odd: Story = {
  args: {
    formattedId: 'LJ-1045',
    title: 'Refinance',
    subtitle: 'Jordan Brooks',
    amount: 95_000,
    odd: true,
  },
};

export const HiddenId: Story = {
  args: {
    formattedId: 'LJ-1046',
    title: 'Operating Loan',
    subtitle: 'Sage Romero',
    amount: 320_000,
    showId: false,
  },
};
