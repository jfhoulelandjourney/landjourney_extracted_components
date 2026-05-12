import { RequestUserRoles, type RequestUser } from '../../models/requestModels';

export function sortRequestUsers(requestusers: RequestUser[]): RequestUser[] {
  const mainBorrowers: RequestUser[] = [];
  const coBorrowers: RequestUser[] = [];
  const guarantors: RequestUser[] = [];
  const others: RequestUser[] = [];

  for (const requestUser of requestusers) {
    if (requestUser.userRole === RequestUserRoles.BORROWER) {
      mainBorrowers.push(requestUser);
      continue;
    }

    if (requestUser.userRole === RequestUserRoles.CO_BORROWER) {
      coBorrowers.push(requestUser);
      continue;
    }

    if (requestUser.userRole === RequestUserRoles.GUARANTOR) {
      guarantors.push(requestUser);
      continue;
    }

    others.push(requestUser);
  }

  return [...mainBorrowers, ...coBorrowers, ...guarantors, ...others];
}
