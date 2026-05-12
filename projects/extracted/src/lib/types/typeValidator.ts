/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Type utilities for validation
 */

/**
 * Type-level error with detailed field information
 */
export interface TypeErrorReport<
  TMessage extends string = string,
  TFields = unknown,
> {
  error: TMessage;
  fields: TFields;
}

/**
 * Validates that a value passes validation or returns the error
 * @example
 * const _valid: Valid<SomeValidation> = true; // Fails if validation has errors
 */
export type Valid<T> = T extends TypeErrorReport<any, any> ? T : true;

/**
 * Validates that two enum types are bidirectionally compatible.
 * Ensures TDomain can represent all API values and API can represent all domain values.
 *
 * @example
 * // Validates that locally defined TaskStatuses enum matches API's _TaskStatuses enum
 * type ValidateTaskStatuses = ValidateEnum<typeof TaskStatuses, typeof _TaskStatuses>;
 */
export type ValidateEnum<
  TDomain extends Record<string, any>,
  TApi extends Record<string, any>,
> =
  Exclude<TApi[keyof TApi], TDomain[keyof TDomain]> extends never
    ? true
    : TypeErrorReport<
        'Enum missing values',
        {
          missing: Exclude<TApi[keyof TApi], TDomain[keyof TDomain]>;
        }
      >;

/**
 * Validates that domain and API enums have exactly the same values
 *
 * @example
 * // Domain enum must match API enum exactly
 * type ValidateStatusEnum = ValidateExactEnum<typeof TaskStatuses, typeof _TaskStatuses>;
 */
export type ValidateExactEnum<
  TDomain extends Record<string, any>,
  TApi extends Record<string, any>,
> = [
  Exclude<TApi[keyof TApi], TDomain[keyof TDomain]>,
  Exclude<TDomain[keyof TDomain], TApi[keyof TApi]>,
] extends [never, never]
  ? true
  : TypeErrorReport<
      'Enum incompatibility',
      {
        missing: Exclude<TApi[keyof TApi], TDomain[keyof TDomain]>;
        extra: Exclude<TDomain[keyof TDomain], TApi[keyof TApi]>;
      }
    >;

/**
 * Validates that a domain model is structurally compatible with its API counterpart,
 * excluding specified keys that will be handled separately.
 *
 * @example
 * // Validates that Task is compatible with TaskSchemaOutput
 * type ValidateTask = ValidateStructure<
 *   Omit<Task, 'attachments' | 'taskType' | 'status'>
 *   Omit<TaskSchemaOutput, 'attachments' | 'taskType' | 'status'>,
 * >;
 */
/**
 * Validates structures with enhanced support for array element validation
 */
export type ValidateStructure<TDomain, TApi> =
  // Step 1: Check for missing properties
  [Exclude<keyof TApi, keyof TDomain>] extends [never]
    ? // Step 2: Validate all common properties
      {
        [K in keyof TApi &
          keyof TDomain]: // Handle arrays with special element validation
        [TApi[K]] extends [readonly any[]]
          ? [TDomain[K]] extends [readonly any[]]
            ? // Get element types
              [TApi[K]] extends [(infer TApiElement)[]]
              ? [TDomain[K]] extends [(infer TDomainElement)[]]
                ? // Validate element types recursively
                  [TApiElement] extends [TDomainElement]
                  ? true
                  : {
                      elementError: ValidateStructure<
                        TDomainElement,
                        TApiElement
                      >;
                    }
                : false // shouldn't happen due to earlier check
              : true // non-tuple arrays, do regular assignability check
            : [TApi[K]] extends [TDomain[K]]
              ? true
              : false // domain type isn't array
          : // Handle objects with recursive validation
            [TApi[K]] extends [object]
            ? [TDomain[K]] extends [object]
              ? [TApi[K]] extends [any[]]
                ? true // Already handled arrays
                : [TDomain[K]] extends [any[]]
                  ? true // Already handled arrays
                  : ValidateStructure<TDomain[K], TApi[K]>
              : [TApi[K]] extends [TDomain[K]]
                ? true
                : false // domain type not object
            : [TApi[K]] extends [TDomain[K]]
              ? true
              : false; // regular type check
      } extends {
        [K in keyof TApi & keyof TDomain]: true | { elementError: true };
      }
      ? true // All validations passed
      : TypeErrorReport<
          'Type incompatibility',
          {
            incompatibleTypes: {
              [K in keyof TApi & keyof TDomain as [
                ValidateStructure<TApi[K], TDomain[K]>,
              ] extends [TypeErrorReport<any, any>]
                ? K
                : [TApi[K]] extends [readonly any[]]
                  ? [TDomain[K]] extends [readonly any[]]
                    ? [TApi[K]] extends [(infer TApiElement)[]]
                      ? [TDomain[K]] extends [(infer TDomainElement)[]]
                        ? [TApiElement] extends [TDomainElement]
                          ? never
                          : K
                        : never
                      : never
                    : [TApi[K]] extends [TDomain[K]]
                      ? never
                      : K
                  : [TApi[K]] extends [TDomain[K]]
                    ? never
                    : K]: {
                expected: TApi[K];
                actual: TDomain[K];
                details: [TApi[K]] extends [(infer TApiElement)[]]
                  ? [TDomain[K]] extends [(infer TDomainElement)[]]
                    ? ValidateStructure<TDomainElement, TApiElement>
                    : unknown
                  : unknown;
              };
            };
          }
        >
    : TypeErrorReport<
        'Missing properties',
        {
          missingProperties: {
            [K in Exclude<keyof TApi, keyof TDomain>]: TApi[K];
          };
        }
      >;

