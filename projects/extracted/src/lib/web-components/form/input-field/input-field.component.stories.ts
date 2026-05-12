import type { Meta, StoryObj } from '@storybook/angular';
import { LjInputFieldComponent } from './input-field.component';

const meta: Meta<LjInputFieldComponent> = {
  title: 'Web Components/Form/Input Field',
  component: LjInputFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    type: {
      control: 'select',
      options: ['text', 'email', 'tel', 'number', 'date'],
    },
    style: { control: 'select', options: ['normal', 'gray'] },
    readonly: { control: 'boolean' },
    showError: { control: 'boolean' },
    autocomplete: { control: 'boolean' },
    customErrorMessage: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<LjInputFieldComponent>;

export const Default: Story = {
  args: {
    label: 'Borrower email',
    placeholder: 'borrower@example.com',
    type: 'email',
  },
};

export const Prefilled: Story = {
  args: {
    label: 'Borrower email',
    type: 'email',
    value: 'pat.smith@example.com',
  },
};

export const WithBeforeAfter: Story = {
  args: {
    label: 'Loan amount',
    type: 'number',
    before: '$',
    after: 'USD',
    value: '250000',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    value: 'not-an-email',
    customErrorMessage: 'Please enter a valid email address.',
  },
};

export const Readonly: Story = {
  args: {
    label: 'Customer ID',
    value: 'LJ-1042-X9',
    readonly: true,
  },
};

export const GrayStyle: Story = {
  args: {
    label: 'Reference',
    placeholder: 'Optional',
    style: 'gray',
  },
};

export const Autocomplete: Story = {
  args: {
    label: 'Borrower',
    placeholder: 'Search by name',
    autocomplete: true,
    autocompleteOptions: [
      { id: '1', value: 'Pat Smith' },
      { id: '2', value: 'Casey Lee' },
      { id: '3', value: 'Morgan Patel' },
      { id: '4', value: 'Jordan Brooks' },
    ],
  },
};
