import type { Meta, StoryObj } from '@storybook/angular';
import { FormFieldComponent } from './form-field.component';

const meta: Meta<FormFieldComponent> = {
  title: 'Web Components/Form/Form Field',
  component: FormFieldComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A presentational wrapper that groups a label, control, and helper / error text using consistent spacing. Wrap inputs in `<lj-form-field>` to get the standard form layout.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<FormFieldComponent>;

export const WithLabelAndHelp: Story = {
  render: () => ({
    template: `
      <lj-form-field>
        <label>Email</label>
        <input lj-input type="email" placeholder="you@example.com" />
        <small style="color: #64748B;">We'll never share your email.</small>
      </lj-form-field>
    `,
  }),
};

export const WithError: Story = {
  render: () => ({
    template: `
      <lj-form-field>
        <label>Phone</label>
        <input lj-input type="tel" value="abc" />
        <small style="color: #DC2626;">Phone must be numeric.</small>
      </lj-form-field>
    `,
  }),
};
