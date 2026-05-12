import { ChipVariant } from 'common';

export type CollaboratorState = 'hidden' | 'compact' | 'open';

export interface Collaborator {
  initials: string;
  name: string;
  role: string;
  userId: string;
  pills: CollaboratorPill[];
  statusColor: string;
}

export interface CollaboratorPill {
  label: string;
  variant: ChipVariant;
}
