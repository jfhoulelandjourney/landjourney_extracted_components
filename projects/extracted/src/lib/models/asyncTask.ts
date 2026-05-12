export enum AsyncTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  NOT_FOUND = 'NOT_FOUND',
}
export interface AsyncTask {
  taskId: string;
  status: AsyncTaskStatus;
}