// Missing property test
type Test1 = ValidateStructure<{ a: number }, { a: number; b: string }>;
// Should be: TypeErrorReport with missing property 'b'

// Incompatible property test
type Test2 = ValidateStructure<{ a: string }, { a: number }>;
// Should be: TypeErrorReport with incompatible type for 'a'

// Both errors test
type Test3 = ValidateStructure<{ a: string }, { a: number; b: boolean }>;
// Should be: TypeErrorReport with both issues

// Valid case test
type Test4 = ValidateStructure<
  { a: number; b?: string },
  { a: number; b: string }
>;
// Should be: true

/**
 * Validates a nested object hierarchy by combining multiple validations.
 * Evaluates to true only if all validations pass.
 *
 * @example
 * type NestedValidation = ValidateAll<[
 *   ValidateStructure<
 *      Omit<ExistingSection, 'tasks'>,
 *      Omit<SectionSchemaOutput, 'tasks'>,
 *   >,
 *   ValidateStructure<
 *      Omit<Task, 'attachments'>
 *      Omit<TaskSchemaOutput, 'attachments'>
 *   >,
 * ]>;
 */
export type ValidateAll<TValidations extends any[]> = TValidations extends [
  infer First,
  ...infer Rest,
]
  ? First extends true
    ? Rest['length'] extends 0
      ? true
      : ValidateAll<Rest extends any[] ? Rest : []>
    : TypeErrorReport<
        'Validation error',
        {
          failedValidation: First;
          remainingValidations: Rest;
        }
      >
  : true;

/**
 * Validates bidirectional compatibility between types.
 * Only needed when both types must be completely equivalent (rare in ACL patterns).
 *
 * @example
 * type StrictEquivalence = ValidateBidirectional<
 *   Omit<ApiType, 'readOnlyFields'>,
 *   Omit<DomainType, 'clientOnlyFields'>
 * >;
 */
export type ValidateBidirectional<TDomain, TApi> = ValidateAll<
  [ValidateStructure<TDomain, TApi>, ValidateStructure<TApi, TDomain>]
>;

/**
 * Detailed field-by-field validation report
 */
export type ValidateFields<T, U> = {
  [K in keyof T]: K extends keyof U
    ? T[K] extends U[K]
      ? { valid: true }
      : { valid: false; expected: T[K]; actual: U[K] }
    : { valid: false; error: 'missing in target type' };
};

// ============================================================================
// TEST FIXTURES
// ============================================================================

// Enum fixtures
const ApiEnum = {
  A: 'a',
  B: 'b',
  C: 'c',
} as const;

const MatchingEnum = {
  A: 'a',
  B: 'b',
  C: 'c',
} as const;

const SupersetEnum = {
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd',
} as const;

