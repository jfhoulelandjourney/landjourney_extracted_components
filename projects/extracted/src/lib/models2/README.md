# Domain Model Guidelines

> **IMPORTANT**: These guidelines ensure type safety and maintainability in our domain models layer.

## Purpose

This anti-corruption layer creates a clean separation between our application domain models and the automatically generated API types. It provides:

1. **Type safety** without runtime overhead
2. **Early detection** of API/domain model incompatibilities
3. **Consistent patterns** for domain model definition
4. **Centralized validation** of type compatibility

## 1. Type Definition Pattern

### ALWAYS follow this pattern:

```typescript
/**
 * @description Domain representation with enhanced type safety
 * @see ApiType - Original API type
 */
export type DomainType = Simplify<
  Exclude<ApiType, 'field1' | 'field2'> & {
    field1: DomainEnum; // Domain-specific enum
    field2: NestedType[]; // Domain-specific type
  }
>;

// Validate domain type against API type
type ValidateTypeResult = ValidateStructure<
  Omit<DomainType, 'field1' | 'field2'>,
  Omit<ApiType, 'field1' | 'field2'>
>;
const _validateType: Valid<ValidateTypeResult> = true;
```

## 2. Type Validation Rules

### Enum Validation

For every enum, validate it against its API counterpart:

```typescript
// For direct equivalence:
export const TaskStatuses = _TaskStatuses;
export type TaskStatuses = (typeof TaskStatuses)[keyof typeof TaskStatuses];
type ValidateTaskStatusesResult = ValidateEnum<
  typeof TaskStatuses,
  typeof _TaskStatuses
>;
const _validateTaskStatuses: Valid<ValidateTaskStatusesResult> = true;

// For domain extensions:
export const ExtendedStatuses = {
  ..._ApiStatuses,
  CUSTOM_STATE: 'custom',
} as const;
export type ExtendedStatuses =
  (typeof ExtendedStatuses)[keyof typeof ExtendedStatuses];
type ValidateExtendedStatusesResult = ValidateEnumSuperset<
  typeof ExtendedStatuses,
  typeof _ApiStatuses
>;
const _validateExtendedStatuses: Valid<ValidateExtendedStatusesResult> = true;
```

### Object Structure Validation

For every domain object, validate its structure compatibility:

```typescript
type ValidateTaskResult = ValidateStructure<
  Omit<Task, 'attachments' | 'taskType' | 'status'>,
  Omit<TaskSchemaOutput, 'attachments' | 'taskType' | 'status'>
>;
const _validateTask: Valid<ValidateTaskResult> = true;
```

### Array Validation

For arrays of complex types:

```typescript
type ValidateTaskArraysResult = ValidateArray<
  Omit<Task, 'attachments' | 'taskType'>,
  Omit<TaskSchemaOutput, 'attachments' | 'taskType'>
>;
const _validateTaskArrays: Valid<ValidateTaskArraysResult> = true;
```

## 3. Type Conversion Utilities

### DON'T use direct type assertions (as SomeType)

```typescript
// ❌ WRONG - Direct type assertion
const section = apiSection as ExistingSection;

// ✅ CORRECT - Type-safe conversion with validation
const section = asModel<
  ExistingSection, // Target model type
  SectionSchemaOutput // Source API type
>(apiSection);

// ✅ CORRECT - Type-safe conversion back to API
const apiSection = asApi<
  Omit<SectionSchemaInput, 'tasks' | 'status'>, // Target API type
  Omit<ExistingSection, 'tasks' | 'status'> // Source model type
>(section);
```

## 4. Runtime Type Guards

Add runtime type guards for critical models:

```typescript
export function isTask(value: unknown): value is Task {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'sectionId' in value &&
    'taskType' in value &&
    'status' in value
  );
}
```

## 5. Documentation Requirements

```typescript
/**
 * @description Clear description of the type's purpose
 * @see OriginalApiType - Reference to API type
 * Additional context about type transformations
 */
export type DomainType = Simplify<
  // Type definition here...
>;
```

## 6. File Organization

```typescript
// 1. Imports
import { ... } from '...';

// 2. Enum definitions and validations
export const EnumType = _ApiEnum;
export type EnumType = (typeof EnumType)[keyof typeof EnumType];
type ValidateEnumResult = ValidateEnum<typeof EnumType, typeof _ApiEnum>;
const _validateEnum: Valid<ValidateEnumResult> = true;

// 3. Simple type definitions

// 4. Complex type definitions with validations
export type ComplexType = Simplify<...>;
type ValidateComplexResult = ValidateStructure<...>;
const _validateComplex: Valid<ValidateComplexResult> = true;

// 5. Type guards
export function isComplexType(value: unknown): value is ComplexType {
  // Implementation...
}

```
