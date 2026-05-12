import type { Meta, StoryObj } from '@storybook/angular';
import { EditableTextBoxComponent } from './editable-text-box.component';

const meta: Meta<EditableTextBoxComponent> = {
  title: 'Web Components/Form/Editable Text Box',
  component: EditableTextBoxComponent,
  tags: ['autodocs'],
  argTypes: {
    inputType: {
      control: 'select',
      options: ['text', 'email', 'date', 'tel', 'url', 'password'],
    },
    color: { control: 'select', options: ['default', 'gray'] },
    size: { control: 'select', options: ['small', 'medium', 'large', 'x-large'] },
    locked: { control: 'boolean' },
    alwaysInEdit: { control: 'boolean' },
    required: { control: 'boolean' },
    valueChanged: { action: 'valueChanged' },
  },
};

export default meta;
type Story = StoryObj<EditableTextBoxComponent>;

export const Default: Story = {
  args: {
    value: 'Click me to edit',
    placeholder: 'Add a value',
    size: 'medium',
  },
};

export const AlwaysEditing: Story = {
  args: {
    value: 'Inline edit, no toggle',
    alwaysInEdit: true,
    size: 'medium',
  },
};

export const Locked: Story = {
  args: {
    value: 'Cannot be edited',
    locked: true,
  },
};

export const Email: Story = {
  args: {
    value: 'jane.doe@example.com',
    inputType: 'email',
    placeholder: 'name@example.com',
  },
};

export const SizeRange: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px; max-width: 480px;">
        <lj-editable-text-box value="Small" size="small"></lj-editable-text-box>
        <lj-editable-text-box value="Medium" size="medium"></lj-editable-text-box>
        <lj-editable-text-box value="Large" size="large"></lj-editable-text-box>
        <lj-editable-text-box value="Extra large" size="x-large"></lj-editable-text-box>
      </div>
    `,
  }),
};
