import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { GeneralMessageDialogComponent } from './general-message-dialog.component';

const dialogRefStub = {
  close: () => {
    /* noop */
  },
} as unknown as MatDialogRef<GeneralMessageDialogComponent>;

const meta: Meta<GeneralMessageDialogComponent> = {
  title: 'Web Components/Dialogs/General Message Dialog',
  component: GeneralMessageDialogComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Generic confirmation dialog. Displayed via `MatDialog.open()` in production; here we render it inline so its body and Close action are visible.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<GeneralMessageDialogComponent>;

const wrap = (data: { message: string }): Story => ({
  decorators: [
    applicationConfig({
      providers: [
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }),
  ],
  render: () => ({
    template: `
      <div style="max-width: 480px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
        <lj-general-message-dialog></lj-general-message-dialog>
      </div>
    `,
  }),
});

export const Short: Story = wrap({
  message: 'Your changes have been saved.',
});

export const Confirmation: Story = wrap({
  message:
    'Approving this request will move it from Under Review to Approved and notify the assigned processor.',
});

export const Error: Story = wrap({
  message:
    'Could not contact the lending service. Try again, or contact support if the problem persists.',
});
