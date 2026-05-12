import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  Product,
  Program,
  RuleType,
  type ProductsPaginatedResponse,
} from '../../models/products/products.model';
import { ApiQueryParameters } from '../api/api.models';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private serviceConfiguration: ServiceConfiguration;

  constructor(private apiService: ApiService) {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Products;
  }

  /** Rule Types API */

  public getAllRuleTypes() {
    return this.apiService.get<RuleType[]>(
      this.serviceConfiguration,
      `/products/rules/types`
    );
  }

  /** Products API */

  public getAllProducts() {
    const options: ApiQueryParameters = {
      page: 1,
      page_size: 100,
      templates: false,
    };

    return this.apiService.get<ProductsPaginatedResponse>(
      this.serviceConfiguration,
      `/products`,
      options
    );
  }

  public getTemplates(options: {
    page: number;
    pageSize: number;
    search?: string;
    kind?: 'program' | 'product';
  }): Observable<{ templates: Program[]; totalCount: number }> {
    const params: ApiQueryParameters = {
      page: 1,
      page_size: 100,
      templates: true,
      ...(options.search ? { search: options.search } : {}),
    };
    return this.apiService
      .get<ProductsPaginatedResponse>(this.serviceConfiguration, '/products', params)
      .pipe(
        map(response => {
          const items = response.items as Program[];
          const filtered = options.kind
            ? items.filter(
                item => item.productMetadata?.templateKind === options.kind
              )
            : items;
          const start = (options.page - 1) * options.pageSize;
          const slice = filtered.slice(start, start + options.pageSize);
          return {
            templates: slice,
            totalCount: filtered.length,
          };
        })
      );
  }

  public getProduct(productId: string) {
    return this.apiService.get<Product>(
      this.serviceConfiguration,
      `/products/${productId}`
    );
  }

  public createProduct(product: Product) {
    return this.apiService.post<Product>(
      this.serviceConfiguration,
      `/products`,
      product
    );
  }

  public updateProduct(product: Product) {
    return this.apiService.put<Product>(
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

  public getProductWithVersions(productId: string) {
    return this.apiService.get<Product[]>(
      this.serviceConfiguration,
      `/products/${productId}/versions`
    );
  }

  public setProductDisabledById(productId: string, disabled: boolean): Observable<ApiMessage> {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/products/${productId}`,
      { disable: disabled }
    );
  }

  /** Programs */

  public getPrograms(options: {
    page: number;
    pageSize: number;
    search?: string;
  }): Observable<{ programs: Program[]; totalCount: number }> {
    const params: ApiQueryParameters = {
      programs: true,
      page: options.page,
      page_size: options.pageSize,
      templates: false,
      ...(options.search ? { search: options.search } : {}),
    };

    return this.apiService
      .get<ProductsPaginatedResponse>(this.serviceConfiguration, '/products', params)
      .pipe(
        switchMap(response => {
          if (response.items.length === 0) {
            return of({ programs: [] as Program[], totalCount: response.totalCount });
          }

          const childFetches$ = response.items.map(program => {
            const programId = program.id;
            if (!programId) {
              return of({ ...program, products: [] } as Program);
            }
            return this.apiService
              .get<ProductsPaginatedResponse>(this.serviceConfiguration, '/products', {
                parent_id: programId,
                page_size: 100,
                templates: false,
              })
              .pipe(
                map(childResponse => ({ ...program, products: childResponse.items } as Program)),
                catchError(() => of({ ...program, products: [] } as Program))
              );
          });

          return forkJoin(childFetches$).pipe(
            map(programs => ({ programs, totalCount: response.totalCount }))
          );
        })
      );
  }

  public getAllPrograms(): Observable<Program[]> {
    return this.getAllProducts().pipe(
      map((response: ProductsPaginatedResponse) => {
        const allProducts = response.items;

        // Filter products without parentId (these are programs)
        const programs = allProducts.filter(
          product => !product.parentId || product.parentId === null
        );

        // For each program, find all products where parentId matches program.id
        return programs.map(program => {
          const programProducts = allProducts.filter(
            product => product.parentId === program.id
          );

          return {
            ...program,
            products: programProducts,
          } as Program;
        });
      })
    );
  }

  public getProgramById(programId: string) {
    return this.getAllPrograms().pipe(
      map((response: Program[]) => {
        return response.find(program => program.id === programId);
      })
    );
  }

  public getTemplateById(templateId: string) {
    return this.getProduct(templateId).pipe(
      map(template => ({ ...template, products: [] } as Program))
    );
  }

  public createProgramAndProducts(program: Program): Observable<Program> {
    // Extract products array and create program without products
    const { products, ...programWithoutProducts } = program;
    const productsToCreate = products || [];

    // Create the program first (without products array)
    return this.createProduct(programWithoutProducts as Product).pipe(
      switchMap(createdProgram => {
        // Update or create each product with the program's id as parentId
        const productOperations$ = productsToCreate.map(product => {
          // Ensure parentId is set to the created program's id
          const productWithParentId = {
            ...product,
            parentId: createdProgram.id,
          };

          if (product.id) {
            // Product has an id, update it
            return this.updateProduct(productWithParentId as Product);
          } else {
            // Product doesn't have an id, create it
            return this.createProduct(productWithParentId as Product);
          }
        });

        // If there are no products, return the program as-is
        if (productOperations$.length === 0) {
          return of({
            ...createdProgram,
            products: [],
          } as Program);
        }

        // Execute all product operations in parallel
        return forkJoin(productOperations$).pipe(
          map(createdProducts => {
            // Return the created program with all its products
            return {
              ...createdProgram,
              products: createdProducts,
            } as Program;
          })
        );
      })
    );
  }

  public createProgram(program: Program): Observable<Program> {
    // Extract products array and create program without products
    const { products, ...programWithoutProducts } = program;

    // Create the program first (without products array)
    return this.createProduct(programWithoutProducts as Product).pipe(
      map(createdProgram => {
        return {
          ...createdProgram,
          products: [],
        } as Program;
      })
    );
  }

  public updateProgram(program: Program): Observable<Program> {
    // Extract products array and create program without products
    const { products, ...programWithoutProducts } = program;

    return this.updateProduct(programWithoutProducts as Product).pipe(
      map(updatedProgram => {
        return {
          ...updatedProgram,
          products: [],
        } as Program;
      })
    );
  }

  public deleteProgram(
    programId: string,
    productsIds: string[]
  ): Observable<ApiMessage> {
    // Filter out undefined/null IDs and check if there are any products to delete
    const validProductIds = (productsIds || []).filter((id): id is string =>
      Boolean(id)
    );

    // If there are no products, just delete the program
    if (validProductIds.length === 0) {
      return this.deleteProduct(programId);
    }

    // Delete all products first, then delete the program
    const deleteProductOperations$ = validProductIds.map(productId =>
      this.deleteProduct(productId).pipe(
        catchError(error => {
          console.error(`Error deleting product ${productId}:`, error);
          // Continue even if one product deletion fails
          return of({} as ApiMessage);
        })
      )
    );

    // Delete all products first, then delete the program
    return forkJoin(deleteProductOperations$).pipe(
      switchMap(() => {
        // After all products are deleted, delete the program itself
        return this.deleteProduct(programId);
      })
    );
  }
}
