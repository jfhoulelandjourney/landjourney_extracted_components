import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import type {
  InterestRateStep,
  Product,
  ProductFee,
  Program,
} from '../../models/products/products.model';
import type { Request, RequestUser } from '../../models/requestModels';
import { RequestUserRoles } from '../../models/requestModels';
import { getUUID4 } from '../../utils/stringUtil';
import { KeyValueService } from '../data/keyValue.service';
import type { KeyValueRecord } from '../data/models/key-value.models';
import { LendingManagementService } from '../lending/lendingManagement.service';
import type {
  CreditLine,
  StepInterestRate,
} from '../lending/models/credit-lines.models';
import type { ExistingFeeSchema } from '../lending/models/fees.models';
import {
  LendingAccountStatuses as AccountStatuses,
  CreditLineTypes,
  FeeTypes,
  Frequencies,
  InterestAttributes,
  LendTypes,
  LendingTimeUnits as TimeUnits,
  UserRoles,
} from '../lending/models/lending.enums';
import type { LoanUserBaseSchema } from '../lending/models/loans.models';
import type { ExistingServicerSchema } from '../lending/models/servicers.models';
import { OrganizationService } from '../organization/organization.service';

export type Subline = {
  id: string;
  sublineLimit?: number;
  product?: Product;
  coreSubAccountNumber?: string; // 10 digits
};

export enum OfferStatus {
  DRAFT = 'DRAFT',
  UNDERWRITING = 'UNDERWRITING',
  APPLICANT = 'APPLICANT',
  RETAILER = 'RETAILER',
  AGENT = 'AGENT',
  APPROVED = 'APPROVED',
  REJECTED_BY_UNDERWRITING = 'REJECTED_BY_UNDERWRITING',
  REJECTED_BY_CLIENT = 'REJECTED_BY_CLIENT',
  REJECTED_BY_RETAILER = 'REJECTED_BY_RETAILER',
  REJECTED_BY_AGENT = 'REJECTED_BY_AGENT',
  LOAN_CREATED = 'LOAN_CREATED',
}

export type Offer = {
  id: string;
  name: string;
  requestId: string;
  program?: Program;
  originationDate?: Date;
  targetedMaturity?: Date;
  desiredCreditLimit?: number;
  masterLineId?: string; // Format: ML-year-6digits (e.g., ML-2025-123456)
  coreMasterAccountNumber?: string; // 10 digits
  sublines?: Subline[]; // Array of sublines
  status: OfferStatus;
  sentToUnderwritingAt?: Date;
  sentToUnderwritingBy?: string;
  sentToApplicantBy?: string;
  sentToApplicantAt?: Date;
  clientApprovedBy?: string;
  clientApprovedAt?: Date;
  retailerApprovedBy?: string;
  retailerApprovedAt?: Date;
  agentApprovedBy?: string;
  agentApprovedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectedReason?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
  underwritingApprovedBy?: string;
  underwritingApprovedAt?: Date;
  underwritingApprovalConditions?: Array<{ description: string }>;
  loanCreatedAt?: Date;
  loanCreatedBy?: string;
  loanId?: string;
};

// Serialized version of Offer for localStorage (Dates as strings)
type SerializedOffer = Omit<
  Offer,
  | 'originationDate'
  | 'targetedMaturity'
  | 'clientApprovedAt'
  | 'retailerApprovedAt'
  | 'agentApprovedAt'
  | 'loanCreatedAt'
  | 'rejectedAt'
  | 'createdAt'
  | 'updatedAt'
  | 'underwritingApprovedAt'
  | 'sentToUnderwritingAt'
  | 'sentToApplicantAt'
> & {
  originationDate?: string;
  targetedMaturity?: string;
  clientApprovedAt?: string;
  retailerApprovedAt?: string;
  agentApprovedAt?: string;
  loanCreatedAt?: string;
  rejectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  underwritingApprovedAt?: string;
  sentToUnderwritingAt?: string;
  sentToApplicantAt?: string;
};

@Injectable({
  providedIn: 'root',
})
export class OffersService {
  private organizationService = inject(OrganizationService);
  private keyValueService = inject(KeyValueService);
  private lendingManagementService = inject(LendingManagementService);

  // LocalStorage key prefix
  private readonly OFFERS_KEY_PREFIX = 'offers_data';

