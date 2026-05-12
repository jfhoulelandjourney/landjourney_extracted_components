import type { Meta, StoryObj } from '@storybook/angular';
import { phoneNumberMask } from '../../../models/phoneNumber';
import { MaskedTextComponent } from './masked-text.component';

const meta: Meta<MaskedTextComponent> = {
  title: 'Web Components / Typography / Masked Text',
  component: MaskedTextComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a string formatted by a Maskito mask. Used for phone, SSN, account numbers — anywhere read-only formatted display is needed.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<MaskedTextComponent>;

export const PhoneNumber: Story = {
  args: {
    text: '+15155550142',
    mask: phoneNumberMask,
  },
};

export const PartialPhone: Story = {
  args: {
    text: '5155550142',
    mask: phoneNumberMask,
  },
};

export const Empty: Story = {
  args: {
    text: '',
    mask: phoneNumberMask,
  },
};
