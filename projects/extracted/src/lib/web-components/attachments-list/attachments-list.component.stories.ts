import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { of } from 'rxjs';
import {
  Attachment,
  AttachmentTypes,
  SenderTypes,
  TaskStatuses,
} from '../../models/sectionModels';
import { DocumentService } from '../../services/documents/document.service';
import { LjAttachmentsListComponent } from './attachments-list.component';

// Cast through unknown so Storybook stubs only the methods used by this
// component without re-declaring the full DocumentService surface.
const documentServiceStub = {
  getFileMetadata: (_id: string, _digest: string) => of({}),
  getFileTemplateMetadata: (_id: string) => of({}),
} as unknown as DocumentService;

const fixtures: Attachment[] = [
  {
    id: 'a1',
    name: 'Q3 financials.pdf',
    documentId: 'doc-1',
    type: AttachmentTypes.FILE,
    status: TaskStatuses.PROVIDED,
    writable: true,
    senderType: SenderTypes.CLIENT,
  },
  {
    id: 'a2',
    name: 'Loan application.pdf',
    documentId: 'doc-2',
    type: AttachmentTypes.DYNAMIC_FORM,
    status: TaskStatuses.PROVIDED,
    writable: true,
    senderType: SenderTypes.CLIENT,
  },
  {
    id: 'a3',
    name: 'ID — driver license.jpg',
    documentId: 'doc-3',
    type: AttachmentTypes.IDENTITY_VERIFICATION,
    status: TaskStatuses.PROVIDED,
    writable: false,
    senderType: SenderTypes.SYSTEM,
  },
  {
    id: 'a4',
    name: 'Credit report.pdf',
    documentId: 'doc-4',
    type: AttachmentTypes.CREDIT_CHECK,
    status: TaskStatuses.INCOMPLETE,
    writable: false,
    senderType: SenderTypes.SYSTEM,
  },
];

const meta: Meta<LjAttachmentsListComponent> = {
  title: 'Web Components/Display/Attachments List',
  component: LjAttachmentsListComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: DocumentService, useValue: documentServiceStub },
      ],
    }),
  ],
  argTypes: {
    isTemplate: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LjAttachmentsListComponent>;

export const Default: Story = {
  args: { attachments: fixtures, isTemplate: false },
};

export const Single: Story = {
  args: { attachments: [fixtures[0]!], isTemplate: false },
};

export const Empty: Story = {
  args: { attachments: [], isTemplate: false },
};

export const TemplateMode: Story = {
  args: { attachments: fixtures, isTemplate: true },
};
