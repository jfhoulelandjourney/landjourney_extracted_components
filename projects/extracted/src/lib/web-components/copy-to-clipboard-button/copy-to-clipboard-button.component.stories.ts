import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { UiNotificationService } from '../../services/notifications/ui-notification.service';
import { CopyToClipboardButtonComponent } from './copy-to-clipboard-button.component';

const uiNotificationStub: Partial<UiNotificationService> = {
  showSnackbar: (message: string) => {
    // eslint-disable-next-line no-console
    console.log('[snackbar]', message);
  },
};

const meta: Meta<CopyToClipboardButtonComponent> = {
  title: 'Web Components/Form/Copy To Clipboard Button',
  component: CopyToClipboardButtonComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: UiNotificationService, useValue: uiNotificationStub },
      ],
    }),
  ],
  argTypes: {
    value: { control: 'text' },
    successMessage: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<CopyToClipboardButtonComponent>;

export const ApiKey: Story = {
  args: {
    value: 'demo_api_key_4eC39HqLyjWDarjtT1zdp7dc',
    successMessage: 'API key copied.',
  },
  render: (args) => ({
    props: args,
    template: `
      <lj-copy-to-clipboard-button [value]="value" [successMessage]="successMessage">
        <code>{{ value }}</code>
      </lj-copy-to-clipboard-button>
    `,
  }),
};

export const ShortValue: Story = {
  args: { value: 'LJ-1042' },
  render: (args) => ({
    props: args,
    template: `
      <lj-copy-to-clipboard-button [value]="value">
        <span>Loan #{{ value }}</span>
      </lj-copy-to-clipboard-button>
    `,
  }),
};

export const Numeric: Story = {
  args: { value: 1042, successMessage: 'Loan number copied.' },
  render: (args) => ({
    props: args,
    template: `
      <lj-copy-to-clipboard-button [value]="value" [successMessage]="successMessage">
        <span>{{ value }}</span>
      </lj-copy-to-clipboard-button>
    `,
  }),
};
