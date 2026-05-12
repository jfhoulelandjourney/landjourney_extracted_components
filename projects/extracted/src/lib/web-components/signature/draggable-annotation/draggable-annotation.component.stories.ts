import type { Meta, StoryObj } from '@storybook/angular';
import { expect, within } from 'storybook/test';
import { RequestUserRoles } from '../../../models/requestModels';
import type {
  SigneeInfo,
  SignerInfo,
} from '../../pdf/field-framework/types/field-data';
import { DraggableAnnotationComponent } from './draggable-annotation.component';

const testSignee: SigneeInfo = {
  id: 'signee-1',
  name: 'John Borrower',
  roles: [RequestUserRoles.BORROWER],
};

const testSigner: SignerInfo = {
  id: 'signer-1',
  name: 'John Borrower',
  role: RequestUserRoles.BORROWER,
  image: null,
  imageUrl: null,
};

const meta: Meta<DraggableAnnotationComponent> = {
  title: 'Signature/DraggableAnnotation',
  component: DraggableAnnotationComponent,
  tags: ['autodocs', 'test'],
  argTypes: {
    type: {
      control: 'select',
      options: ['name', 'signature', 'initials', 'date', 'custom'],
    },
  },
};

export default meta;
type Story = StoryObj<DraggableAnnotationComponent>;

export const Name: Story = {
  args: {
    id: 'ann-name',
    type: 'name',
    isTemplate: true,
    signee: testSignee,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const annotation = canvas.getByText('Name');
    await expect(annotation).toBeInTheDocument();

    const el = canvasElement.querySelector('[data-type="name"]');
    if (!el) {
      throw new Error('Expected name annotation to be rendered');
    }

    await expect(el.getAttribute('aria-disabled')).not.toBe('true');
  },
};

export const Signature: Story = {
  args: {
    id: 'ann-sig',
    type: 'signature',
    isTemplate: true,
    signee: testSignee,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Signature')).toBeInTheDocument();
  },
};

export const Initials: Story = {
  args: {
    id: 'ann-init',
    type: 'initials',
    isTemplate: true,
    signee: testSignee,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Initials')).toBeInTheDocument();
  },
};

export const Date: Story = {
  args: {
    id: 'ann-date',
    type: 'date',
    isTemplate: true,
    signee: testSignee,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Date')).toBeInTheDocument();
  },
};

export const Custom: Story = {
  args: {
    id: 'ann-custom',
    type: 'custom',
    name: 'SSN Field',
    isTemplate: true,
    signee: testSignee,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('SSN Field')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: {
    id: 'ann-disabled',
    type: 'name',
    disabled: true,
    signee: testSignee,
  },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('[data-type="name"]');
    if (!el) {
      throw new Error('Expected disabled name annotation to be rendered');
    }

    await expect(el.getAttribute('aria-disabled')).toBe('true');
  },
};

export const Readonly: Story = {
  args: {
    id: 'ann-readonly',
    type: 'signature',
    readonly: true,
    signer: testSigner,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Signature')).toBeInTheDocument();
  },
};

export const WithSigner: Story = {
  args: {
    id: 'ann-with-signer',
    type: 'name',
    isTemplate: false,
    signee: testSignee,
    signer: testSigner,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Name')).toBeInTheDocument();
  },
};

export const AllTypes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap; padding: 16px;">
        <lj-draggable-annotation id="all-name" type="name" />
        <lj-draggable-annotation id="all-sig" type="signature" />
        <lj-draggable-annotation id="all-init" type="initials" />
        <lj-draggable-annotation id="all-date" type="date" />
        <lj-draggable-annotation id="all-custom" type="custom" name="Custom Field" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Signature')).toBeInTheDocument();
    await expect(canvas.getByText('Initials')).toBeInTheDocument();
    await expect(canvas.getByText('Date')).toBeInTheDocument();
    await expect(canvas.getByText('Custom Field')).toBeInTheDocument();
  },
};
