import type { Meta, StoryObj } from '@storybook/angular';
import { RichTextComponent } from './rich-text.component';

const meta: Meta<RichTextComponent> = {
  title: 'Web Components/Form/Rich Text',
  component: RichTextComponent,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    value: { control: 'text' },
    required: { control: 'boolean' },
    valueChange: { action: 'valueChange' },
  },
};

export default meta;
type Story = StoryObj<RichTextComponent>;

export const Empty: Story = {
  args: { placeholder: 'Add notes for the underwriter…', value: '' },
};

export const Prefilled: Story = {
  args: {
    placeholder: 'Notes',
    value:
      '<p>Borrower called to confirm Q3 financials are ready. <strong>Will follow up next Tuesday</strong>.</p>',
  },
};

export const Required: Story = {
  args: {
    placeholder: 'This note is required before submission',
    required: true,
    value: '',
  },
};
