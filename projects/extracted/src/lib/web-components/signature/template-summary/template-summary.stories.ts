import type { Meta, StoryObj } from '@storybook/angular';
import { LjTemplateSummaryComponent } from './template-summary.component';

const meta: Meta<LjTemplateSummaryComponent> = {
  title: 'Signature/TemplateSummary',
  component: LjTemplateSummaryComponent,
  tags: ['autodocs', 'test'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['view', 'edit', 'edit-and-confirm'],
    },
    // @ts-expect-error alias
    name: { control: 'text' },
    description: { control: 'text' },

    onChange: {
      action: 'dataChanged',
    },
    onModeChange: {
      action: 'modeChanged',
    },
  },
};

export default meta;
type Story = StoryObj<LjTemplateSummaryComponent>;

export const View: Story = {
  args: {
    // @ts-expect-error alias
    name: 'Sample Template',
    description: 'A description for the template.',
    mode: 'view',
  },
};

export const Edit: Story = {
  args: {
    // @ts-expect-error alias
    name: 'Editable Template',
    description: 'Edit this description.',
    mode: 'edit',
  },
};

export const EditAndConfirm: Story = {
  args: {
    // @ts-expect-error alias
    name: 'Confirm Template',
    description: 'Confirm or cancel your changes.',
    mode: 'edit-and-confirm',
  },
};

export const EmptyDraft: Story = {
  args: {
    // @ts-expect-error alias
    name: '',
    description: '',
    mode: 'edit-and-confirm',
  },
};
