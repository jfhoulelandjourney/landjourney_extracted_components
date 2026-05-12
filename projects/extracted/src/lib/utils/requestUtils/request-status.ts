import { RequestStatuses, Request } from '../../models/requestModels';

export function isRequestPending(request: Request): boolean {
  return (
    !isRequestClosed(request) && request.status !== RequestStatuses.CANCELLED
  );
}

export function isRequestClosed(request: Request): boolean {
  return request.closed ?? false;
}