  /**
   * Generate a random 10-digit account number
   */
  generateCoreMasterAccountNumber(): string {
    // Generate 10 random digits
    const digits = Array.from({ length: 10 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    return digits;
  }

  generateCoreSubAccountNumber = this.generateCoreMasterAccountNumber;

  /**
   * Generate a master line ID in format: ML-year-6digits
   */
  generateMasterLineId(): string {
    const year = new Date().getFullYear();
    // Generate 6 random digits
    const digits = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    return `ML-${year}-${digits}`;
  }

  /**
   * Get the localStorage key for a specific request
   */
  private getOffersKey(requestId: string): string {
    return `${this.OFFERS_KEY_PREFIX}:${requestId}`;
  }

  /**
   * Serialize an Offer for storage (convert Dates to ISO strings)
   */
  private serializeOffer(offer: Offer): SerializedOffer {
    return {
      ...offer,
      originationDate: offer.originationDate?.toISOString(),
      targetedMaturity: offer.targetedMaturity?.toISOString(),
      clientApprovedAt: offer.clientApprovedAt?.toISOString(),
      retailerApprovedAt: offer.retailerApprovedAt?.toISOString(),
      agentApprovedAt: offer.agentApprovedAt?.toISOString(),
      loanCreatedAt: offer.loanCreatedAt?.toISOString(),
      rejectedAt: offer.rejectedAt?.toISOString(),
      createdAt: offer.createdAt?.toISOString(),
      updatedAt: offer.updatedAt?.toISOString(),
      underwritingApprovedAt: offer.underwritingApprovedAt?.toISOString(),
      sentToUnderwritingAt: offer.sentToUnderwritingAt?.toISOString(),
      sentToApplicantAt: offer.sentToApplicantAt?.toISOString(),
    };
  }

  /**
   * Deserialize an Offer from storage (convert ISO strings to Dates)
   */
  private deserializeOffer(serialized: SerializedOffer): Offer {
    return {
      ...serialized,
      originationDate: serialized.originationDate
        ? new Date(serialized.originationDate)
        : undefined,
      targetedMaturity: serialized.targetedMaturity
        ? new Date(serialized.targetedMaturity)
        : undefined,
      clientApprovedAt: serialized.clientApprovedAt
        ? new Date(serialized.clientApprovedAt)
        : undefined,
      retailerApprovedAt: serialized.retailerApprovedAt
        ? new Date(serialized.retailerApprovedAt)
        : undefined,
      agentApprovedAt: serialized.agentApprovedAt
        ? new Date(serialized.agentApprovedAt)
        : undefined,
      loanCreatedAt: serialized.loanCreatedAt
        ? new Date(serialized.loanCreatedAt)
        : undefined,
      rejectedAt: serialized.rejectedAt
        ? new Date(serialized.rejectedAt)
        : undefined,
      createdAt: serialized.createdAt
        ? new Date(serialized.createdAt)
        : undefined,
      updatedAt: serialized.updatedAt
        ? new Date(serialized.updatedAt)
        : undefined,
      underwritingApprovedAt: serialized.underwritingApprovedAt
        ? new Date(serialized.underwritingApprovedAt)
        : undefined,
      sentToUnderwritingAt: serialized.sentToUnderwritingAt
        ? new Date(serialized.sentToUnderwritingAt)
        : undefined,
      sentToApplicantAt: serialized.sentToApplicantAt
        ? new Date(serialized.sentToApplicantAt)
        : undefined,
    };
  }

  /**
   * Save an offer to localStorage
   */
  saveOffer(offer: Offer): Observable<Offer> {
    try {
      const key = this.getOffersKey(offer.requestId);
      const existingOffers = this.getOffersForRequestFromLocalStorage(
        offer.requestId
      );
      const currentUserId = this.organizationService.getOrganizationUserId();
      const now = new Date();

      // Update existing offer or add new one
      const offerIndex = existingOffers.findIndex(o => o.id === offer.id);
      let updatedOffer: Offer;

      if (offerIndex >= 0) {
        // Update existing offer
        const existingOffer = existingOffers[offerIndex];
        if (!existingOffer) {
          // Fallback if somehow offerIndex is valid but offer is undefined
          updatedOffer = {
            ...offer,
            status: offer.status ?? OfferStatus.DRAFT,
            createdBy: offer.createdBy ?? currentUserId,
            createdAt: offer.createdAt ?? now,
            updatedBy: currentUserId,
            updatedAt: now,
          };
        } else {
          updatedOffer = {
            ...offer,
            // Preserve createdBy and createdAt
            createdBy: existingOffer.createdBy ?? currentUserId,
            createdAt: existingOffer.createdAt ?? now,
            // Update updatedBy and updatedAt
            updatedBy: currentUserId,
            updatedAt: now,
            // Preserve status if it's not DRAFT (don't override status changes)
            status: offer.status ?? existingOffer.status ?? OfferStatus.DRAFT,
          };
        }
        existingOffers[offerIndex] = updatedOffer;
      } else {
        // Create new offer
        updatedOffer = {
          ...offer,
          // Set status to DRAFT for new offers
          status: offer.status ?? OfferStatus.DRAFT,
          // Set createdBy and createdAt
          createdBy: offer.createdBy ?? currentUserId,
          createdAt: offer.createdAt ?? now,
          // Set updatedBy and updatedAt
          updatedBy: offer.updatedBy ?? currentUserId,
          updatedAt: offer.updatedAt ?? now,
        };
        existingOffers.push(updatedOffer);
      }

      // Serialize all offers
      const serializedOffers = existingOffers.map(o => this.serializeOffer(o));

      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(serializedOffers));

      if (
        updatedOffer.status === OfferStatus.APPLICANT ||
        updatedOffer.status === OfferStatus.AGENT ||
        updatedOffer.status === OfferStatus.RETAILER ||
        updatedOffer.status === OfferStatus.APPROVED ||
        updatedOffer.status === OfferStatus.REJECTED_BY_AGENT ||
        updatedOffer.status === OfferStatus.REJECTED_BY_RETAILER ||
        updatedOffer.status === OfferStatus.REJECTED_BY_CLIENT ||
        updatedOffer.status === OfferStatus.LOAN_CREATED
      ) {
        const keyValueKey = `offer-request-${updatedOffer.requestId}`;
        const serializedOffer = this.serializeOffer(updatedOffer);

        // Save to key-value service (fire and forget, don't block on this)
        this.keyValueService
          .upsertKeyValues([
            {
              key: keyValueKey,
              value: JSON.stringify(serializedOffer),
            },
          ])
          .subscribe({
            error: error => {
              console.error('Error saving offer to key-value service:', error);
            },
          });
      }

      return of(updatedOffer);
    } catch (error) {
      console.error('Error saving offer to localStorage:', error);
      return of(offer); // Return the offer even if save fails
    }
  }

  /**
   * Get all offers for a specific request from localStorage (synchronous helper)
   */
  private getOffersForRequestFromLocalStorage(requestId: string): Offer[] {
    try {
      const key = this.getOffersKey(requestId);
      const offersData = localStorage.getItem(key);

      if (!offersData) {
        return [];
      }

      const serializedOffers: SerializedOffer[] = JSON.parse(offersData);
      return serializedOffers.map(o => this.deserializeOffer(o));
    } catch (error) {
      console.error('Error loading offers from localStorage:', error);
      return [];
    }
  }

  /**
   * Get all offers for a specific request
   * First checks key-value store, then falls back to localStorage
   */
  getOffersForRequest(requestId: string): Observable<Offer[]> {
    const keyValueKey = `offer-request-${requestId}`;

    return this.keyValueService.getKeyValue(keyValueKey).pipe(
      map(result => {
        // If found in key-value store, return it
        if (
          result &&
          result.data &&
          result.data.data &&
          result.data.data.value
        ) {
          try {
            const serializedOffer: SerializedOffer = JSON.parse(
              result.data.data.value as string
            );
            const offer = this.deserializeOffer(serializedOffer);
            return [offer];
          } catch (error) {
            console.error('Error parsing offer from key-value store:', error);
            // Fall through to localStorage
          }
        }
        // Fall back to localStorage
        return this.getOffersForRequestFromLocalStorage(requestId);
      }),
      catchError(error => {
        console.error('Error loading offer from key-value store:', error);
        // Fall back to localStorage
        return of(this.getOffersForRequestFromLocalStorage(requestId));
      })
    );
  }

  /**
   * Get a specific offer by ID for a request
   */
  getOffer(requestId: string, offerId: string): Observable<Offer | undefined> {
    return this.getOffersForRequest(requestId).pipe(
      map(offers => offers.find(o => o.id === offerId))
    );
  }

  /**
   * Delete an offer from localStorage and key-value store
   */
  deleteOffer(requestId: string, offerId: string): Observable<boolean> {
    const keyValueKey = `offer-request-${requestId}`;

    // Check if offer exists in key-value store and delete it if it does
    return this.keyValueService.getKeyValue(keyValueKey).pipe(
      switchMap(keyValueResult => {
        // Delete from key-value store if the offer exists there
        const deleteKeyValue$ =
          keyValueResult &&
          keyValueResult.data &&
          keyValueResult.data.data &&
          keyValueResult.data.data.value
            ? this.keyValueService.deleteKeyValue(keyValueKey).pipe(
                catchError(error => {
                  console.error(
                    'Error deleting offer from key-value store:',
                    error
                  );
                  // Continue even if key-value deletion fails
                  return of(undefined);
                })
              )
            : of(undefined);

        // Delete from localStorage
        let localStorageResult = false;
        try {
          const key = this.getOffersKey(requestId);
          const existingOffers =
            this.getOffersForRequestFromLocalStorage(requestId);

          const filteredOffers = existingOffers.filter(o => o.id !== offerId);

          if (filteredOffers.length === 0) {
            // Remove the key if no offers remain
            localStorage.removeItem(key);
          } else {
            // Save the remaining offers
            const serializedOffers = filteredOffers.map(o =>
              this.serializeOffer(o)
            );
            localStorage.setItem(key, JSON.stringify(serializedOffers));
          }

          localStorageResult = true;
        } catch (error) {
          console.error('Error deleting offer from localStorage:', error);
          localStorageResult = false;
        }

        // Return true if localStorage deletion succeeded
        // (key-value deletion is fire-and-forget)
        return forkJoin([deleteKeyValue$, of(localStorageResult)]).pipe(
          map(() => localStorageResult)
        );
      }),
      catchError(error => {
        console.error('Error checking key-value store for offer:', error);
        // Continue with localStorage deletion even if key-value check fails
        try {
          const key = this.getOffersKey(requestId);
          const existingOffers =
            this.getOffersForRequestFromLocalStorage(requestId);

          const filteredOffers = existingOffers.filter(o => o.id !== offerId);

          if (filteredOffers.length === 0) {
            localStorage.removeItem(key);
          } else {
            const serializedOffers = filteredOffers.map(o =>
              this.serializeOffer(o)
            );
            localStorage.setItem(key, JSON.stringify(serializedOffers));
          }

          return of(true);
        } catch (localStorageError) {
          console.error(
            'Error deleting offer from localStorage:',
            localStorageError
          );
          return of(false);
        }
      })
    );
  }

  /**
   * Get all offers (across all requests) - useful for debugging/admin
   */
  getAllOffers(): Offer[] {
    try {
      const allOffers: Offer[] = [];
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        if (key.startsWith(this.OFFERS_KEY_PREFIX)) {
          const offersData = localStorage.getItem(key);
          if (offersData) {
            const serializedOffers: SerializedOffer[] = JSON.parse(offersData);
            const offers = serializedOffers.map(o => this.deserializeOffer(o));
            allOffers.push(...offers);
          }
        }
      }

      return allOffers;
    } catch (error) {
      console.error('Error loading all offers from localStorage:', error);
      return [];
    }
  }

