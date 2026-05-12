import type { Meta, StoryObj } from '@storybook/angular';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  SectionLayouts,
} from '../../../../models/dynamic-forms.models';
import { RadioFieldComponent } from './radio-field.component';

const radioField = (
  partial: Partial<DynamicFormField<string>>
): DynamicFormField<string> => ({
  id: 'radio-1',
  name: 'employment-status',
  column: 0,
  label: 'Employment status',
  fieldType: DynamicFormFieldTypes.INPUT,
  parameters: {
    options: [
      { label: 'Employed', value: 'employed' },
      { label: 'Self-employed', value: 'self-employed' },
      { label: 'Retired', value: 'retired' },
      { label: 'Other', value: 'other' },
    ],
  },
  required: true,
  value: '',
  ...partial,
});

const meta: Meta<RadioFieldComponent> = {
  title: 'Dynamic Forms/Fields/Radio Field',
  component: RadioFieldComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<RadioFieldComponent>;

export const Unselected: Story = {
  args: {
    mode: 'edit',
    field: radioField({ value: '' }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Selected: Story = {
  args: {
    mode: 'edit',
    field: radioField({ value: 'employed' }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Display: Story = {
  args: {
    mode: 'display',
    field: radioField({ value: 'self-employed' }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};
