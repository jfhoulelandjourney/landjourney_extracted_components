import type { Meta, StoryObj } from '@storybook/angular';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  SectionLayouts,
} from '../../../../models/dynamic-forms.models';
import { CheckboxFieldComponent } from './checkbox-field.component';

const checkboxField = (
  partial: Partial<DynamicFormField<boolean>>
): DynamicFormField<boolean> => ({
  id: 'cb-1',
  name: 'agree-terms',
  column: 0,
  label: 'I agree to the loan terms',
  fieldType: DynamicFormFieldTypes.INPUT,
  parameters: {},
  required: false,
  value: false,
  ...partial,
});

const meta: Meta<CheckboxFieldComponent> = {
  title: 'Dynamic Forms/Fields/Checkbox Field',
  component: CheckboxFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'select', options: ['edit', 'display', 'locked'] },
  },
};

export default meta;
type Story = StoryObj<CheckboxFieldComponent>;

export const Unchecked: Story = {
  args: {
    mode: 'edit',
    field: checkboxField({ value: false }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Checked: Story = {
  args: {
    mode: 'edit',
    field: checkboxField({ value: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Display: Story = {
  args: {
    mode: 'display',
    field: checkboxField({
      label: 'Authorization to obtain credit report',
      value: true,
    }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};
