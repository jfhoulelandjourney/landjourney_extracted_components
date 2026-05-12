import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import {
  ConditionScopes,
  type Condition,
} from '../../../services/organization/conditions.models';
import {
  ConditionsReviewDialogComponent,
  type ConditionsReviewDialogData,
} from './conditions-review-dialog.component';

const dialogRefStub = {
  close: () => {
    /* noop */
  },
} as unknown as MatDialogRef<ConditionsReviewDialogComponent>;

const baseCondition = (overrides: Partial<Condition>): Condition => ({
  id: 'cond-1',
  organizationId: 'org-1',
  scope: ConditionScopes.CUSTOMER,
  title: 'Loan terms',
  active: true,
  text: '<p>The borrower agrees to the terms outlined in this agreement…</p>',
  ...overrides,
});

const meta: Meta<ConditionsReviewDialogComponent> = {
  title: 'Web Components/Dialogs/Conditions Review Dialog',
  component: ConditionsReviewDialogComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ConditionsReviewDialogComponent>;

const wrap = (data: ConditionsReviewDialogData): Story => ({
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
      <div style="max-width: 640px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
        <lj-conditions-review-dialog></lj-conditions-review-dialog>
      </div>
    `,
  }),
});

export const Standard: Story = wrap({
  condition: baseCondition({
    title: 'Loan agreement',
    text: `
      <h4>Terms</h4>
      <ul>
        <li>Interest accrues monthly on the outstanding balance.</li>
        <li>Principal payments are due on the 1st of each month.</li>
        <li>Late fees apply after a 5-day grace period.</li>
      </ul>
    `,
    disclaimerText:
      'I confirm that I have read and accept the terms above.',
  }),
});

export const ShortText: Story = wrap({
  condition: baseCondition({
    title: 'Quick acknowledgment',
    text: '<p>By proceeding, you agree to receive automated SMS messages about your application.</p>',
  }),
});
