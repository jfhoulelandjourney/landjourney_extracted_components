import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { SafeHtmlPipe } from '../../../pipes/safe-html/safe-html.pipe';
import { IAMService } from '../../../services/identity/iam.service';
import { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';
import type { ExistingFundingEntitySchema } from '../../../services/lending/models/funding-entities.models';
import { ServicingService } from '../../../services/lending/servicing/servicing.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { WorkflowService } from '../../../services/workflows-api/workflow.service';
import { formatAmountFromCents } from '../../../utils/numberUtil';
import { formatDate, readableDateFromTimestamp } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';
import { LjRoundHeaderChipComponent } from '../../chip/lj-round-header-chip/lj-round-header-chip.component';
import { LjMoneyInputFieldComponent } from '../../form/money-input-field/money-input-field.component';
import { LjSelectFieldComponent } from '../../form/select-field/select-field.component';
import { CreditLineHeaderComponent } from '../credit-line-header/credit-line-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-payment',
  templateUrl: './credit-line-payment.component.html',
  styleUrls: ['./credit-line-payment.component.scss'],
  imports: [
    MatIconModule,
    MatDatepickerModule,
    CreditLineHeaderComponent,
    ActivateDirective,
    LjButtonComponent,
    LjMoneyInputFieldComponent,
    LjSelectFieldComponent,
    LjRoundHeaderChipComponent,
    FormsModule,
    MatExpansionModule,
    SafeHtmlPipe,
  ],
})
export class CreditLinePaymentComponent {
  readonly servicingService = inject(ServicingService);
  readonly iamService = inject(IAMService);
  readonly organizationService = inject(OrganizationService);
  readonly uiNotificationService = inject(UiNotificationService);
  readonly workflowService = inject(WorkflowService);

  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  mobile = input<boolean>(false);
  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();
  panelOpen = model(true);
  currentStep = signal(0);
  date = signal<Date | undefined>(undefined);
  now: Date = new Date();
  selectedSublineId = signal<string | null>(null);
  isProcessing = signal(false);

  // Two-way binding for mat-calendar
  get dateModel(): Date | undefined {
    return this.date();
  }
  set dateModel(value: Date | undefined) {
    this.date.set(value);
  }

  /**
   * Check if the credit line has sublines
   */
  hasSublines = computed(() => {
    const line = this.creditLine();
    return Boolean(line?.sublines && line.sublines.length > 0);
  });

  /**
   * Get the selected subline object
   */
  selectedSubline = computed(() => {
    const line = this.creditLine();
    const sublineId = this.selectedSublineId();
    if (!line?.sublines || !sublineId) return null;
    return line.sublines.find(s => s.id === sublineId) ?? null;
  });

  /**
   * Check if we should show the subline selection step
   * Skip if: no sublines OR maturity date is within 10 days
   */
  shouldShowSublineStep = computed(() => {
    return this.hasSublines() && !this.showMaturityWarning();
  });

