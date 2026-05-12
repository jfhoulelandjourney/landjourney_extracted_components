import type { Meta, StoryObj } from '@storybook/angular';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  SectionLayouts,
} from '../../../../models/dynamic-forms.models';
import { TextFieldComponent } from './text-field.component';

const baseField = (
  partial: Partial<DynamicFormField<string>>
): DynamicFormField<string> => ({
  id: 'text-1',
  name: 'borrower-name',
  column: 0,
  label: 'Borrower full name',
  fieldType: DynamicFormFieldTypes.INPUT,
  parameters: { type: 'text' },
  required: false,
  value: '',
  ...partial,
});

const meta: Meta<TextFieldComponent> = {
  title: 'Dynamic Forms/Fields/Text Field',
  component: TextFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'select', options: ['edit', 'display', 'locked'] },
    style: { control: 'select', options: ['gray', 'normal'] },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<TextFieldComponent>;

export const EditMode: Story = {
  args: {
    mode: 'edit',
    field: baseField({ value: 'Pat Smith', required: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const DisplayMode: Story = {
  args: {
    mode: 'display',
    field: baseField({ value: 'Pat Smith', required: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Required: Story = {
  args: {
    mode: 'edit',
    field: baseField({ value: '', required: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Email: Story = {
  args: {
    mode: 'edit',
    field: baseField({
      label: 'Email',
      name: 'email',
      parameters: { type: 'email' },
      value: 'pat@example.com',
    }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Locked: Story = {
  args: {
    mode: 'locked',
    field: baseField({
      label: 'SSN',
      parameters: { type: 'ssn', privacy: true },
      value: '***-**-1234',
    }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};
