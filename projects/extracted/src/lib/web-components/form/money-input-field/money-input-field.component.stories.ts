import type { Meta, StoryObj } from '@storybook/angular';
import { LjMoneyInputFieldComponent } from './money-input-field.component';

const meta: Meta<LjMoneyInputFieldComponent> = {
  title: 'Web Components/Form/Money Input Field',
  component: LjMoneyInputFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'number' },
    style: { control: 'select', options: ['normal', 'gray'] },
    readonly: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LjMoneyInputFieldComponent>;

export const Default: Story = {
  args: {
    label: 'Loan amount',
    placeholder: '$0.00',
  },
};

export const Prefilled: Story = {
  args: {
    label: 'Loan amount',
    value: 250000,
  },
};

export const SmallValue: Story = {
  args: {
    label: 'Application fee',
    value: 75,
  },
};

export const Readonly: Story = {
  args: {
    label: 'Approved amount',
    value: 1250000,
    readonly: true,
  },
};

export const SideBySide: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 480px;">
        <lj-money-input-field [label]="'Requested'" [value]="500000"></lj-money-input-field>
        <lj-money-input-field [label]="'Approved'" [value]="450000" [readonly]="true"></lj-money-input-field>
      </div>
    `,
  }),
};