  // Computed property to check if maturity date is within 10 days
  showMaturityWarning = computed(() => {
    const line = this.creditLine();
    if (!line?.maturityDate) return false;

    const today = new Date();
    const daysUntilMaturity = Math.ceil(
      (line.maturityDate * 1000 - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysUntilMaturity <= 10 && daysUntilMaturity >= 0;
  });

  // Check if payment is overdue
  isPaymentOverdue = computed(() => {
    const line = this.creditLine();
    if (!line?.nextPaymentDueDate) return false;

    const now = Date.now() / 1000; // Current time in seconds
    return line.nextPaymentDueDate < now;
  });

  // TODO get from the api
  accounts = signal([
    {
      id: '1',
      name: 'GP Morgan',
      accountNumber: '35-33223-002',
    },
    {
      id: '2',
      name: 'GP Lorgan',
      accountNumber: '35-33223-005',
    },
    {
      id: '3',
      name: 'GP Forgan',
      accountNumber: '35-33223-009',
    },
    {
      id: '4',
      name: 'GP Norgan',
      accountNumber: '35-33223-000',
    },
  ]);

  amount: number | null = null;
  account: string | null = null;

  getAccounts() {
    return this.accounts().map(account => ({
      value: account.id,
      label: `${account.name} - ${account.accountNumber}`,
    }));
  }

  getSelectedAccount() {
    return this.accounts().find(account => account.id === this.account);
  }

  getSublines() {
    const line = this.creditLine();
    if (!line?.sublines) return [];
    return line.sublines
      .filter(s => s.accountStatus === 'ACTIVE')
      .map(subline => ({
        value: subline.id,
        label: subline.name ?? '',
      }));
  }

  handleSublineChange(sublineId: string) {
    this.selectedSublineId.set(sublineId);
  }

  isSublineStepValid() {
    return Boolean(this.selectedSublineId());
  }

  getNewPrincipalBalance() {
    const currentBalance = this.creditLine()?.usageCents ?? 0;
    const paymentAmount = Number.isNaN(this.amount)
      ? undefined
      : parseFloat(`${this.amount}`.replaceAll(',', '').replaceAll('$', ''));

    if (!currentBalance || !paymentAmount) {
      return 0;
    }
    if (currentBalance < paymentAmount) {
      return 0;
    }

    return currentBalance - paymentAmount * 100;
  }

  updateSelectEvent(account: string) {
    this.account = account;
  }

  isFormValid() {
    const number = Number.isNaN(this.amount)
      ? undefined
      : parseFloat(`${this.amount}`.replaceAll(',', '').replaceAll('$', ''));
    // return Boolean(number && number > 0 && this.account);
    return Boolean(number && number > 0);
  }

  isDateValid() {
    return Boolean(this.date());
  }

  formatDate(date: Date | number | undefined): string {
    if (!date) {
      return '-';
    }

    if (typeof date === 'number') {
      return readableDateFromTimestamp(date);
    }

    return formatDate(date, 'short');
  }

  private formatPaymentDetails(): string {
    const line = this.creditLine();
    const subline = this.selectedSubline();
    const amountCents = (this.amount ?? 0) * 100;

    let text = 'PAYMENT REQUEST\n\n';
    text += `Account Number: ${line?.accountNumber ?? 'N/A'}\n`;
    text += `Credit Line Type: ${line?.accountType ?? 'N/A'}\n`;

    if (subline) {
      text += `Subline: ${subline.name}\n`;
    }

    text += '\nPAYMENT DETAILS:\n\n';
    text += `Payment Amount: ${formatAmountFromCents(amountCents)}\n`;
    text += `Payment Date: ${this.formatDate(this.date())}\n`;
    text += `Current Balance: ${formatAmountFromCents(line?.usageCents ?? 0)}\n`;
    text += `Balance After Payment: ${formatAmountFromCents(this.getNewPrincipalBalance())}\n`;

    if (this.showMaturityWarning()) {
      text += `\nNote: This payment will pay off the entire bill (maturity date is within 10 days)\n`;
    }

    const user = this.iamService.getActiveUser();
    if (user) {
      text += `\nRequested By: ${user.firstName} ${user.lastName}\n`;
    }

    return text;
  }

  // private createPaymentRequest() {
  //   const line = this.creditLine();
  //   if (!line) return;

  //   const sectionId = getUUID4();
  //   const attachmentId = getUUID4();
  //   const amountCents = (this.amount ?? 0) * 100;
  //   const requestName = `Payment Request - ${formatAmountFromCents(amountCents)} - ${line.accountNumber}`;

  //   // Build request users from credit line users, or create a fake user if none exist
  //   const requestUsers =
  //     line.users && line.users.length > 0
  //       ? line.users.map(creditLineUser => ({
  //           userId: creditLineUser.userId,
  //           userType: RequestUserTypes.INDIVIDUAL,
  //           userRole: RequestUserRoles.BORROWER,
  //           representatives: [],
  //           disabled: false,
  //         }))
  //       : [
  //           {
  //             userId: getUUID4(), // Fake user ID
  //             userType: RequestUserTypes.INDIVIDUAL,
  //             userRole: RequestUserRoles.BORROWER,
  //             representatives: [],
  //             disabled: false,
  //           },
  //         ];

  //   // Format payment details as text
  //   const paymentText = this.formatPaymentDetails();

  //   // Create the request payload
  //   const request: Partial<Request> = {
  //     id: '',
  //     name: requestName,
  //     mode: RequestModes.SIMPLE,
  //     productType: WorkflowProductTypes.LINE_OF_CREDIT,
  //     status: 'INITIATED',
  //     statusFlow: ['INITIATED', 'UNDER_REVIEW', 'APPROVED'],
  //     configuration: {
  //       stages: {
  //         INITIATED: {
  //           description: '',
  //           allowAddingApplicants: false,
  //           requireReviewBeforeSubmission: false,
  //         },
  //       },
  //     },
  //     requestType: RequestTypes.SERVICE,
  //     users: requestUsers,
  //     requestDigest: '',
  //     requestSteps: {
  //       INITIATED: {
  //         forRequest: [
  //           {
  //             id: sectionId,
  //             name: 'Payment Details',
  //             refreshAtRenewal: false,
  //             scope: 'request',
  //             description: '',
  //             instructions: [],
  //             step: 'INITIATED',
  //             status: SectionStatuses.IN_PROGRESS,
  //             applyTo: {
  //               userRoles: [
  //                 RequestUserRoles.BORROWER,
  //                 RequestUserRoles.CO_BORROWER,
  //                 RequestUserRoles.GUARANTOR,
  //               ],
  //               userTypes: [
  //                 RequestUserTypes.INDIVIDUAL,
  //                 RequestUserTypes.SOLE_PROPRIETORSHIP,
  //                 RequestUserTypes.CORPORATION,
  //                 RequestUserTypes.LP,
  //                 RequestUserTypes.LLP,
  //                 RequestUserTypes.LLC,
  //                 RequestUserTypes.GP,
  //                 RequestUserTypes.TRUST,
  //               ],
  //             },
  //             audiences: [],
  //             audiencesPermission: {},
  //             tasks: [
  //               {
  //                 name: 'DEFAULT_TASK_FOR_SIMPLE_MODE',
  //                 description: 'DEFAULT_TASK_FOR_SIMPLE_MODE',
  //                 status: TaskStatuses.PROVIDED,
  //                 taskType: TaskTypes.DEFAULT,
  //                 audiences: [],
  //                 audiencesPermission: {},
  //                 attachments: [
  //                   {
  //                     id: attachmentId,
  //                     name: 'Payment Details',
  //                     senderType: SenderTypes.SYSTEM,
  //                     writable: true,
  //                     type: AttachmentTypes.TEXT,
  //                     status: TaskStatuses.INCOMPLETE,
  //                     isTemplate: false,
  //                     allowSkip: false,
  //                     // @ts-expect-error update type
  //                     content: paymentText,
  //                   },
  //                 ],
  //               },
  //             ],
  //             usersToInclude: [],
  //             usersToExclude: [],
  //             sectionConditionals: [],
  //           },
  //         ],
  //         perApplicant: [],
  //         existing: [],
  //       },
  //       UNDER_REVIEW: {
  //         forRequest: [],
  //         perApplicant: [],
  //         existing: [],
  //       },
  //       APPROVED: {
  //         forRequest: [],
  //         perApplicant: [],
  //         existing: [],
  //       },
  //     },
  //     defaultMessage: {},
  //     workgroupId: null,
  //     isTemplate: false,
  //     sections: null,
  //     businesses: [],
  //     products: [],
  //   };

  //   // Call the workflow service to create the request
  //   this.workflowService.createRequest(request as Request).subscribe({
  //     next: () => {
  //       this.uiNotificationService.showSnackbar(
  //         'Payment request created successfully',
  //         'green',
  //         5000
  //       );
  //     },
  //     error: error => {
  //       this.uiNotificationService.showSnackbar(
  //         'Failed to create payment request',
  //         'red',
  //         5000
  //       );
  //       console.error('Error creating payment request:', error);
  //     },
  //   });
  // }

  confirmPayment() {
    this.isProcessing.set(true);

    this.servicingService
      .sendPaymentRequest(
        `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`,
        'Line of Credit',
        this.creditLine()?.accountNumber ?? '',
        this.amount ?? 0
      )
      .pipe(
        catchError(error => {
          if (this.isDemoMode()) {
            // In demo mode, simulate success
            return of(null);
          } else {
            // Rethrow error for non-demo mode
            throw error;
          }
        })
      )
      .subscribe({
        next: () => {
          // Create the workflow request after successful payment
          // this.createPaymentRequest();

          // Show notification
          this.uiNotificationService.showSnackbar(
            'Payment request processed',
            'green',
            5000
          );

          // Advance to success step
          this.currentStep.set(this.currentStep() + 1);
          this.isProcessing.set(false);
        },
        error: () => {
          this.isProcessing.set(false);
          this.uiNotificationService.showSnackbar(
            'Error processing payment request',
            'red',
            10000,
            'Close'
          );
        },
      });
  }

  parseFundingEntity(fundingEntity: unknown): ExistingFundingEntitySchema {
    return fundingEntity as ExistingFundingEntitySchema;
  }

  showPaymentPanel(): boolean {
    return this.showPortalUrl() || this.showWireInstructions();
  }

  showPortalUrl(): boolean {
    const fundingEntity = this.creditLine()?.fundingEntities.at(0);
    const parsedFundingEntity = this.parseFundingEntity(fundingEntity);

    const portalUrl = parsedFundingEntity?.paymentPortalUrl;

    return Boolean(portalUrl && portalUrl.trim() !== '');
  }

  showWireInstructions(): boolean {
    const fundingEntity = this.creditLine()?.fundingEntities.at(0);
    const parsedFundingEntity = this.parseFundingEntity(fundingEntity);

    const wireInstructions = parsedFundingEntity?.wireInstructions;

    return Boolean(wireInstructions && wireInstructions.trim() !== '');
  }

  goToPaymentPortal() {
    const fundingEntities = this.creditLine()?.fundingEntities ?? [];
    if (fundingEntities.length === 0) {
      return;
    }

    const fundingEntity = fundingEntities.at(0);

    if (!fundingEntity) {
      return;
    }

    const parsedFundingEntity = this.parseFundingEntity(fundingEntity);

    window.open(parsedFundingEntity.paymentPortalUrl ?? 'about:blank');
  }

  reset() {
    this.account = null;
    this.amount = null;
    return true;
  }

  getTenantName() {
    return this.organizationService.getTenantName();
  }

  isDemoMode() {
    return this.organizationService.isDemoModeActivated();
  }

  /**
   * Get the bill statement PDF filename based on the account number
   */
  getBillStatementFilename(): string | null {
    const accountNumber = this.creditLine()?.accountNumber;

    if (accountNumber === '2025-1025-MFLLC') {
      return 'bill-11-15.pdf';
    } else if (accountNumber === '2025-1026-MFLLC') {
      return 'bill-11-01.pdf';
    }

    return null;
  }

  /**
   * Download the bill statement as a static file
   */
  downloadBillStatement() {
    const filename = this.getBillStatementFilename();

    if (!filename) {
      this.uiNotificationService.showSnackbar(
        'No bill statement available for this account',
        'red',
        5000
      );
      return;
    }

    const filePath = `/assets/statements/${filename}`;
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filename;
    link.click();
  }
}
