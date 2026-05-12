import { ProductRequirement } from './workflow-productRequirementModels';
import { WorkflowProductTypes } from './workflow-productTypes';

export interface UnsavedProductV1 {
  parentId?: string;
  productType: WorkflowProductTypes;
  name: string;
  description: string;
  category: string;
  defaultRequestId?: string;
  defaultRequestName?: string;
  requirements: ProductRequirement[];
}

export interface ProductV1 extends UnsavedProductV1 {
  id?: string;
  createdAt?: number;
  updatedAt?: number | null;
}

export function getDefaultProduct(): ProductV1 {
  return {
    name: 'New product',
    description: '',
    productType: WorkflowProductTypes.LAND_LOAN,
    category: '',
    requirements: [],
  };
}
