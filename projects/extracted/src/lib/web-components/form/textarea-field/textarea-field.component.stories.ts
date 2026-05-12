import type { Meta, StoryObj } from '@storybook/angular';
import { LjTextareaFieldComponent } from './textarea-field.component';

const meta: Meta<LjTextareaFieldComponent> = {
  title: 'Web Components/Form/Textarea Field',
  component: LjTextareaFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    minRows: { control: { type: 'number', min: 1, max: 20 } },
    maxRows: { control: { type: 'number', min: 1, max: 30 } },
    showCounter: { control: 'boolean' },
    readonly: { control: 'boolean' },
    style: { control: 'select', options: ['normal', 'gray'] },
  },
};

export default meta;
type Story = StoryObj<LjTextareaFieldComponent>;

export const Default: Story = {
  args: {
    label: 'Notes',
    placeholder: 'Add some context for this request',
    value: '',
    minRows: 3,
    maxRows: 8,
  },
};

export const Prefilled: Story = {
  args: {
    label: 'Description',
    value:
      'Borrower called to confirm Q3 financials are ready. Will follow up next Tuesday once the lender has reviewed.',
    minRows: 3,
    maxRows: 6,
  },
};

export const WithCounter: Story = {
  args: {
    label: 'Tweet',
    placeholder: 'What is happening?',
    showCounter: true,
    value: 'Shipping the v2 of our extraction pipeline today!',
    minRows: 2,
    maxRows: 4,
  },
};

export const Readonly: Story = {
  args: {
    label: 'Audit log',
    value: 'Approved 2026-04-12 by jane.doe@example.com',
    readonly: true,
    minRows: 2,
    maxRows: 4,
  },
};

export const GrayStyle: Story = {
  args: {
    label: 'Internal note',
    placeholder: 'Visible to the lending team only',
    style: 'gray',
    minRows: 3,
    maxRows: 6,
  },
};
