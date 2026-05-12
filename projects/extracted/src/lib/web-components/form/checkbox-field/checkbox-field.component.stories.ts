import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxFieldComponent } from './checkbox-field.component';

const meta: Meta<CheckboxFieldComponent> = {
  title: 'Web Components/Form/Checkbox Field',
  component: CheckboxFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    value: { control: 'boolean' },
    valueChanged: { action: 'valueChanged' },
  },
};

export default meta;
type Story = StoryObj<CheckboxFieldComponent>;

export const Unchecked: Story = {
  args: { label: 'Accept terms and conditions', value: false },
};

export const Checked: Story = {
  args: { label: 'Subscribe to newsletter', value: true },
};

export const NoLabel: Story = {
  args: { label: '', value: false },
};

export const Group: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <lj-checkbox-field [value]="true" label="Email notifications"></lj-checkbox-field>
        <lj-checkbox-field [value]="false" label="SMS notifications"></lj-checkbox-field>
        <lj-checkbox-field [value]="true" label="Push notifications"></lj-checkbox-field>
      </div>
    `,
  }),
};