  /**
   * Get offers for applicant approval from key-value store only
   * Takes a list of requestIds and returns all offers found in the key-value store
   */
  getOffersForApplicantApproval(requestIds: string[]): Observable<Offer[]> {
    if (!requestIds || requestIds.length === 0) {
      return of([]);
    }

    // Build keys array: offer-request-{requestId}
    const keys = requestIds.map(requestId => `offer-request-${requestId}`);

    return this.keyValueService.getMultipleKeyValues(keys).pipe(
      map((result: KeyValueRecord) => {
        const offers: Offer[] = [];

        // Each KeyValueRecord has a data array
        if (result && result.data && Array.isArray(result.data)) {
          // For our use case, we expect one record per key
          // But we'll iterate through all records in case there are multiple
          for (const record of result.data) {
            if (record && record.data && record.data.value) {
              try {
                const serializedOffer: SerializedOffer = JSON.parse(
                  record.data.value as string
                );
                const offer = this.deserializeOffer(serializedOffer);

                offers.push(offer);
              } catch (error) {
                console.error(
                  'Error parsing offer from key-value store:',
                  error
                );
                // Continue processing other offers even if one fails
              }
            }
          }
        }

        return offers;
      }),
      catchError(error => {
        console.error('Error loading offers from key-value store:', error);
        return of([]);
      })
    );
  }