const SubsetEnum = {
  A: 'a',
  B: 'b',
} as const;

// Type fixtures
interface ApiType {
  id: string;
  name: string;
  count: number;
  optional?: boolean;
  nested: {
    value: string;
  };
}

// ============================================================================
// 1. VALIDATE ENUM TESTS
// ============================================================================

// Should pass when domain has all API values
type EnumTest1 = ValidateEnum<typeof MatchingEnum, typeof ApiEnum>;
const enumTest1: EnumTest1 = true;

// Should pass when domain has more values than API
type EnumTest2 = ValidateEnum<typeof SupersetEnum, typeof ApiEnum>;
const enumTest2: EnumTest2 = true;

// Should fail when domain is missing API values
type EnumTest3 = ValidateEnum<typeof SubsetEnum, typeof ApiEnum>;
// @ts-expect-error - Should be TypeErrorReport with missing 'C'
const enumTest3: EnumTest3 = true;

// Should pass when domain has all API values
type EnumTest4 = ValidateEnum<typeof ApiEnum, typeof SubsetEnum>;
const enumTest4: EnumTest4 = true;

// Should fail when domain is missing API values
type EnumTest5 = ValidateEnum<typeof ApiEnum, typeof SupersetEnum>;
// @ts-expect-error - Should be TypeErrorReport with missing 'd'
const enumTest5: EnumTest5 = true;

// ============================================================================
// 2. VALIDATE EXACT ENUM TESTS
// ============================================================================

// Should pass when enums match exactly
type ExactEnumTest1 = ValidateExactEnum<typeof MatchingEnum, typeof ApiEnum>;
const exactEnumTest1: ExactEnumTest1 = true;

// Should fail when domain has extra values
type ExactEnumTest2 = ValidateExactEnum<typeof SupersetEnum, typeof ApiEnum>;
// @ts-expect-error - Should be TypeErrorReport with extra 'D'
const exactEnumTest2: ExactEnumTest2 = true;

// Should fail when domain is missing values
type ExactEnumTest3 = ValidateExactEnum<typeof SubsetEnum, typeof ApiEnum>;
// @ts-expect-error - Should be TypeErrorReport with missing 'C'
const exactEnumTest3: ExactEnumTest3 = true;

// ============================================================================
// 3. VALIDATE STRUCTURE TESTS
// ============================================================================

// Should pass when domain has all API fields with compatible types
type StructureTest1 = ValidateStructure<
  {
    id: string;
    name: string;
    count: number;
    optional?: boolean;
    nested: { value: string };
  },
  ApiType
>;
const structureTest1: StructureTest1 = true;

// Should fail when domain is missing API fields
type StructureTest2 = ValidateStructure<{ id: string; name: string }, ApiType>;
// @ts-expect-error - Should be TypeErrorReport with missing count, optional, nested
const structureTest2: StructureTest2 = true;

// Should fail when domain has incompatible types
type StructureTest3 = ValidateStructure<
  {
    id: number;
    name: string;
    count: number;
    optional?: boolean;
    nested: { value: string };
  },
  ApiType
>;
// @ts-expect-error - Should be TypeErrorReport with incompatible id type
const structureTest3: StructureTest3 = true;

// Should fail with both missing fields and incompatible types
type StructureTest4 = ValidateStructure<{ id: number; name: string }, ApiType>;
// @ts-expect-error - Should be TypeErrorReport with multiple issues
const structureTest4: StructureTest4 = true;

// Should fail optional properties correctly
type StructureTest5 = ValidateStructure<
  { id: string; name: string; count: number; nested: { value: string } },
  ApiType
>;
// @ts-expect-error - Should be TypeErrorReport with multiple issues
const structureTest5: StructureTest5 = true;

// Should validate nested objects
type StructureTest6 = ValidateStructure<
  {
    id: string;
    name: string;
    count: number;
    optional?: boolean;
    nested: { value: number };
  },
  ApiType
>;
// @ts-expect-error - Should be TypeErrorReport with incompatible nested.value
const structureTest6: StructureTest6 = true;

