/**
 * Enum for subline rate types
 */
export enum SublineRateTypes {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
}

/**
 * Enum for subline purposes/categories
 */
export enum SublinePurposeTypes {
  CROP_INPUTS = 'CROP_INPUTS',
  FERTILIZER = 'FERTILIZER',
  SEEDS = 'SEEDS',
  EQUIPMENT = 'EQUIPMENT',
  LIVESTOCK = 'LIVESTOCK',
  OPERATING_EXPENSES = 'OPERATING_EXPENSES',
  OTHER = 'OTHER',
}

/**
 * Enum for draw request statuses (lending subline schema).
 */
export enum LendingDrawRequestStatuses {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

/**
 * Base rate configuration for fixed rate
 */
export interface FixedRateConfig {
  /** Discriminator for fixed rate type */
  type: 'FIXED';

  /** Fixed annual interest rate as a percentage (e.g., 4.0 for 4%) */
  interestRatePerc: number;
}

/**
 * Base rate configuration for variable rate
 */
export interface VariableRateConfig {
  /** Discriminator for variable rate type */
  type: 'VARIABLE';

  /** Index or basis rate name (e.g., "PRIME", "CHS Base", "SOFR") */
  rateBasis: string;

  /** Spread added to the rate basis in percentage points (e.g., -3.75 means basis - 3.75%) */
  rateSpread: number;
}

/**
 * Union of all rate configuration types (discriminated union)
 * TypeScript can discriminate based on the 'type' field for type-safe access
 */
export type RateConfig = FixedRateConfig | VariableRateConfig;

/**
 * Promotional rate override - temporary rate that overrides the base rate until expiration
 */
export interface PromoRate {
  /** Rate configuration during the promotional period (can be fixed or variable) */
  rateConfig: RateConfig;

  /** Unix timestamp when the promotional rate expires and reverts to base rate */
  promoEndDate: number;
}

/**
 * Credit line subline - defines an interest rate option for draws from a credit line
 * Users select which subline to use when requesting a draw, which determines the interest rate applied
 */
export interface CreditLineSubline {
  /** Unique identifier for this subline */
  id: string;

  /** ID of the parent credit line this subline belongs to */
  creditLineId: string;

  /** Display name for this subline (e.g., "Crop Protection", "Seeds") */
  name: string;

  /** Category/purpose for this subline (CROP_INPUTS, FERTILIZER, SEEDS, etc.) */
  purpose: SublinePurposeTypes;

  /** Optional detailed description of this subline's intended use */
  description?: string;

  /**
   * Base rate configuration that applies to draws using this subline
   * This is the rate used after any promotional rate expires
   */
  rateConfig: RateConfig;

  /**
   * Optional promotional rate that temporarily overrides rateConfig
   * When present and not expired, this rate applies instead of the base rate
   */
  promoRate?: PromoRate;

  /**
   * Total amount drawn from the credit line using this subline's rate in cents
   * This tracks how much credit has been used at this specific rate
   */
  usedCreditCents: number;

  /** Whether this subline is currently active and available for new draws */
  isActive: boolean;

  /** Unix timestamp when this subline was created */
  createdDate: number;

  /** Unix timestamp of last modification to this subline */
  lastModifiedDate?: number;
}

/**
 * Schema for creating a new subline
 */
export interface CreateCreditLineSubline {
  /** Display name for the new subline */
  name: string;

  /** Optional detailed description of the subline's purpose */
  description?: string;

  /** Category/purpose type for this subline */
  purpose: SublinePurposeTypes;

  /** Base interest rate configuration */
  rateConfig: RateConfig;

  /** Optional promotional rate override */
  promoRate?: PromoRate;

  /** Initial allocated credit amount in cents (may not be used in current implementation) */
  allocatedCreditCents: number;
}

/**
 * Draw request - request to withdraw funds from a credit line
 * For credit lines with sublines, the sublineId determines which interest rate applies to this draw
 */
export interface DrawRequest {
  /** Unique identifier for this draw request */
  id: string;

  /** ID of the credit line to draw from */
  creditLineId: string;

  /**
   * Optional ID of the subline to use for this draw
   * Determines which interest rate will apply to the drawn amount
   * Optional for backward compatibility with credit lines without sublines
   */
  sublineId?: string;

  /** Amount requested to draw in cents */
  requestedAmountCents: number;

  /** Unix timestamp when the draw was requested */
  requestedDate: number;

  /** ID of the user who requested this draw */
  requestedByUserId: string;

  /** Name of the user who requested this draw */
  requestedByUserName: string;

  /** Optional authorization code for this draw */
  authorizationCode?: string;

  /** Optional bank account ID where funds will be deposited */
  bankAccountId?: string;

  /** Current status of the draw request (PENDING, APPROVED, REJECTED, etc.) */
  status: LendingDrawRequestStatuses;

  /** Optional notes or comments about this draw request */
  notes?: string;

  /** Unix timestamp when this draw request was created */
  createdDate: number;

  /** Unix timestamp when this draw request was processed (approved/rejected) */
  processedDate?: number;
}

/**
 * Schema for creating a new draw request
 * Used when submitting a request to withdraw funds from a credit line
 */
export interface CreateDrawRequest {
  /**
   * Optional ID of the subline to use for this draw
   * Determines which interest rate will apply to the drawn amount
   * Optional for backward compatibility with credit lines without sublines
   */
  sublineId?: string;

  /** Amount requested to draw in cents */
  requestedAmountCents: number;

  /** Unix timestamp when this draw request is being made */
  requestedDate: number;

  /** Optional authorization code for this draw */
  authorizationCode?: string;

  /** Optional bank account ID where funds should be deposited */
  bankAccountId?: string;

  /** Optional notes or comments about this draw request */
  notes?: string;
}