  /**
   * Generate a credit line with sublines from offer data (without request/users)
   */
  generateCreditLineFromOfferStandalone(offer: Offer): Observable<CreditLine> {
    const now = Date.now();
    const lenderOrganizationId =
      this.organizationService.getOrganizationId() ?? '';

    const creditLineId = getUUID4();

    // No users for standalone credit lines
    const users: LoanUserBaseSchema[] = [];

    // Determine account type based on program
    const program = offer.program;
    let accountType: CreditLineTypes = CreditLineTypes.NLOC_MASTERLINE;
    if (program?.revolving === true) {
      accountType = CreditLineTypes.RLOC;
    } else if (program?.revolving === false) {
      accountType = CreditLineTypes.NLOC_MASTERLINE;
    }

    // Map payment frequency
    const paymentFrequency = this.mapPaymentFrequency(
      program?.paymentFrequency
    );

    // Convert dates to unix timestamps
    const accountOpeningDate = offer.originationDate
      ? Math.floor(offer.originationDate.getTime() / 1000)
      : now;
    const maturityDate = offer.targetedMaturity
      ? Math.floor(offer.targetedMaturity.getTime() / 1000)
      : now + 365 * 24 * 60 * 60; // Default to 1 year from now

    // Convert credit limit to cents
    const creditLimitCents = offer.desiredCreditLimit
      ? Math.round(offer.desiredCreditLimit * 100)
      : 0;

    // Fetch servicer if servicingEntityIds exists
    const servicerId = program?.servicingEntityIds?.[0];
    const servicer$ = servicerId
      ? this.lendingManagementService.getAllServicers().pipe(
          map(servicers => {
            const servicer = servicers.find(s => s.id === servicerId);
            return servicer || null;
          }),
          catchError(() => of(null))
        )
      : of(null);

    // Fetch fees if fee IDs exist
    // Extract IDs from ProductFee[] (PresetFeeSchema[])
    const feeIds = (program?.fees || []).map((fee: ProductFee) => fee.fee.id);
    const fees$ =
      feeIds.length > 0
        ? this.lendingManagementService.getAllFees().pipe(
            map(fees => {
              // Filter to only fees that match the program's fee IDs
              return fees.filter(fee => feeIds.includes(fee.id));
            }),
            catchError(() => of([]))
          )
        : of([]);

    return forkJoin({ servicer: servicer$, fees: fees$ }).pipe(
      map(
        ({
          servicer,
          fees,
        }: {
          servicer: ExistingServicerSchema | null;
          fees: ExistingFeeSchema[];
        }) => {
          // Find the LATE fee
          const lateFee = fees.find(fee => fee.type === FeeTypes.LATE);
          const lateFeePerc = lateFee?.amount ? lateFee.amount / 100 : 0;

          // Create main credit line
          const mainCreditLine: CreditLine = {
            lendingType: LendTypes.CREDIT_LINE,
            id: creditLineId,
            name: offer.masterLineId,
            accountNumber: offer.coreMasterAccountNumber || '',
            accountOpeningDate,
            accountStatus: AccountStatuses.ACTIVE,
            accountType,
            accruedInterestCents: 0,
            availableCents: creditLimitCents,
            closedDate: null,
            collaterals: [],
            creditLimitCents,
            currentCommitmentCents: creditLimitCents,
            escrow: null,
            escrowedAmountCents: 0,
            fundingEntities:
              program?.fundingEntityIds?.map(id => ({ id })) || [],
            graceUnit:
              this.mapGracePeriodUnitToTimeUnits(program?.gracePeriodUnit) ||
              TimeUnits.DAYS,
            graceValue: program?.gracePeriodValue || 0,
            indexRate: null, // only used in standalone credit lines
            interestRateAttributes: [InterestAttributes.SIMPLE], // only used in standalone credit lines
            interestRatePerc: 0, // only used in standalone credit lines
            inHouse: true,
            isNSF: false,
            lateFeePerc,
            lenderOrganizationId,
            maturityDate,
            nextPaymentCents: 0,
            nextPaymentDate: maturityDate,
            nextPaymentDueDate: maturityDate,
            nextRateResetDate: null,
            originalPrincipalCents: 0,
            paymentFrequency,
            rateAdjustmentFrequency: Frequencies.YEARLY, // only used in standalone credit lines
            retailerId: program?.retailers?.[0] || null,
            servicerId: servicerId || null,
            servicerName: servicer?.name || null,
            servicerOrganizationId: servicer?.organizationId || null,
            servicerPaymentPortalUrl: servicer?.paymentPortalUrl || null,
            servicerPhoneNumber: servicer?.phoneNumber || null,
            stepInterestRates: [],
            sublines: this.generateSublinesFromOffer(
              offer,
              lenderOrganizationId,
              users,
              servicer,
              lateFeePerc
            ),
            totalAmountDueCents: 0,
            usageCents: 0,
            userCanShare: true,
            userIsCollaborator: false,
            users,
          };

          return mainCreditLine;
        }
      )
    );
  }

