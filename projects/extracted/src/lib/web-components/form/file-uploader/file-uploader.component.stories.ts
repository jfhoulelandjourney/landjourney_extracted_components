import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import {
  AttachmentTypes,
  SenderTypes,
  TaskStatuses,
  type Attachment,
} from '../../../models/sectionModels';
import { DocumentService } from '../../../services/documents/document.service';
import { FileUploaderComponent } from './file-uploader.component';

const documentServiceStub = {
  upload: () => ({ subscribe: () => ({ unsubscribe: () => undefined }) }),
} as unknown as DocumentService;

const sampleFile = (
  partial: Partial<Attachment> & { id: string; name: string }
): Attachment =>
  ({
    type: AttachmentTypes.FILE,
    status: TaskStatuses.PROVIDED,
    writable: true,
    senderType: SenderTypes.CLIENT,
    ...partial,
  } as Attachment);

const meta: Meta<FileUploaderComponent> = {
  title: 'Web Components/Form/File Uploader',
  component: FileUploaderComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [{ provide: DocumentService, useValue: documentServiceStub }],
    }),
  ],
  argTypes: {
    horizontal: { control: 'boolean' },
    vertical: { control: 'boolean' },
    small: { control: 'boolean' },
    allowDrag: { control: 'boolean' },
    single: { control: 'boolean' },
    allowUpload: { control: 'boolean' },
    isTemplate: { control: 'boolean' },
    isClient: { control: 'boolean' },
    required: { control: 'boolean' },
    supportedFileTypes: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<FileUploaderComponent>;

export const Empty: Story = {
  args: { horizontal: true, allowUpload: true, files: [] },
};

export const SmallVariant: Story = {
  args: { horizontal: true, small: true, files: [] },
};

export const Vertical: Story = {
  args: { horizontal: false, vertical: true, files: [] },
};

export const WithFiles: Story = {
  args: {
    horizontal: true,
    files: [
      sampleFile({ id: 'a1', name: 'Q3 financials.pdf' }),
      sampleFile({ id: 'a2', name: 'Bank statement Aug 2026.pdf' }),
      sampleFile({ id: 'a3', name: 'Tax return 2025.pdf' }),
    ],
  },
};

export const SingleFile: Story = {
  args: {
    single: true,
    files: [sampleFile({ id: 'a1', name: 'Voided check.jpg' })],
  },
};

export const Required: Story = {
  args: { required: true, files: [] },
};

export const RestrictedTypes: Story = {
  args: {
    supportedFileTypes: 'application/pdf,image/jpeg,image/png',
    files: [],
  },
};
