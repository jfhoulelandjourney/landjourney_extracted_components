export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarSrc?: string;
}

export type RequestStage = 'Initiated' | 'Processing' | 'Approved' | 'Closed' | 'Rejected';

export interface RequestRow {
  id: string;
  name: string;
  taskCount: number;
  taskProgress: { done: number; pending: number; total: number };
  createdAt: string;
  activityAt: string;
  stage: RequestStage;
  customers: User[];
  team: User[];
}
