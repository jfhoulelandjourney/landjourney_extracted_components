import type { Meta, StoryObj } from '@storybook/angular';
import { LjButtonComponent } from './button.component';

const meta: Meta<LjButtonComponent> = {
  title: 'Web Components/Form/Legacy Button',
  component: LjButtonComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Older `<button lj-button>` selector. New code should prefer the modern `<lj-button>` (Web Components / button2). Kept for parity with the legacy app surfaces.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['cta', 'inverse-cta', 'ghost', 'warn', 'row'],
    },
    color: { control: 'select', options: ['primary', 'secondary'] },
    size: { control: 'select', options: ['small', 'normal', 'large'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    compact: { control: 'boolean' },
    applyFullStyle: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LjButtonComponent>;

export const Cta: Story = {
  render: () => ({
    template: `<button lj-button="cta">Continue</button>`,
  }),
};

export const InverseCta: Story = {
  render: () => ({
    template: `<button lj-button="inverse-cta">Cancel</button>`,
  }),
};

export const Ghost: Story = {
  render: () => ({
    template: `<button lj-button="ghost">Skip</button>`,
  }),
};

export const Warn: Story = {
  render: () => ({
    template: `<button lj-button="warn">Delete request</button>`,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button lj-button="cta">CTA</button>
        <button lj-button="inverse-cta">Inverse</button>
        <button lj-button="ghost">Ghost</button>
        <button lj-button="warn">Warn</button>
        <button lj-button="row">Row</button>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; align-items: center;">
        <button lj-button="cta" size="small">Small</button>
        <button lj-button="cta" size="normal">Normal</button>
        <button lj-button="cta" size="large">Large</button>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px;">
        <button lj-button="cta">Idle</button>
        <button lj-button="cta" [disabled]="true">Disabled</button>
        <button lj-button="cta" [loading]="true">Loading</button>
      </div>
    `,
  }),
};
