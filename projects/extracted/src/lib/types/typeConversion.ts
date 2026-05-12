import { PaginatedResponse } from '../services/api/api.models';
import { ValidateStructure, Valid } from './typeValidator';

/**
 * Converts an API type to a domain type with zero runtime overhead,
 * but with compile-time validation to ensure compatibility.
 *
 * @example
 * // Converting a section with specific field exclusions
 * const section = asModel<ExistingSection, SectionSchemaOutput>(apiSection);
 *
 * @param apiObject - The API type object
 * @returns The same object typed as domain type
 */
export function asModel<
  TDomain,
  TApi extends Record<string, unknown>,
  Validation = ValidateStructure<TDomain, TApi>,
>(apiObject: TApi): Valid<Validation> extends true ? TDomain : Validation {
  // No runtime overhead - just returns the original object with a new type
  return apiObject as unknown as Valid<Validation> extends true
    ? TDomain
    : Validation;
}

/**
 * Converts a paginated API response to a paginated domain response with zero runtime overhead.
 * This is a compile-time type conversion utility.
 *
 * @example
 * // Converting a paginated response of API requests to domain requests
 * const paginatedRequests = asPaginatedModel<Request2, ExistingRequestSchemaOutput>(apiPaginatedRequests);
 *
 * @template TDomain The domain model type
 * @template TApi The API schema type
 * @param paginatedApiResponse - The paginated API response
 * @returns The same object with items converted to domain types
 */
export function asPaginatedModel<
  TDomain,
  TApi extends Record<string, unknown>,
  Validation = ValidateStructure<TDomain, TApi>,
>(
  paginatedApiResponse: PaginatedResponse<TApi>
): Valid<Validation> extends true ? PaginatedResponse<TDomain> : Validation {
  // No runtime overhead - just returns the original object with converted types
  return paginatedApiResponse as unknown as Valid<Validation> extends true
    ? PaginatedResponse<TDomain>
    : Validation;
}

/**
 * Converts a domain type to an API type with zero runtime overhead,
 * but with compile-time validation to ensure compatibility.
 *
 * @example
 * // Converting a domain section to API type with specific exclusions
 * const apiSection = asApi<SectionSchemaInput, ExistingSection>(section);
 *
 * @param domainObject - The domain type object
 * @returns The same object typed as API type
 */
export function asApi<
  TApi,
  TDomain extends Record<string, unknown>,
  Validation = ValidateStructure<TApi, TDomain>,
>(domainObject: TDomain): Valid<Validation> extends true ? TApi : Validation {
  // No runtime overhead - just returns the original object with a new type
  return domainObject as unknown as Valid<Validation> extends true
    ? TApi
    : Validation;
}
