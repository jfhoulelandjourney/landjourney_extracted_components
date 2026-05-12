import { Business } from '../../models/businessModels';
import { Request } from '../../models/requestModels';
import { Section } from '../../models/sectionModels';
import { BasicUserProfile } from '../../models/userModels';

export type GetRequestResponse = {
  request: Request;
  sections: Section[];
  users: BasicUserProfile[];
  businesses: Business[];
};

export enum ColumnSearchOperands {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  GREATER_THAN = 'GREATER_THAN',
  LOWER_THAN = 'LOWER_THAN',
}

export interface RequestFilterConfiguration {
  statuses: string[];
}

export type ColumnFilterValueTypes = string | string[] | number | boolean;

export interface ColumnFilterDefinition {
  operand: ColumnSearchOperands;
  value: ColumnFilterValueTypes;
}

export interface ColumnFilters {
  status?: ColumnFilterDefinition;
  name?: ColumnFilterDefinition;
  productType?: ColumnFilterDefinition;
  requestType?: ColumnFilterDefinition;
  completionPercentage?: ColumnFilterDefinition;
  employees?: ColumnFilterDefinition;
  individuals?: ColumnFilterDefinition;
  businesses?: ColumnFilterDefinition;
  groups?: ColumnFilterDefinition;
  created?: ColumnFilterDefinition;
  updated?: ColumnFilterDefinition;
  closed?: ColumnFilterDefinition;
}

export class RequestColumnSearchArgsSchema {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  sortDirection?: string;

  groups?: string[];
  loadSections?: boolean;
  includeClosed?: boolean;
  includeWorkgroups?: boolean;

  columnFilters?: ColumnFilters;
}