  /**
   * Generate a credit line with sublines from offer data and request data
   */
  generateCreditLineFromOffer(
    offer: Offer,
    request: Request
  ): Observable<CreditLine> {
    const now = Date.now();
    const lenderOrganizationId =
      this.organizationService.getOrganizationId() ?? '';

    const creditLineId = getUUID4();

    // Map request users to loan users
    const users: LoanUserBaseSchema[] = (request.users || [])
      .filter(
        (user: RequestUser): user is RequestUser & { userId: string } =>
          Boolean(user.userId) && // Ensure userId exists
          (user.userRole === RequestUserRoles.BORROWER ||
            user.userRole === RequestUserRoles.CO_BORROWER ||
            user.userRole === RequestUserRoles.GUARANTOR ||
            user.userRole === RequestUserRoles.COLLABORATOR)
      )
      .map((user: RequestUser & { userId: string }) => {
        // Map RequestUserRoles to UserRoles
        let role: UserRoles;
        switch (user.userRole) {
          case RequestUserRoles.BORROWER:
            role = UserRoles.BORROWER;
            break;
          case RequestUserRoles.CO_BORROWER:
            role = UserRoles.CO_BORROWER;
            break;
          case RequestUserRoles.GUARANTOR:
            role = UserRoles.GUARANTOR;
            break;
          case RequestUserRoles.COLLABORATOR:
            role = UserRoles.COLLABORATOR;
            break;
          default:
            role = UserRoles.BORROWER;
        }

        return {
          loanId: creditLineId, // For credit lines, loanId is used to reference the credit line
          creditLineId: creditLineId,
          userId: user.userId,
          role,
          representatives: user.representatives,
          userType: user.userType,
          shouldReceiveAnnualStatement: true,
          profile: user.profile,
        };
      });

    // Determine account type based on program
    const program = offer.program;
    let accountType: CreditLineTypes = CreditLineTypes.NLOC_MASTERLINE;
    if (program?.revolving === true) {
      accountType = CreditLineTypes.RLOC;
    } else if (program?.revolving === false) {
      accountType = CreditLineTypes.NLOC_MASTERLINE;
    }

    // Map payment frequency
    const paymentFrequency = this.mapPaymentFrequency(
      program?.paymentFrequency
    );

    // Convert dates to unix timestamps
    const accountOpeningDate = offer.originationDate
      ? Math.floor(offer.originationDate.getTime() / 1000)
      : now;
    const maturityDate = offer.targetedMaturity
      ? Math.floor(offer.targetedMaturity.getTime() / 1000)
      : now + 365 * 24 * 60 * 60; // Default to 1 year from now

    // Convert credit limit to cents
    const creditLimitCents = offer.desiredCreditLimit
      ? Math.round(offer.desiredCreditLimit * 100)
      : 0;

    // Fetch servicer if servicingEntityIds exists
    const servicerId = program?.servicingEntityIds?.[0];
    const servicer$ = servicerId
      ? this.lendingManagementService.getAllServicers().pipe(
          map(servicers => {
            const servicer = servicers.find(s => s.id === servicerId);
            return servicer || null;
          }),
          catchError(() => of(null))
        )
      : of(null);

    // Fetch fees if fee IDs exist
    // Extract IDs from ProductFee[] (PresetFeeSchema[])
    const feeIds = (program?.fees || []).map((fee: ProductFee) => fee.fee.id);
    const fees$ =
      feeIds.length > 0
        ? this.lendingManagementService.getAllFees().pipe(
            map(fees => {
              // Filter to only fees that match the program's fee IDs
              return fees.filter(fee => feeIds.includes(fee.id));
            }),
            catchError(() => of([]))
          )
        : of([]);

    return forkJoin({ servicer: servicer$, fees: fees$ }).pipe(
      map(
        ({
          servicer,
          fees,
        }: {
          servicer: ExistingServicerSchema | null;
          fees: ExistingFeeSchema[];
        }) => {
          // Find the LATE fee
          const lateFee = fees.find(fee => fee.type === FeeTypes.LATE);
          const lateFeePerc = lateFee?.amount ? lateFee.amount / 100 : 0;

          // Create main credit line
          const mainCreditLine: CreditLine = {
            lendingType: LendTypes.CREDIT_LINE,
            id: creditLineId,
            name: offer.masterLineId,
            accountNumber: offer.coreMasterAccountNumber || '',
            accountOpeningDate,
            accountStatus: AccountStatuses.ACTIVE,
            accountType,
            accruedInterestCents: 0,
            availableCents: creditLimitCents,
            closedDate: null,
            collaterals: [],
            creditLimitCents,
            currentCommitmentCents: creditLimitCents,
            escrow: null,
            escrowedAmountCents: 0,
            fundingEntities:
              program?.fundingEntityIds?.map(id => ({ id })) || [],
            graceUnit:
              this.mapGracePeriodUnitToTimeUnits(program?.gracePeriodUnit) ||
              TimeUnits.DAYS,
            graceValue: program?.gracePeriodValue || 0,
            indexRate: null, // only used in standalone credit lines
            interestRateAttributes: [InterestAttributes.SIMPLE], // only used in standalone credit lines
            interestRatePerc: 0, // only used in standalone credit lines
            inHouse: true,
            isNSF: false,
            lateFeePerc,
            lenderOrganizationId,
            maturityDate,
            nextPaymentCents: 0,
            nextPaymentDate: maturityDate,
            nextPaymentDueDate: maturityDate,
            nextRateResetDate: null,
            originalPrincipalCents: 0,
            paymentFrequency,
            rateAdjustmentFrequency: Frequencies.YEARLY, // only used in standalone credit lines
            retailerId: program?.retailers?.[0] || null,
            servicerId: servicerId || null,
            servicerName: servicer?.name || null,
            servicerOrganizationId: servicer?.organizationId || null,
            servicerPaymentPortalUrl: servicer?.paymentPortalUrl || null,
            servicerPhoneNumber: servicer?.phoneNumber || null,
            stepInterestRates: [],
            sublines: this.generateSublinesFromOffer(
              offer,
              lenderOrganizationId,
              users,
              servicer,
              lateFeePerc
            ),
            totalAmountDueCents: 0,
            usageCents: 0,
            userCanShare: true,
            userIsCollaborator: false,
            users,
          };

          return mainCreditLine;
        }
      )
    );
  }

