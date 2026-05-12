import type { Meta, StoryObj } from '@storybook/angular';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  SectionLayouts,
} from '../../../../models/dynamic-forms.models';
import { SelectFieldComponent } from './select-field.component';

const stateField = (
  partial: Partial<DynamicFormField<string>>
): DynamicFormField<string> => ({
  id: 'select-1',
  name: 'state',
  column: 0,
  label: 'State',
  fieldType: DynamicFormFieldTypes.INPUT,
  parameters: {
    options: [
      { label: 'Iowa', value: 'IA' },
      { label: 'Illinois', value: 'IL' },
      { label: 'Indiana', value: 'IN' },
      { label: 'Kansas', value: 'KS' },
      { label: 'Minnesota', value: 'MN' },
      { label: 'Missouri', value: 'MO' },
      { label: 'Nebraska', value: 'NE' },
      { label: 'Wisconsin', value: 'WI' },
    ],
  },
  required: false,
  value: '',
  ...partial,
});

const meta: Meta<SelectFieldComponent> = {
  title: 'Dynamic Forms/Fields/Select Field',
  component: SelectFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'select', options: ['edit', 'display', 'locked'] },
  },
};

export default meta;
type Story = StoryObj<SelectFieldComponent>;

export const EditMode: Story = {
  args: {
    mode: 'edit',
    field: stateField({ required: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Prefilled: Story = {
  args: {
    mode: 'edit',
    field: stateField({ value: 'IA' }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Display: Story = {
  args: {
    mode: 'display',
    field: stateField({ value: 'NE' }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};
