import type { Meta, StoryObj } from '@storybook/angular';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  SectionLayouts,
} from '../../../../models/dynamic-forms.models';
import { NumberFieldComponent } from './number-field.component';

const numberField = (
  partial: Partial<DynamicFormField<number | undefined>>
): DynamicFormField<number | undefined> => ({
  id: 'num-1',
  name: 'income',
  column: 0,
  label: 'Annual income',
  fieldType: DynamicFormFieldTypes.INPUT,
  parameters: {},
  required: false,
  ...partial,
});

const meta: Meta<NumberFieldComponent> = {
  title: 'Dynamic Forms/Fields/Number Field',
  component: NumberFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'select', options: ['edit', 'display', 'locked'] },
  },
};

export default meta;
type Story = StoryObj<NumberFieldComponent>;

export const EditMode: Story = {
  args: {
    mode: 'edit',
    field: numberField({ value: 125_000, required: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const WithBounds: Story = {
  args: {
    mode: 'edit',
    field: numberField({
      label: 'Number of acres',
      value: 240,
      parameters: { minimumValue: 1, maximumValue: 10000 },
    }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const DisplayMode: Story = {
  args: {
    mode: 'display',
    field: numberField({ label: 'Annual income', value: 125_000 }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Empty: Story = {
  args: {
    mode: 'edit',
    field: numberField({ value: undefined, required: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};
