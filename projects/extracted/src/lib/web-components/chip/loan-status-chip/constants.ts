import { LendingAccountStatuses as AccountStatuses } from '../../../services/lending/models/lending.enums';
import { ChipVariant } from '../chip.component';

export const accountStatusToChipVariantMap: Record<string, ChipVariant> = {
  CLOSED: 'muted',
  APPROVED: 'success',
  ARCHIVED: 'success',
  REJECTED: 'danger',
  DELINQUENT: 'danger',
  ACTIVE: 'success',
  FROZEN: 'info',
  PENDING: 'info',
} as const;

export function getChipVariant(status: AccountStatuses): string {
  return (
    accountStatusToChipVariantMap[status.toUpperCase() as string] ?? 'info'
  );
}
