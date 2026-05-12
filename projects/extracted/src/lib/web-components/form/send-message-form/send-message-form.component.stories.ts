import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { IAMService } from '../../../services/identity/iam.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import type { Message } from '../../../types/messages';
import { SendMessageFormComponent } from './send-message-form.component';

const iamStub = {
  getActiveUser: () => ({
    id: 'user-1',
    email: 'casey.lee@aglender.com',
    firstName: 'Casey',
    lastName: 'Lee',
  }),
} as unknown as IAMService;

const organizationStub = {
  uiConfiguration: { name: 'AgLender' },
} as unknown as OrganizationService;

const meta: Meta<SendMessageFormComponent> = {
  title: 'Web Components/Form/Send Message Form',
  component: SendMessageFormComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: IAMService, useValue: iamStub },
        { provide: OrganizationService, useValue: organizationStub },
      ],
    }),
  ],
  argTypes: {
    isLoading: { control: 'boolean' },
    showHelp: { control: 'boolean' },
    isTemplate: { control: 'boolean' },
    showDueDate: { control: 'boolean' },
    messageChanged: { action: 'messageChanged' },
  },
};

export default meta;
type Story = StoryObj<SendMessageFormComponent>;

const blankMessage: Message = { subject: '', body: '' };

const draft: Message = {
  sender: 'casey.lee@aglender.com',
  subject: 'Next steps with AgLender',
  body: 'Hi Pat,\n\nThanks for sending over your Q3 financials. We\'ll have a decision by Friday.\n\nCasey',
};

export const Empty: Story = {
  args: { message: blankMessage, showHelp: true },
};

export const Drafted: Story = {
  args: { message: draft, showHelp: true },
};

export const Template: Story = {
  args: {
    message: {
      sender: '{{lender_email}}',
      subject: 'Next steps with {{organization_name}}',
      body: 'Hi {{borrower_first_name}},\n\nThanks for sending {{document_name}}.',
    },
    isTemplate: true,
    showHelp: true,
  },
};

export const WithDueDate: Story = {
  args: {
    message: {
      ...draft,
      dueDate: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    showDueDate: true,
  },
};

export const Loading: Story = {
  args: { message: draft, isLoading: true },
};
