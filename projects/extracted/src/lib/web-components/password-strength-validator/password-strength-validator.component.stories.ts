import type { Meta, StoryObj } from '@storybook/angular';
import { PasswordStrengthValidatorComponent } from './password-strength-validator.component';

const meta: Meta<PasswordStrengthValidatorComponent> = {
  title: 'Web Components/Form/Password Strength Validator',
  component: PasswordStrengthValidatorComponent,
  tags: ['autodocs'],
  argTypes: {
    password: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<PasswordStrengthValidatorComponent>;

export const Empty: Story = {
  args: { password: '' },
};

export const Weak: Story = {
  args: { password: 'abc' },
};

export const Mixed: Story = {
  args: { password: 'Hello123' },
};

export const Strong: Story = {
  args: { password: 'C0rrectH0rseBatteryStaple!' },
};
