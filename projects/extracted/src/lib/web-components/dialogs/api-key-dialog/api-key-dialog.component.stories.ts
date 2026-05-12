import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { ApiKeyDialogComponent } from './api-key-dialog.component';

const dialogRefStub = {
  close: () => {
    /* noop */
  },
} as unknown as MatDialogRef<ApiKeyDialogComponent>;

const uiNotificationStub = {
  showSnackbar: (message: string) => {
    // eslint-disable-next-line no-console
    console.log('[snackbar]', message);
  },
} as unknown as UiNotificationService;

const meta: Meta<ApiKeyDialogComponent> = {
  title: 'Web Components/Dialogs/API Key Dialog',
  component: ApiKeyDialogComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ApiKeyDialogComponent>;

const wrap = (data: { keyId: string; key: string }): Story => ({
  decorators: [
    applicationConfig({
      providers: [
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: UiNotificationService, useValue: uiNotificationStub },
      ],
    }),
  ],
  render: () => ({
    template: `
      <div style="max-width: 560px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
        <lj-api-key-dialog></lj-api-key-dialog>
      </div>
    `,
  }),
});

export const NewlyCreatedKey: Story = wrap({
  keyId: 'ak_2026_a1b2c3d4',
  key: 'demo_api_key_4eC39HqLyjWDarjtT1zdp7dc8oYQQfgM3p1n',
});

export const ShortKey: Story = wrap({
  keyId: 'ak_demo_001',
  key: 'sk_test_short_demo_key',
});
