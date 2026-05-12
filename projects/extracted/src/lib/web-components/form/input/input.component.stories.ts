import type { Meta, StoryObj } from '@storybook/angular';
import { LjInputComponent } from './input.component';

const meta: Meta<LjInputComponent> = {
  title: 'Web Components/Form/Input (raw)',
  component: LjInputComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Low-level styled input directive. Apply `lj-input` to a native `<input>` to get the design-system styling. For full label/error/helper layout, wrap in `<lj-form-field>` and use `<lj-input-field>` instead.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<LjInputComponent>;

export const Text: Story = {
  render: () => ({
    template: `<input lj-input type="text" placeholder="Enter text" />`,
  }),
};

export const Email: Story = {
  render: () => ({
    template: `<input lj-input type="email" placeholder="you@example.com" />`,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `<input lj-input type="text" disabled value="Read-only value" />`,
  }),
};

export const Types: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; align-items: center; max-width: 480px;">
        <label>Text</label>     <input lj-input type="text" placeholder="text" />
        <label>Email</label>    <input lj-input type="email" placeholder="email" />
        <label>Number</label>   <input lj-input type="number" placeholder="0" />
        <label>Password</label> <input lj-input type="password" placeholder="••••" />
        <label>Date</label>     <input lj-input type="date" />
        <label>URL</label>      <input lj-input type="url" placeholder="https://" />
      </div>
    `,
  }),
};
