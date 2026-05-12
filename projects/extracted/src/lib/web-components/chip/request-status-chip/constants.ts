import { SectionStatuses } from '../../../models/sectionModels';
import { ChipVariant } from '../chip.component';

export const sectionStatusToChipVariantMap: Record<string, ChipVariant> = {
  DRAFT: 'muted',
  APPROVED: 'success',
  CANCELLED: 'success',
  IN_PROGRESS: 'info',
  INCOMPLETE: 'muted',
  INITIATED: 'info',
  REJECTED: 'danger',
  SUBMITTED: 'success',
  UNDER_REVIEW: 'warning',
} as const;

export function getChipVariant(status: SectionStatuses): string {
  return sectionStatusToChipVariantMap[status as string] ?? 'info';
}
