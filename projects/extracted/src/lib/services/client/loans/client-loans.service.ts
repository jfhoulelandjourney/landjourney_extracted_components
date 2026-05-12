import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import {
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { SystemGroups } from '../../../models/authModels';
import { RequestUserTypes as UserTypes } from '../../../models/requestModels';
import { PermissionUtil } from '../../../utils/permissionUtil';
import { DiscussionService } from '../../discussions/discussion.service';
import { IAMService } from '../../identity/iam.service';
import { LendingService } from '../../lending/lending.service';
import {
  CreditLineOverviewSchema,
  CreditLineStatementBaseSchema,
  DetailedCreditLineCompoundSchema,
  YearCreditLineHistoryOverviewSchema,
} from '../../lending/models/credit-lines.models';
import { UserOverviewSchema } from '../../lending/models/lending-users.models';
import {
  StatementStatuses,
  UserRoles,
} from '../../lending/models/lending.enums';
import {
  DetailedLoanCompoundSchema,
  LoanOverviewSchema,
  LoanStatementBaseSchema,
  YearLoanHistoryOverviewSchema,
} from '../../lending/models/loans.models';
import { OrganizationService } from '../../organization/organization.service';
import { ThirdParty } from '../requests/client-requests.service';

@Injectable({
  providedIn: 'root',
})
export class ClientLoansService implements OnDestroy {
  readonly loansLoaded = signal<boolean>(false);
  readonly loans = signal<UserOverviewSchema | undefined>(undefined);
  readonly loanDetails = signal<DetailedLoanCompoundSchema[]>([]);
  readonly creditLineDetails = signal<DetailedCreditLineCompoundSchema[]>([]);

  // DEPENDENCIES
  private iamService = inject(IAMService);
  private organizationService = inject(OrganizationService);
  private readonly lendingService = inject(LendingService);
  private readonly discussionService = inject(DiscussionService);

  private destroy$ = new Subject<void>();

  readonly totalActiveLoans = computed(() => {
    let totalActiveBorrowedAmount = 0;

    this.loans()?.activeLoans.forEach(loan => {
      if (loan.principalBalanceCents && loan.inHouse) {
        totalActiveBorrowedAmount += loan.principalBalanceCents;
      }
    });

    this.loans()?.creditLines.forEach(creditLine => {
      if (creditLine.usedCreditCents && creditLine.inHouse) {
        totalActiveBorrowedAmount += creditLine.usedCreditCents;
      }
    });

    return totalActiveBorrowedAmount;
  });

  readonly totalEscrowedAmount = computed(() => {
    let totalEscrowedAmount = 0;

    this.loans()?.activeLoans.forEach(loan => {
      if (loan.escrowedAmountCents) {
        totalEscrowedAmount += loan.escrowedAmountCents;
      }
    });
    this.loans()?.creditLines.forEach(creditLine => {
      if (creditLine.escrowedAmountCents) {
        totalEscrowedAmount += creditLine.escrowedAmountCents;
      }
    });

    return totalEscrowedAmount;
  });

  reset() {
    this.loansLoaded.set(false);
    this.loans.set(undefined);
    this.loanDetails.set([]);
    this.creditLineDetails.set([]);
    this.loadLoans();
  }

  generateLoanData() {
    this.lendingService.generateLoanData().subscribe({
      next: () => this.loadLoans(),
    });
  }

  loadLoans() {
    if (
      this.organizationService.uiConfiguration.sharedDomain &&
      !this.organizationService.uiConfiguration.sharedDomainId
    ) {
      return;
    }

    this.loansLoaded.set(false);
    this.lendingService.getUserOverview().subscribe({
      next: response => {
        this.loans.set(response);
        this.loansLoaded.set(true);
      },
      error: () => {
        this.loansLoaded.set(true);
      },
    });
  }

  loadAllLoansDetails() {
    this.lendingService.getAllLoansForCurrentUser().subscribe({
      next: loans => {
        this.loanDetails.set(loans);
      },
    });
  }

  loadAllCreditLinesDetails() {
    this.lendingService.getAllCreditLinesForCurrentUser().subscribe({
      next: creditLines => {
        this.creditLineDetails.set(creditLines);
      },
    });
  }

  public getLoanById(loanId: string): Observable<DetailedLoanCompoundSchema> {
    const loan = this.loanDetails().find(l => l.id === loanId);

    if (loan) {
      return of(loan);
    } else {
      return this.lendingService.getLoanById(loanId).pipe(
        tap((response: DetailedLoanCompoundSchema) => {
          this.loanDetails.set([...this.loanDetails(), response]);
        })
      );
    }
  }

  public getCreditLineById(
    creditLineId: string
  ): Observable<DetailedCreditLineCompoundSchema> {
    const creditLine = this.creditLineDetails().find(
      cl => cl.id === creditLineId
    );

    if (creditLine) {
      return of(creditLine);
    } else {
      return this.lendingService.getCreditLineById(creditLineId).pipe(
        tap((response: DetailedCreditLineCompoundSchema) => {
          this.creditLineDetails.set([...this.creditLineDetails(), response]);
        })
      );
    }
  }

  public getLoanHistory(
    loanId: string
  ): Observable<YearLoanHistoryOverviewSchema[]> {
    return this.lendingService
      .getLoanHistoryYearsAvailable(loanId)
      .pipe(
        switchMap(years =>
          forkJoin(
            years
              .sort((year1, year2) => (year1 < year2 ? 1 : -1))
              .map(year =>
                this.lendingService.getLoanYearlyHistory(loanId, year)
              )
          )
        )
      );
  }

  public getCreditLineHistory(
    creditLineId: string
  ): Observable<YearCreditLineHistoryOverviewSchema[]> {
    return this.lendingService
      .getCreditLineHistoryYearsAvailable(creditLineId)
      .pipe(
        switchMap(years =>
          forkJoin(
            years
              .sort((year1, year2) => (year1 < year2 ? 1 : -1))
              .map(year =>
                this.lendingService.getCreditLineYearlyHistory(
                  creditLineId,
                  year
                )
              )
          )
        )
      );
  }

  public async delegateCreditLines(
    creditLines: (
      | CreditLineOverviewSchema
      | DetailedCreditLineCompoundSchema
    )[],
    thirdParty: ThirdParty,
    sendEmail: boolean
  ): Promise<boolean> {
    const userCreationResponse = await lastValueFrom(
      this.organizationService.safeAddUserToOrganization({
        ...thirdParty,
        groups: [SystemGroups.CUSTOMERS],
      })
    );

    const userId = userCreationResponse.id;

    if (!userId) {
      Promise.resolve(false);
    }

    if (creditLines.some(creditLine => !creditLine.userCanShare)) {
      return Promise.resolve(false);
    }

    for (const creditLine of creditLines) {
      await lastValueFrom(
        this.lendingService.addUserToCreditLine(
          creditLine.id,
          userId ?? '',
          UserRoles.COLLABORATOR,
          UserTypes.INDIVIDUAL
        )
      );
    }

    const currentUserName = `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`;

    if (sendEmail) {
      await lastValueFrom(
        this.discussionService.sendCollaboratorEmailInvite(
          userCreationResponse.id ?? '',
          `${thirdParty.firstName} ${thirdParty.lastName}`,
          thirdParty.email,
          currentUserName,
          this.organizationService.getTenantName(),
          'loans'
        )
      );
    }

    return Promise.resolve(true);
  }

  public async delegateLoans(
    loans: (LoanOverviewSchema | DetailedLoanCompoundSchema)[],
    thirdParty: ThirdParty,
    sendEmail: boolean
  ): Promise<boolean> {
    const userCreationResponse = await lastValueFrom(
      this.organizationService.safeAddUserToOrganization({
        ...thirdParty,
        groups: [SystemGroups.CUSTOMERS],
      })
    );

    const userId = userCreationResponse.id;

    if (!userId) {
      Promise.resolve(false);
    }

    if (loans.some(loan => !loan.userCanShare)) {
      return Promise.resolve(false);
    }

    for (const loan of loans) {
      await lastValueFrom(
        this.lendingService.addUserToLoan(
          loan.id,
          userId ?? '',
          UserRoles.COLLABORATOR,
          UserTypes.INDIVIDUAL
        )
      );
    }

    const currentUserName = `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`;

    if (sendEmail) {
      await lastValueFrom(
        this.discussionService.sendCollaboratorEmailInvite(
          userCreationResponse.id ?? '',
          `${thirdParty.firstName} ${thirdParty.lastName}`,
          thirdParty.email,
          currentUserName,
          this.organizationService.getTenantName(),
          'loans'
        )
      );
    }

    return Promise.resolve(true);
  }

  public async delegateAllLoansAndCreditLines(
    loans: (LoanOverviewSchema | DetailedLoanCompoundSchema)[],
    creditLines: (
      | CreditLineOverviewSchema
      | DetailedCreditLineCompoundSchema
    )[],
    thirdParty: ThirdParty
  ): Promise<boolean> {
    const userCreationResponse = await lastValueFrom(
      this.organizationService.safeAddUserToOrganization({
        ...thirdParty,
        groups: [SystemGroups.CUSTOMERS],
      })
    );

    const userId = userCreationResponse.id;

    if (!userId) {
      Promise.resolve(false);
    }

    if (
      loans.some(
        loan =>
          !loan.userCanShare ||
          creditLines.some(creditLine => !creditLine.userCanShare)
      )
    ) {
      return Promise.resolve(false);
    }

    for (const loan of loans) {
      await lastValueFrom(
        this.lendingService.addUserToLoan(
          loan.id,
          userId ?? '',
          UserRoles.COLLABORATOR,
          UserTypes.INDIVIDUAL
        )
      );
    }

    for (const creditLine of creditLines) {
      await lastValueFrom(
        this.lendingService.addUserToCreditLine(
          creditLine.id,
          userId ?? '',
          UserRoles.COLLABORATOR,
          UserTypes.INDIVIDUAL
        )
      );
    }

    const currentUserName = `${this.iamService.getActiveUser()?.firstName} ${this.iamService.getActiveUser()?.lastName}`;

    await lastValueFrom(
      this.discussionService.sendCollaboratorEmailInvite(
        userCreationResponse.id ?? '',
        `${thirdParty.firstName} ${thirdParty.lastName}`,
        thirdParty.email,
        currentUserName,
        this.organizationService.getTenantName(),
        'loans'
      )
    );

    return Promise.resolve(true);
  }

  public async removeDelegateFromAllProducts(userId: string): Promise<boolean> {
    const organizationUserId = this.organizationService.getOrganizationUserId();

    if (!organizationUserId) {
      return Promise.resolve(false);
    }

    const loans: DetailedLoanCompoundSchema[] = this.loanDetails().filter(
      loan =>
        PermissionUtil.isUserCollaboratorOnCreditLine(userId, loan.users) &&
        loan.userCanShare
    );

    const creditLines: DetailedCreditLineCompoundSchema[] =
      this.creditLineDetails().filter(
        creditLine =>
          PermissionUtil.isUserCollaboratorOnCreditLine(
            userId,
            creditLine.users
          ) && creditLine.userCanShare
      );

    await this.removeDelegateFromCreditLines(creditLines, userId);
    await this.removeDelegateFromLoans(loans, userId);

    return Promise.resolve(true);
  }

  public async removeDelegateFromCreditLines(
    creditLines: (
      | CreditLineOverviewSchema
      | DetailedCreditLineCompoundSchema
    )[],
    userId: string
  ): Promise<boolean> {
    for (const creditLine of creditLines) {
      await lastValueFrom(
        this.lendingService.deleteUserFromCreditLine(creditLine.id, userId)
      );
    }

    this.loadAllCreditLinesDetails();

    return Promise.resolve(true);
  }

  public async removeDelegateFromLoans(
    loans: (LoanOverviewSchema | DetailedLoanCompoundSchema)[],
    userId: string
  ): Promise<boolean> {
    for (const loan of loans) {
      await lastValueFrom(
        this.lendingService.deleteUserFromLoan(loan.id, userId)
      );
    }

    this.loadAllLoansDetails();

    return Promise.resolve(true);
  }

  public getLoanStatements(
    loanId: string,
    onlyActive: boolean
  ): Observable<LoanStatementBaseSchema[]> {
    return this.lendingService.getLoanStatements(loanId).pipe(
      map((statements: LoanStatementBaseSchema[]) => {
        if (!onlyActive) {
          return statements.sort((one, two) =>
            one.dateEmitted < two.dateEmitted ? 1 : -1
          );
        }

        const overdueStatements = statements.filter(
          statement => statement.statementStatus === StatementStatuses.OVERDUE
        );

        const upcomingSortedStatements = statements
          .filter(
            statement =>
              statement.statementStatus === StatementStatuses.UPCOMING
          )
          .sort((one, two) => (one.dateDue < two.dateDue ? -1 : 1));

        return [...overdueStatements, ...upcomingSortedStatements];
      })
    );
  }

  public getCreditLineStatements(
    creditLineId: string,
    onlyActive: boolean
  ): Observable<CreditLineStatementBaseSchema[]> {
    return this.lendingService.getCreditLineStatements(creditLineId).pipe(
      map((statements: CreditLineStatementBaseSchema[]) => {
        if (!onlyActive) {
          return statements.sort((one, two) =>
            one.dateEmitted < two.dateEmitted ? 1 : -1
          );
        }

        const overdueStatements = statements.filter(
          statement => statement.statementStatus === StatementStatuses.OVERDUE
        );

        const upcomingSortedStatements = statements
          .filter(
            statement =>
              statement.statementStatus === StatementStatuses.UPCOMING
          )
          .sort((one, two) => (one.dateDue < two.dateDue ? -1 : 1));

        return [...overdueStatements, ...upcomingSortedStatements];
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