  /**
   * Generate sublines from offer sublines
   */
  private generateSublinesFromOffer(
    offer: Offer,
    lenderOrganizationId: string,
    users: LoanUserBaseSchema[],
    servicer: ExistingServicerSchema | null,
    lateFeePerc = 0
  ): CreditLine[] {
    if (!offer.sublines || offer.sublines.length === 0) {
      return [];
    }

    const now = Date.now();
    const program = offer.program;

    return offer.sublines.map(subline => {
      // Convert subline limit to cents
      const sublineLimitCents = subline.sublineLimit
        ? Math.round(subline.sublineLimit * 100)
        : 0;

      // Use product data if available
      const product = subline.product;
      const productName = product?.name || `Subline ${subline.id}`;

      // Determine account type for subline (typically NLOC)
      const accountType = CreditLineTypes.NLOC; // only NLOC for CHS

      // Map payment frequency
      const paymentFrequency = this.mapPaymentFrequency(
        program?.paymentFrequency
      );

      // Use origination and maturity dates from offer, or defaults
      const accountOpeningDate = offer.originationDate
        ? Math.floor(offer.originationDate.getTime() / 1000)
        : now;
      const maturityDate = offer.targetedMaturity
        ? Math.floor(offer.targetedMaturity.getTime() / 1000)
        : now + 365 * 24 * 60 * 60;

      // Map step rates from product to step interest rates
      const stepInterestRates: StepInterestRate[] = product?.interestRateSteps
        ? product.interestRateSteps.map(rateRow =>
            this.mapStepRateRowToStepInterestRate(rateRow)
          )
        : [];

      return {
        id: getUUID4(),
        lendingType: LendTypes.CREDIT_LINE,
        name: productName,
        accountNumber:
          subline.coreSubAccountNumber || this.generateCoreSubAccountNumber(),
        accountOpeningDate,
        accountStatus: AccountStatuses.ACTIVE,
        accountType,
        accruedInterestCents: 0,
        availableCents: sublineLimitCents,
        closedDate: null,
        collaterals: [],
        creditLimitCents: sublineLimitCents,
        currentCommitmentCents: sublineLimitCents,
        escrow: null,
        escrowedAmountCents: 0,
        fundingEntities: program?.fundingEntityIds?.map(id => ({ id })) || [],
        graceUnit:
          this.mapGracePeriodUnitToTimeUnits(program?.gracePeriodUnit) ||
          TimeUnits.DAYS,
        graceValue: program?.gracePeriodValue || 0,
        indexRate: null, // only used in standalone credit lines
        interestRateAttributes: [InterestAttributes.SIMPLE], // only used in standalone credit lines
        interestRatePerc: 0, // only used in standalone credit lines
        inHouse: true,
        isNSF: false,
        lateFeePerc,
        lenderOrganizationId,
        maturityDate,
        nextPaymentCents: 0,
        nextPaymentDate: maturityDate,
        nextPaymentDueDate: maturityDate,
        nextRateResetDate: null,
        originalPrincipalCents: 0,
        paymentFrequency,
        rateAdjustmentFrequency: Frequencies.YEARLY, // only used in standalone credit lines
        retailerId: program?.retailers?.[0] || null,
        servicerId: program?.servicingEntityIds?.[0] || null,
        servicerName: servicer?.name || null,
        servicerOrganizationId: servicer?.organizationId || null,
        servicerPaymentPortalUrl: servicer?.paymentPortalUrl || null,
        servicerPhoneNumber: servicer?.phoneNumber || null,
        stepInterestRates,
        sublines: [], // Sublines don't have nested sublines
        totalAmountDueCents: 0,
        usageCents: 0,
        userCanShare: true,
        userIsCollaborator: false,
        users,
      };
    });
  }

