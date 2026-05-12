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
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { WorkflowProductTypes } from '../../../models/products/workflow-productTypes';
import type { Request } from '../../../models/requestModels';
import {
  RequestModes,
  RequestTypes,
  RequestUserRoles,
  RequestUserTypes,
} from '../../../models/requestModels';
import {
  AttachmentTypes,
  SectionStatuses,
  SenderTypes,
  TaskStatuses,
  TaskTypes,
} from '../../../models/sectionModels';
import { IAMService } from '../../../services/identity/iam.service';
import { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';
import { ServicingService } from '../../../services/lending/servicing/servicing.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { WorkflowService } from '../../../services/workflows-api/workflow.service';
import { formatAmountFromCents } from '../../../utils/numberUtil';
import { getUUID4 } from '../../../utils/stringUtil';
import { formatDate, readableDateFromTimestamp } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';
import { LjRoundHeaderChipComponent } from '../../chip/lj-round-header-chip/lj-round-header-chip.component';
import { LjInputFieldComponent } from '../../form/input-field/input-field.component';
import { LjMoneyInputFieldComponent } from '../../form/money-input-field/money-input-field.component';
import { LjSelectFieldComponent } from '../../form/select-field/select-field.component';
import { CreditLineHeaderComponent } from '../credit-line-header/credit-line-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-credit-line-draw-funds',
  templateUrl: './credit-line-draw-funds.component.html',
  styleUrls: ['./credit-line-draw-funds.component.scss'],
  imports: [
    MatIconModule,
    CreditLineHeaderComponent,
    ActivateDirective,
    LjButtonComponent,
    LjMoneyInputFieldComponent,
    LjSelectFieldComponent,
    FormsModule,
    MatDatepickerModule,
    MatExpansionModule,
    LjInputFieldComponent,
    LjRoundHeaderChipComponent,
  ],
})
export class CreditLineDrawFundsComponent {
  readonly servicingService = inject(ServicingService);
  readonly iamService = inject(IAMService);
  readonly organizationService = inject(OrganizationService);
  readonly uiNotificationService = inject(UiNotificationService);
  readonly workflowService = inject(WorkflowService);
  currentStep = signal(0);

