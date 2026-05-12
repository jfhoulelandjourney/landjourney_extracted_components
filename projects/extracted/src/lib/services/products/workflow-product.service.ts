import { Injectable, inject } from '@angular/core';

import { ProductV1 as Product } from '../../models/products/workflow-productModels';
import { ProductRequirement } from '../../models/products/workflow-productRequirementModels';
import { ApiQueryParameters } from '../api/api.models';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class WorkflowProductService {
  private apiService = inject(ApiService);

  private serviceConfiguration: ServiceConfiguration;

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Workflows;
  }

  /** Products */

  public getAllProducts(loadRequirements = false) {
    const options: ApiQueryParameters = {};

    if (loadRequirements) {
      options['load_requirements'] = true;
    }

    return this.apiService.get<Product[]>(
      this.serviceConfiguration,
      `/products`,
      options
    );
  }

  public getProduct(productId: string) {
    return this.apiService.get<Product>(
      this.serviceConfiguration,
      `/products/${productId}`
    );
  }

  public createProduct(product: Product) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/products`,
      product
    );
  }

  public updateProduct(product: Product) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/products/${product.id}`,
      product
    );
  }

  public deleteProduct(productId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/products/${productId}`
    );
  }

  /* REQUIREMENTS */

  public getAllRequirementsForProduct(productId: string) {
    return this.apiService.get<ProductRequirement[]>(
      this.serviceConfiguration,
      `/products/${productId}/requirements`
    );
  }

  public getRequirement(productId: string, requirementId: string) {
    return this.apiService.get<Product>(
      this.serviceConfiguration,
      `/products/${productId}/requirements/${requirementId}`
    );
  }

  public createRequirement(productRequirement: ProductRequirement) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/products/${productRequirement.productId}/requirements`,
      productRequirement
    );
  }

  public updateRequirement(productRequirement: ProductRequirement) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/products/${productRequirement.productId}/requirements/${productRequirement.id}`,
      productRequirement
    );
  }

  public deleteRequirement(productId: string, productRequirementId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/products/${productId}/requirements/${productRequirementId}`
    );
  }
}