  /**
   * Map InterestRateStep to StepInterestRate
   */
  private mapStepRateRowToStepInterestRate(
    rateRow: InterestRateStep
  ): StepInterestRate {
    // startingOn is already a Unix timestamp (number)
    const startOn = rateRow.startingOn || Math.floor(Date.now() / 1000);

    // Handle ending date based on endingOnUnit
    let endOn: number | null = null;
    let endOnSpanMonths: number | null = null;

    if (rateRow.endingOnUnit === 'SPECIFIC_DATE' && rateRow.endingOnValue) {
      // If endingOnValue is provided as absolute date, use it (already a Unix timestamp)
      endOn = rateRow.endingOnValue;
    } else if (rateRow.endingOnUnit === 'MONTHS' && rateRow.endingOnValue) {
      // If duration is provided in months, calculate endOn and set span
      endOnSpanMonths = rateRow.endingOnValue;
      // Calculate end date from start date + months
      const startDate = new Date(startOn * 1000);
      startDate.setMonth(startDate.getMonth() + endOnSpanMonths);
      endOn = Math.floor(startDate.getTime() / 1000);
    } else if (
      rateRow.endingOnUnit &&
      rateRow.endingOnUnit !== 'SPECIFIC_DATE' &&
      rateRow.endingOnValue
    ) {
      // Handle other duration units (DAYS, WEEKS, YEARS) - convert to months for endOnSpanMonths
      const startDate = new Date(startOn * 1000);
      let months = 0;
      if (rateRow.endingOnUnit === 'DAYS') {
        months = rateRow.endingOnValue / 30;
      } else if (rateRow.endingOnUnit === 'WEEKS') {
        months = rateRow.endingOnValue / 4.33;
      } else if (rateRow.endingOnUnit === 'YEARS') {
        months = rateRow.endingOnValue * 12;
      }
      endOnSpanMonths = Math.round(months);
      startDate.setMonth(startDate.getMonth() + endOnSpanMonths);
      endOn = Math.floor(startDate.getTime() / 1000);
    }
    // If endingOnUnit is 'NONE' or endingOnValue is undefined, endOn remains null (open-ended)

    // Map rate type - InterestRateTypeEnum is 'FIXED' or 'VARIABLE'
    const rateType =
      rateRow.interestRateType === 'FIXED' ? 'FIXED' : 'VARIABLE';

    // Map rate fields based on type
    // rateValue is a decimal (0.25 = 25%), convert to percentage for interestRatePerc
    const interestRatePerc =
      rateType === 'FIXED' ? rateRow.rateValue * 100 : null;
    // For VARIABLE rates, we don't have adjustment or indexRate in InterestRateStep
    // These would need to come from elsewhere or be set to null
    const rateSpread = null; // TODO: Determine where adjustment comes from
    const rateBasis = null; // TODO: Determine where indexRate comes from

    return {
      startOn,
      endOn,
      endOnSpanMonths,
      rateType,
      rateSpread,
      interestRatePerc,
      rateBasis,
      effectiveVariableRate: null, // Will be computed by the system
      comment: rateRow.comments || '',
      period: rateRow.comments || '', // Using comments as period description
    };
  }

