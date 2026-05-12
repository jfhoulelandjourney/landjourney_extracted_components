import type { Meta, StoryObj } from '@storybook/angular';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  SectionLayouts,
} from '../../../../models/dynamic-forms.models';
import { MoneyFieldComponent } from './money-field.component';

const moneyField = (
  partial: Partial<DynamicFormField<number>>
): DynamicFormField<number> => ({
  id: 'money-1',
  name: 'loan-amount',
  column: 0,
  label: 'Requested loan amount',
  fieldType: DynamicFormFieldTypes.INPUT,
  parameters: {},
  required: false,
  ...partial,
});

const meta: Meta<MoneyFieldComponent> = {
  title: 'Dynamic Forms/Fields/Money Field',
  component: MoneyFieldComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MoneyFieldComponent>;

export const EditMode: Story = {
  args: {
    mode: 'edit',
    field: moneyField({ value: 250_000, required: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const DisplayMode: Story = {
  args: {
    mode: 'display',
    field: moneyField({ value: 1_250_000 }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const SmallValue: Story = {
  args: {
    mode: 'edit',
    field: moneyField({ label: 'Application fee', value: 75 }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const Empty: Story = {
  args: {
    mode: 'edit',
    field: moneyField({ value: undefined, required: true }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};