  /**
   * Check if demo mode is enabled
   */
  isDemoMode = computed(() =>
    this.organizationService.isFeatureFlagActivated('DEMO_MODE')
  );

  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }

  mobile = input<boolean>(false);
  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();
  panelOpen = model(true);

  /**
   * Check if the credit line has sublines
   */
  hasSublines = computed(() => {
    const line = this.creditLine();
    return Boolean(line?.sublines && line.sublines.length > 0);
  });

  /**
   * Selected subline ID when drawing from a mainline credit line
   */
  selectedSublineId = signal<string | null>(null);

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
   * Calculate total used credit:
   * - If sublines exist, sum the usageCents from all sublines
   * - Otherwise, use the usageCents from the credit line
   */
  usedCreditCents = computed(() => {
    const line = this.creditLine();
    if (!line) return 0;

    // If credit line has sublines, sum their usage
    if (line.sublines && line.sublines.length > 0) {
      return line.sublines.reduce(
        (total, subline) => total + (subline.usageCents ?? 0),
        0
      );
    }

    // Otherwise use the credit line's usage
    return line.usageCents ?? 0;
  });

  /**
   * Calculate available credit:
   * - If a subline is selected, use that subline's available credit
   * - Otherwise, use total available credit (creditLimitCents - usedCredit)
   */
  availableCreditCents = computed(() => {
    const line = this.creditLine();
    if (!line) return 0;

    return line.availableCents;
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

  amount = signal<number | null>(null);
  account: string | null = null;
  authorizationCode: string | null = null;
  date: Date | undefined = undefined;
  now: Date = new Date();

  /**
   * Parse the amount input to cents
   */
  parsedAmountCents = computed(() => {
    const value = this.amount();
    const number = Number.isNaN(value)
      ? undefined
      : parseFloat(`${value}`.replaceAll(',', '').replaceAll('$', ''));

    if (!number || number <= 0) return 0;
    return Math.round(number * 100);
  });

  /**
   * Check if the entered amount exceeds available credit
   */
  amountExceedsLimit = computed(() => {
    const amountCents = this.parsedAmountCents();
    const availableCents = this.availableCreditCents();
    if (amountCents === 0) return false;
    return amountCents > availableCents;
  });

  /**
   * Get error message for amount field
   */
  amountErrorMessage = computed(() => {
    if (this.amountExceedsLimit()) {
      return `Amount cannot exceed available credit of ${this.formatAmount(this.availableCreditCents())}`;
    }
    return '';
  });

  getAccounts() {
    return this.accounts().map(account => ({
      value: account.id,
      label: `${account.name} - ${account.accountNumber}`,
    }));
  }

  getSelectedAccount() {
    return this.accounts().find(account => account.id === this.account);
  }

  updateSelectEvent(account: string) {
    this.account = account;
  }

  handleDateChanged(date: Date | null) {
    this.date = date ?? undefined;
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

  isFirstStepValid() {
    const amountCents = this.parsedAmountCents();
    // Amount must be greater than 0 and not exceed available credit
    return amountCents > 0 && !this.amountExceedsLimit();
  }

  isSecondStepValid() {
    return Boolean(this.date);
  }

  isAuthorizationCodeValid() {
    // In demo mode, skip PIN requirement
    if (this.isDemoMode()) {
      return true;
    }
    return Boolean(this.authorizationCode?.trim());
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

  private formatDrawDetails(): string {
    const line = this.creditLine();
    const subline = this.selectedSubline();
    const selectedAccount = this.getSelectedAccount();
    const amountCents = this.parsedAmountCents();

    let text = 'DRAW FUNDS REQUEST\n\n';
    text += `Account Number: ${line?.accountNumber ?? 'N/A'}\n`;
    text += `Credit Line Type: ${line?.accountType ?? 'N/A'}\n`;

    if (subline) {
      text += `Subline: ${subline.name}\n`;
    }

    text += '\nDRAW DETAILS:\n\n';
    text += `Draw Amount: ${formatAmountFromCents(amountCents)}\n`;
    text += `Draw Date: ${this.formatDate(this.date)}\n`;
    text += `Destination Account: ${selectedAccount ? `${selectedAccount.name} - ${selectedAccount.accountNumber}` : 'N/A'}\n`;
    text += `Available Credit Before: ${formatAmountFromCents(this.availableCreditCents())}\n`;
    text += `Available Credit After: ${formatAmountFromCents(this.availableCreditCents() - amountCents)}\n`;

    const user = this.iamService.getActiveUser();
    if (user) {
      text += `\nRequested By: ${user.firstName} ${user.lastName}\n`;
    }

    return text;
  }

  private createDrawRequest() {
    const line = this.creditLine();
    if (!line) return;

    const sectionId = getUUID4();
    const attachmentId = getUUID4();
    const requestName = `Draw Funds Request - ${formatAmountFromCents(this.parsedAmountCents())} - ${line.accountNumber}`;

    // Build request users from credit line users, or create a fake user if none exist
    const requestUsers =
      line.users && line.users.length > 0
        ? line.users.map(creditLineUser => ({
            userId: creditLineUser.userId,
            userType: RequestUserTypes.INDIVIDUAL,
            userRole: RequestUserRoles.BORROWER,
            representatives: [],
            disabled: false,
          }))
        : [
            {
              userId: getUUID4(), // Fake user ID
              userType: RequestUserTypes.INDIVIDUAL,
              userRole: RequestUserRoles.BORROWER,
              representatives: [],
              disabled: false,
            },
          ];

    // Format draw details as text
    const drawText = this.formatDrawDetails();

    // Create the request payload
    const request: Partial<Request> = {
      id: '',
      name: requestName,
      mode: RequestModes.SIMPLE,
      productType: WorkflowProductTypes.LINE_OF_CREDIT,
      status: 'INITIATED',
      statusFlow: ['INITIATED', 'UNDER_REVIEW', 'APPROVED'],
      configuration: {
        stages: {
          INITIATED: {
            description: '',
            allowAddingApplicants: false,
            requireReviewBeforeSubmission: false,
          },
        },
      },
      requestType: RequestTypes.SERVICE,
      clientCanInitiate: false,
      users: requestUsers,
      requestDigest: '',
      requestSteps: {
        INITIATED: {
          forRequest: [
            {
              id: sectionId,
              name: 'Draw Funds',
              refreshAtRenewal: false,
              scope: 'request',
              description: '',
              instructions: [],
              step: 'INITIATED',
              status: SectionStatuses.IN_PROGRESS,
              applyTo: {
                userRoles: [
                  RequestUserRoles.BORROWER,
                  RequestUserRoles.CO_BORROWER,
                  RequestUserRoles.GUARANTOR,
                ],
                userTypes: [
                  RequestUserTypes.INDIVIDUAL,
                  RequestUserTypes.SOLE_PROPRIETORSHIP,
                  RequestUserTypes.CORPORATION,
                  RequestUserTypes.LP,
                  RequestUserTypes.LLP,
                  RequestUserTypes.LLC,
                  RequestUserTypes.GP,
                  RequestUserTypes.TRUST,
                  RequestUserTypes.ESTATE,
                ],
              },
              audiences: [],
              audiencesPermission: {},
              tasks: [
                {
                  name: 'DEFAULT_TASK_FOR_SIMPLE_MODE',
                  description: 'DEFAULT_TASK_FOR_SIMPLE_MODE',
                  status: TaskStatuses.PROVIDED,
                  taskType: TaskTypes.DEFAULT,
                  audiences: [],
                  audiencesPermission: {},
                  attachments: [
                    {
                      id: attachmentId,
                      name: 'Draw Details',
                      senderType: SenderTypes.SYSTEM,
                      writable: true,
                      type: AttachmentTypes.TEXT,
                      status: TaskStatuses.INCOMPLETE,
                      isTemplate: false,
                      allowSkip: false,
                      text: drawText,
                    },
                  ],
                },
              ],
              usersToInclude: [],
              usersToExclude: [],
              internal: false,
              internalAssigneeIds: [],
              reviewRequired: false,
              reviewerRole: undefined,
              reviewStatus: null,
              reviewerAssigneeId: null,
              sectionConditionals: [],
            },
          ],
          perApplicant: [],
          existing: [],
        },
        UNDER_REVIEW: {
          forRequest: [],
          perApplicant: [],
          existing: [],
        },
        APPROVED: {
          forRequest: [],
          perApplicant: [],
          existing: [],
        },
      },
      defaultMessage: {},
      workgroupId: null,
      isTemplate: false,
      sections: null,
      businesses: [],
      products: [],
    };

    // Call the workflow service to create the request
    this.workflowService.createRequest(request as Request).subscribe({
      next: () => {
        this.uiNotificationService.showSnackbar(
          'Draw funds request created successfully',
          'green',
          5000
        );
      },
      error: error => {
        this.uiNotificationService.showSnackbar(
          'Failed to create draw funds request',
          'red',
          5000
        );
        console.error('Error creating draw request:', error);
      },
    });
  }

  confirmDrawFunds() {
    const createRequest$ = of(this.isDemoMode()).pipe(
      switchMap(isDemo => {
        if (isDemo) {
          this.createDrawRequest();
        }
        return of(null);
      })
    );

    const notification$ = this.servicingService
      .sendDrawFundsRequest(
        `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`,
        this.creditLine()?.accountNumber ?? '',
        this.amount() ?? 0,
        formatDate(this.date ?? new Date()),
        this.authorizationCode ?? ''
      )
      .pipe(
        catchError(error => {
          if (this.isDemoMode()) {
            return of(null); // Swallow error in demo mode
          } else {
            throw error; // Rethrow error in non-demo mode
          }
        })
      );

    forkJoin([createRequest$, notification$]).subscribe({
      next: () => {
        this.currentStep.set(this.currentStep() + 1);
      },
      error: () => {
        this.uiNotificationService.showSnackbar(
          'Error sending draw request',
          'red',
          10000,
          'Close'
        );
      },
    });
  }

  getNewBalance(): number {
    const currentBalance = this.availableCreditCents();
    const value = this.amount();
    const drawAmount = Number.isNaN(value)
      ? undefined
      : parseFloat(`${value}`.replaceAll(',', '').replaceAll('$', ''));

    if (!currentBalance || !drawAmount) {
      return 0;
    }
    if (currentBalance < drawAmount) {
      return 0;
    }

    return currentBalance + drawAmount * 100;
  }

  reset() {
    this.selectedSublineId.set(null);
    this.account = null;
    this.amount.set(null);
    this.authorizationCode = null;
    this.date = undefined;
    return true;
  }
}
