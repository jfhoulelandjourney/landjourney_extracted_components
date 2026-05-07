import type { RequestRow, RequestStage } from './types';
import { usersMock } from './users';

export const requestsMock: RequestRow[] = [
  {
    id: 'r1', name: 'Blank Request', taskCount: 1,
    taskProgress: { done: 1, pending: 2, total: 3 },
    createdAt: '2026-03-02', activityAt: '2026-03-04',
    stage: 'Initiated',
    customers: [usersMock[9]],
    team: [usersMock[2]],
  },
  {
    id: 'r2', name: 'Land acquisition — North 40', taskCount: 7,
    taskProgress: { done: 5, pending: 2, total: 7 },
    createdAt: '2026-02-18', activityAt: '2026-04-12',
    stage: 'Processing',
    customers: [usersMock[0], usersMock[3]],
    team: [usersMock[2], usersMock[4]],
  },
  {
    id: 'r3', name: 'Equipment loan — combine', taskCount: 4,
    taskProgress: { done: 4, pending: 0, total: 4 },
    createdAt: '2026-01-05', activityAt: '2026-03-29',
    stage: 'Approved',
    customers: [usersMock[5]],
    team: [usersMock[1], usersMock[2], usersMock[6]],
  },
  {
    id: 'r4', name: 'Operating line renewal', taskCount: 6,
    taskProgress: { done: 6, pending: 0, total: 6 },
    createdAt: '2025-11-22', activityAt: '2026-02-14',
    stage: 'Closed',
    customers: [usersMock[7]],
    team: [usersMock[2]],
  },
  {
    id: 'r5', name: 'Storage facility refinance', taskCount: 9,
    taskProgress: { done: 2, pending: 7, total: 9 },
    createdAt: '2026-04-21', activityAt: '2026-05-02',
    stage: 'Initiated',
    customers: [usersMock[8], usersMock[0]],
    team: [usersMock[2], usersMock[4]],
  },
  {
    id: 'r6', name: 'Cattle inventory financing', taskCount: 3,
    taskProgress: { done: 0, pending: 3, total: 3 },
    createdAt: '2026-04-30', activityAt: '2026-05-01',
    stage: 'Rejected',
    customers: [usersMock[3]],
    team: [usersMock[1]],
  },
];

export function stageTone(s: RequestStage): 'info' | 'progress' | 'success' | 'danger' | 'neutral' {
  switch (s) {
    case 'Initiated': return 'info';
    case 'Processing': return 'progress';
    case 'Approved': return 'success';
    case 'Closed':
    case 'Rejected': return 'danger';
    default: return 'neutral';
  }
}
