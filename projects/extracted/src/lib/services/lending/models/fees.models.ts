import { TimeUtil } from '../../../utils/timeUtil';
import { AmountTypes, FeeTypes, Frequencies } from './lending.enums';

export interface FeesSchema {
  amount: number;
  amountType: AmountTypes;
  frequency: Frequencies;
  globalActivationDate: number;
  name?: string;
  type: FeeTypes;
}

export interface FeeBaseSchema {
  amount: number;
  amountType: AmountTypes;
  frequency: Frequencies;
  globalActivationDate: number;
  name?: string;
  type: FeeTypes;
}

export interface FeeCreatedSchema {
  id: string;
}

export interface ExistingFeeSchema extends FeeBaseSchema, FeeCreatedSchema {
  isSynchronized?: boolean;
  disabled?: boolean;
  disabledDate?: number | null;
  disabledReason?: string | null;
}

export function getDefaultFee(): FeeBaseSchema {
  return {
    amount: 0,
    amountType: AmountTypes.PERCENTAGE,
    frequency: Frequencies.YEARLY,
    globalActivationDate: TimeUtil.getTimestampSeconds(),
    name: 'Annual',
    type: FeeTypes.ANNUAL,
  };
}
