import type { Meta, StoryObj } from '@storybook/angular';
import {
  LjSelectFieldComponent,
  SelectOption,
} from './select-field.component';

const states: SelectOption<string>[] = [
  { label: 'Iowa', value: 'IA' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Wisconsin', value: 'WI' },
];

const purposes: SelectOption<string>[] = [
  { label: 'Operating expenses', value: 'op' },
  { label: 'Equipment purchase', value: 'eq' },
  { label: 'Land acquisition', value: 'land' },
  { label: 'Refinance', value: 'refi', disabled: true },
];

const meta: Meta<LjSelectFieldComponent<string>> = {
  title: 'Web Components/Form/Select Field',
  component: LjSelectFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    style: { control: 'select', options: ['normal', 'gray'] },
    readonly: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LjSelectFieldComponent<string>>;

export const Default: Story = {
  args: {
    label: 'State',
    placeholder: 'Select a state',
    options: states,
  },
};

export const WithDisabledOption: Story = {
  args: {
    label: 'Loan purpose',
    placeholder: 'Choose a purpose',
    options: purposes,
  },
};

export const Prefilled: Story = {
  args: {
    label: 'State',
    options: states,
    value: 'IA',
  },
};

export const Readonly: Story = {
  args: {
    label: 'State',
    options: states,
    value: 'NE',
    readonly: true,
  },
};

export const GrayStyle: Story = {
  args: {
    label: 'State',
    placeholder: 'Select…',
    options: states,
    style: 'gray',
  },
};
