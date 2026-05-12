import type { Meta, StoryObj } from '@storybook/angular';
import {
  RequestAttachmentTypes,
  type RequestAttachment,
} from '../../../models/requestAttachmentModels';
import type { Request } from '../../../models/requestModels';
import { DocumentsTileComponent } from './documents-tile.component';

const attach = (
  partial: Partial<RequestAttachment> & { id: string; name: string },
): RequestAttachment =>
  ({
    type: RequestAttachmentTypes.LOAN_DOCUMENT,
    documentId: partial.id,
    digest: 'abc',
    ...partial,
  }) as unknown as RequestAttachment;

const baseRequest = (
  attachments: RequestAttachment[],
): Request =>
  ({
    name: 'Operating Loan — Pat Smith',
    products: ['op-loan'],
    requestType: 'STANDARD',
    productType: 'LENDING',
    statusFlow: ['DRAFT', 'UNDER_REVIEW', 'APPROVED'],
    status: 'UNDER_REVIEW',
    requestDigest: 'abc',
    attachments,
    sections: [],
    businesses: [],
    users: [],
    requestSteps: {},
    workgroupId: null,
    mode: 'STANDARD',
    clientCanInitiate: false,
    configuration: {} as Request['configuration'],
  }) as unknown as Request;

const meta: Meta<DocumentsTileComponent> = {
  title: 'Web Components / Requests / Documents Tile',
  component: DocumentsTileComponent,
  tags: ['autodocs'],
  argTypes: {
    isMobile: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DocumentsTileComponent>;

export const ManyDocuments: Story = {
  args: {
    request: baseRequest([
      attach({ id: 'a1', name: 'Q3 financials.pdf' }),
      attach({ id: 'a2', name: 'Bank statement Aug 2026.pdf' }),
      attach({ id: 'a3', name: 'Tax return 2025.pdf' }),
      attach({ id: 'a4', name: 'Voided check.jpg' }),
      attach({ id: 'a5', name: 'Articles of incorporation.pdf' }),
    ]),
  },
};

export const FewDocuments: Story = {
  args: {
    request: baseRequest([
      attach({ id: 'a1', name: 'Q3 financials.pdf' }),
      attach({ id: 'a2', name: 'Bank statement Aug 2026.pdf' }),
    ]),
  },
};

export const Mobile: Story = {
  args: {
    request: baseRequest([
      attach({ id: 'a1', name: 'Q3 financials.pdf' }),
      attach({ id: 'a2', name: 'Bank statement Aug 2026.pdf' }),
      attach({ id: 'a3', name: 'Tax return 2025.pdf' }),
    ]),
    isMobile: true,
  },
};