  /**
   * Map GracePeriodUnitEnum to TimeUnits enum
   */
  private mapGracePeriodUnitToTimeUnits(
    unit?: string | null
  ): TimeUnits | null {
    if (!unit) return null;

    // Map GracePeriodUnitEnum values to TimeUnits enum
    switch (unit) {
      case 'Days':
        return TimeUnits.DAYS;
      case 'Weeks':
        return TimeUnits.WEEKS;
      case 'Months':
        return TimeUnits.MONTHS;
      case 'Years':
        return TimeUnits.YEARS;
      default:
        return TimeUnits.DAYS;
    }
  }

  /**
   * Map payment frequency string to Frequencies enum
   */
  private mapPaymentFrequency(frequency?: string): Frequencies {
    if (!frequency) {
      return Frequencies.ONCE;
    }

    const frequencyMap: Record<string, Frequencies> = {
      'At Maturity': Frequencies.ONCE,
      Monthly: Frequencies.MONTHLY,
      Quarterly: Frequencies.QUARTERLY,
      'Semi-Annual': Frequencies.SEMIANNUALLY,
      Annual: Frequencies.YEARLY,
      Seasonal: Frequencies.QUARTERLY,
      'Bi-Weekly': Frequencies.BIWEEKLY,
      Weekly: Frequencies.WEEKLY,
    };

    return frequencyMap[frequency] || Frequencies.ONCE;
  }
}
