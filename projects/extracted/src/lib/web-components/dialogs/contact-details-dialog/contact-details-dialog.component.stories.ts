import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ContactDetailsDialogComponent } from './contact-details-dialog.component';

const dialogRefStub = {
  close: () => {
    /* noop */
  },
} as unknown as MatDialogRef<ContactDetailsDialogComponent>;

const meta: Meta<ContactDetailsDialogComponent> = {
  title: 'Web Components/Dialogs/Contact Details Dialog',
  component: ContactDetailsDialogComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ContactDetailsDialogComponent>;

const wrap = (data: { contactDetails: string }): Story => ({
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
      <div style="max-width: 520px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
        <lj-contact-details-dialog></lj-contact-details-dialog>
      </div>
    `,
  }),
});

export const SimpleContact: Story = wrap({
  contactDetails: `
    <h3>Loan officer</h3>
    <p><strong>Casey Lee</strong></p>
    <p>casey.lee@aglender.com</p>
    <p>(515) 555-0142</p>
  `,
});

export const RichContact: Story = wrap({
  contactDetails: `
    <h3>Branch contact</h3>
    <p><strong>Iowa Heartland Office</strong></p>
    <ul>
      <li>1042 Main St, Des Moines, IA 50309</li>
      <li>Mon–Fri 8 AM – 5 PM CT</li>
      <li>support@aglender.com</li>
    </ul>
    <p><a href="tel:5155550142">(515) 555-0142</a></p>
  `,
});