// Should validate with extra properties objects
type StructureTest7 = ValidateStructure<
  {
    id: string;
    name: string;
    count: number;
    optional?: boolean;
    nested: { value: string };
    extra: string;
  },
  ApiType
>;
const structureTest7: StructureTest7 = true;

// Should validate with property with larger type
type StructureTest8 = ValidateStructure<
  {
    id: string;
    name: string;
    count: number | string;
    optional?: boolean;
    nested: { value: string };
  },
  ApiType
>;
const structureTest8: StructureTest8 = true;

// ============================================================================
// 4. VALIDATE ARRAY TESTS
// ============================================================================

// // Should pass with compatible element types
// type ArrayTest1 = ValidateArray<string, string>;
// const arrayTest1: ArrayTest1 = true;

// // Should fail with incompatible element types
// type ArrayTest2 = ValidateArray<number, string>;
// // @ts-expect-error - Should be TypeErrorReport with element incompatibility
// const arrayTest2: ArrayTest2 = true;

// // Should validate arrays of objects
// type ArrayTest3 = ValidateArray<
//   { id: string; name: string },
//   { id: string; name: string; extra: boolean }
// >;
// const arrayTest3: ArrayTest3 = true;

// // Should validate arrays of objects
// type ArrayTest4 = ValidateArray<
//   { a: number | string },
//   { a: number }
// >;
// const arrayTest4: ArrayTest4 = true;

// ============================================================================
// 5. VALIDATE ALL TESTS
// ============================================================================

// Should pass when all validations pass
type AllTest1 = ValidateAll<[true, true, true]>;
const allTest1: AllTest1 = true;

// Should fail when one validation fails
type TrueType = true;
type ErrorType = TypeErrorReport<'test error', { field: string }>;
type AllTest2 = ValidateAll<[TrueType, ErrorType, TrueType]>;
// @ts-expect-error - Should be TypeErrorReport for second validation
const allTest2: AllTest2 = true;

// Should fail on first error
type AllTest3 = ValidateAll<
  [
    TypeErrorReport<'first error', { field: string }>,
    TypeErrorReport<'second error', { field: number }>,
  ]
>;
// @ts-expect-error - Should be TypeErrorReport for first validation
const allTest3: AllTest3 = true;

// ============================================================================
// 6. VALIDATE BIDIRECTIONAL TESTS
// ============================================================================

// Should pass when types are compatible in both directions
type BiTest1 = ValidateBidirectional<
  { id: string; name: string },
  { id: string; name: string }
>;
const biTest1: BiTest1 = true;

// Should fail when types are compatible in one direction but not the other
type BiTest2 = ValidateBidirectional<
  { id: string; name: string; extra: boolean },
  { id: string; name: string }
>;
// @ts-expect-error - Should be TypeErrorReport (reverse direction fails)
const biTest2: BiTest2 = true;

// ============================================================================
// 7. VALIDATE FIELDS TESTS
// ============================================================================

// Simple type compatibility checking
type FieldsTest = ValidateFields<
  { id: string; count: number; active: boolean },
  { id: string; count: string; missing: Date }
>;

// Verify individual field results using indexed access type
type IdFieldResult = FieldsTest['id'];
type CountFieldResult = FieldsTest['count'];
type ActiveFieldResult = FieldsTest['active'];

// True has no incompatible fields
type NeedsNoFix = Valid<StructureTest1>;
const needsNoFix: NeedsNoFix = true;

// Error type has validation issues
type NeedsFix = Valid<StructureTest3>;
// @ts-expect-error - Should not be assignable to true
const needsFix: NeedsFix = true;

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

// Empty object tests
type EmptyTest1 = ValidateStructure<object, object>;
const emptyTest1: EmptyTest1 = true;

type EmptyTest2 = ValidateStructure<object, { a: number }>;
// @ts-expect-error - Should be TypeErrorReport with missing 'a'
const emptyTest2: EmptyTest2 = true;

// Subtype tests
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

type SubtypeTest1 = ValidateStructure<Dog, Animal>;
const subtypeTest1: SubtypeTest1 = true;

type SubtypeTest2 = ValidateStructure<Animal, Dog>;
// @ts-expect-error - Should be TypeErrorReport with missing 'breed'
const subtypeTest2: SubtypeTest2 = true;
