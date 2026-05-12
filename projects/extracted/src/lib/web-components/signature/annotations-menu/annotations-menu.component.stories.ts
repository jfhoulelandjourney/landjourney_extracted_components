import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { RequestUserRoles } from '../../../models/requestModels';
import { OrganizationService } from '../../../services/organization/organization.service';
import { FieldsService } from '../../../services/products/fields/fields.service';
import type {
  SigneeInfo,
  SignerInfo,
} from '../../pdf/field-framework/types/field-data';
import { AnnotationsMenuComponent } from './annotations-menu.component';

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

const mockOrganizationService = {
  isFeatureFlagActivated: () => false,
};

const mockFieldsService = {
  getFields: () => of({ items: [] }),
};

const meta: Meta<AnnotationsMenuComponent> = {
  title: 'Signature/AnnotationsMenu',
  component: AnnotationsMenuComponent,
  tags: ['autodocs', 'test'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: OrganizationService, useValue: mockOrganizationService },
        { provide: FieldsService, useValue: mockFieldsService },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<AnnotationsMenuComponent>;

export const Default: Story = {
  args: {
    isTemplate: true,
    signee: testSignee,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Signature')).toBeInTheDocument();
    await expect(canvas.getByText('Initials')).toBeInTheDocument();
    await expect(canvas.getByText('Date')).toBeInTheDocument();
  },
};

export const WithSigneeContext: Story = {
  args: {
    isTemplate: true,
    signee: testSignee,
    disabled: false,
  },
  play: async ({ canvasElement }) => {
    const annotations = Array.from(
      canvasElement.querySelectorAll('lj-draggable-annotation')
    );
    await expect(annotations.length).toBe(4);

    for (const annotation of annotations) {
      await expect(annotation.getAttribute('aria-disabled')).not.toBe('true');
    }
  },
};

export const Disabled: Story = {
  args: {
    isTemplate: true,
    signee: testSignee,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const annotations = Array.from(
      canvasElement.querySelectorAll('lj-draggable-annotation')
    );

    for (const annotation of annotations) {
      await expect(annotation.getAttribute('aria-disabled')).toBe('true');
    }
  },
};

export const SignerMode: Story = {
  args: {
    isTemplate: false,
    signer: testSigner,
    disabled: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Signature')).toBeInTheDocument();
  },
};

export const WithDemoMode: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: OrganizationService,
          useValue: { isFeatureFlagActivated: () => true },
        },
        {
          provide: FieldsService,
          useValue: {
            getFields: () =>
              of({ items: [{ label: 'SSN' }, { label: 'DOB' }] }),
          },
        },
      ],
    }),
  ],
  args: {
    isTemplate: true,
    signee: testSignee,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Name')).toBeInTheDocument();
  },
};
