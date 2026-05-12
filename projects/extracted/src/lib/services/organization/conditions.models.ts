export enum ConditionScopes {
  ALL = 'ALL',
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface Condition {
  id?: string;
  priority?: number;
  active: boolean;
  organizationId: string;
  scope: ConditionScopes;
  title: string;
  text: string;
  disclaimerText?: string;
}

export function getDefaultCondition(organizationId: string): Condition {
  return {
    active: false,
    priority: 0,
    organizationId: organizationId,
    title: '',
    scope: ConditionScopes.CUSTOMER,
    text: '',
    disclaimerText: '',
  };
}
