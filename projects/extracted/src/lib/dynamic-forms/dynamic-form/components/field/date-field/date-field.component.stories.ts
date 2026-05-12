import type { Meta, StoryObj } from '@storybook/angular';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  SectionLayouts,
} from '../../../../models/dynamic-forms.models';
import { DateFieldComponent } from './date-field.component';

const nowSeconds = Math.floor(Date.now() / 1000);
const dayInSeconds = 24 * 60 * 60;

const dateField = (
  partial: Partial<DynamicFormField<number>>
): DynamicFormField<number> => ({
  id: 'date-1',
  name: 'birth-date',
  column: 0,
  label: 'Date of birth',
  fieldType: DynamicFormFieldTypes.INPUT,
  parameters: {},
  required: false,
  ...partial,
});

const meta: Meta<DateFieldComponent> = {
  title: 'Dynamic Forms/Fields/Date Field',
  component: DateFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: { control: 'select', options: ['edit', 'display', 'locked'] },
  },
};

export default meta;
type Story = StoryObj<DateFieldComponent>;

export const EditMode: Story = {
  args: {
    mode: 'edit',
    field: dateField({
      value: nowSeconds - 30 * 365 * dayInSeconds,
      required: true,
    }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const DisplayMode: Story = {
  args: {
    mode: 'display',
    field: dateField({ value: nowSeconds - 30 * 365 * dayInSeconds }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const PastOnly: Story = {
  args: {
    mode: 'edit',
    field: dateField({
      label: 'Date of incorporation',
      parameters: { dateRestriction: 'PAST_ONLY' },
    }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const FutureOnly: Story = {
  args: {
    mode: 'edit',
    field: dateField({
      label: 'Anticipated closing date',
      parameters: { dateRestriction: 'FUTURE_ONLY' },
    }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};

export const AgeRestricted: Story = {
  args: {
    mode: 'edit',
    field: dateField({
      label: 'Date of birth (must be 18+)',
      parameters: { dateRestriction: 'AGE_18_PLUS' },
      required: true,
    }),
    formData: {},
    containerLayout: SectionLayouts.ONE_COLUMN,
  },
};
