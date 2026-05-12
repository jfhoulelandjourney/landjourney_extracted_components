/* ==========================================================================
   CORE ANNOTATION DOMAIN TYPES
   ========================================================================== */

import type { Instance } from '@nutrient-sdk/viewer';
import { isEqual, isNotNil } from 'es-toolkit';
import type { FileMetadata } from '../../models/documents/fileModels';
import { RequestUserRoles } from '../../models/requestModels';
import { FIELD_DATA_SCHEMA_VERSION } from '../pdf/field-framework/constants';
import { FIELD_PLUGINS } from '../pdf/field-framework/plugins/field-plugin';
import type {
  SigneeInfo,
  SignerInfo,
} from '../pdf/field-framework/types/field-data';
import type { SignatureInstantJSON } from '../pdf/field-framework/types/instant-json';

// Re-export framework-level types so v1 callers that still import from this
// file keep working. New code should import from `pdf/field-framework/types/`.
export type {
  SigneeInfo,
  SignerInfo,
  SignedBy,
} from '../pdf/field-framework/types/field-data';
export type {
  CheckboxFormField,
  ComboBoxFormField,
  FormFieldEntry,
  ListBoxFormField,
  RadioFormField,
  SignatureFormField,
  SignatureInstantJSON,
  TextFormField,
} from '../pdf/field-framework/types/instant-json';

export type InstantJSON = Awaited<ReturnType<Instance['exportInstantJSON']>>;

/**
 * Supported annotation types with compile-time type safety.
 *
 * Platform-created: name, signature, initials, date, custom
 */
export const AnnotationType = {
  Name: 'name',
  Signature: 'signature',
  Initials: 'initials',
  Date: 'date',
  Custom: 'custom',
} as const;

export type AnnotationType =
  (typeof AnnotationType)[keyof typeof AnnotationType];

interface BaseMinimalEntity {
  id?: string;
  role: RequestUserRoles;
  metaType: 'INDIVIDUAL' | 'ORGANIZATION';
}

interface IndividualMinimalEntity extends BaseMinimalEntity {
  metaType: 'INDIVIDUAL';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface OrganizationMinimalEntity extends BaseMinimalEntity {
  metaType: 'ORGANIZATION';
  organizationName: string;
  contact: {
    email: string;
    phone?: string;
  };
}

type MinimalEntity = IndividualMinimalEntity | OrganizationMinimalEntity;

/**
 * Base properties shared by all annotation types.
 * For templates: signee should be SigneeInfo (multiple roles)
 * For real signers: signer should be SignerInfo (single role)
 */
export interface BaseAnnotationData {
  readonly type: AnnotationType;
  readonly width?: number;
  readonly height?: number;
  readonly createdAt?: number;
  readonly visible: boolean;
  readonly readonly: boolean;
  readonly filled: boolean;
  readonly filledAt?: number;
  readonly filledBy?: {
    userId: string;
    userFirstName: string;
    userLastName: string;
    representing: string;
  } | null;
  readonly isTemplate: boolean;
  readonly signee: SigneeInfo | null;
  readonly signer: SignerInfo | null;
}

/**
 * Name annotation - displays signee's name as text.
 */
export interface NameAnnotationData extends BaseAnnotationData {
  readonly type: 'name';
  readonly name: string | null;
}

export interface CustomAnnotationData extends BaseAnnotationData {
  readonly type: 'custom';
  readonly name: string | null;
}

/**
 * Signature annotation - digital signature field.
 */
export interface SignatureAnnotationData extends BaseAnnotationData {
  readonly type: 'signature';
}

/**
 * Initials annotation - initials signature field.
 */
export interface InitialsAnnotationData extends BaseAnnotationData {
  readonly type: 'initials';
  readonly initials: string | null;
}

/**
 * Date annotation - auto-formatted date field.
 */
export interface DateAnnotationData extends BaseAnnotationData {
  readonly type: 'date';
  readonly date: number | null;
}

/**
 * Union type of all possible annotation data structures.
 */
export type AnnotationData =
  | NameAnnotationData
  | SignatureAnnotationData
  | InitialsAnnotationData
  | DateAnnotationData
  | CustomAnnotationData;

/* ==========================================================================
   ANNOTATION CONFIGURATION DOMAIN
   ========================================================================== */

/**
 * Configuration interface for annotation rendering and behavior.
 */
export interface AnnotationConfig {
  readonly width: number;
  readonly height: number;
  readonly formFieldType: 'signature' | 'text';
  readonly formatScript?: string;
  readonly placeholder?: string;
  readonly validationScript?: string;
  readonly defaultValueExtractor?: (data: AnnotationData) => string;
  readonly customRendering?: boolean;
}

/**
 * Default value extractors for each annotation type.
 */
export const DefaultValueExtractors = {
  name: (data: AnnotationData): string => {
    if (data.type === 'name' && data.name) {
      return data.name;
    }
    if (data.signee?.name) {
      return data.signee.name;
    }
    return '';
  },

  signature: (_data: AnnotationData): string => '',

  initials: (_data: AnnotationData): string => '',

  date: (data: AnnotationData): string => {
    if (data.type === 'date' && data.date) {
      return new Date(data.date).toLocaleDateString('en-US');
    }
    return '';
  },

  custom: (data: AnnotationData): string => {
    if (data.type === 'custom' && data.name) {
      return data.name;
    }
    return '';
  },
} as const satisfies Record<AnnotationType, (data: AnnotationData) => string>;

/**
 * Centralized annotation configurations with type safety.
 * This is the single source of truth for annotation behavior.
 */
export const ANNOTATION_CONFIGS = {
  name: {
    width: 200,
    height: 30,
    formFieldType: 'text',
    placeholder: 'Enter full name',
    defaultValueExtractor: DefaultValueExtractors.name,
    customRendering: true,
  },

  signature: {
    width: 200,
    height: 30,
    formFieldType: 'signature',
    placeholder: 'Click to sign',
    defaultValueExtractor: DefaultValueExtractors.signature,
    customRendering: true,
  },

  initials: {
    width: 80,
    height: 30,
    formFieldType: 'signature',
    placeholder: 'Initials',
    defaultValueExtractor: DefaultValueExtractors.initials,
    customRendering: true,
  },

  date: {
    width: 120,
    height: 30,
    formFieldType: 'text',
    placeholder: 'MM/DD/YYYY',
    formatScript: 'AFDate_FormatEx("mm/dd/yyyy")',
    validationScript: 'AFDate_Keystroke("mm/dd/yyyy")',
    defaultValueExtractor: DefaultValueExtractors.date,
    customRendering: false,
  },

  custom: {
    width: 200,
    height: 30,
    formFieldType: 'text',
    placeholder: 'Type in',
    defaultValueExtractor: DefaultValueExtractors.custom,
    customRendering: true,
  },
} as const satisfies Record<AnnotationType, AnnotationConfig>;

/* ==========================================================================
   TYPE GUARDS AND UTILITIES
   ========================================================================== */

/**
 * Type guard to check if annotation is a name annotation.
 */
export function isNameAnnotation(
  data: AnnotationData
): data is NameAnnotationData {
  return data.type === AnnotationType.Name;
}

/**
 * Type guard to check if annotation is a custom annotation.
 */
export function isCustomAnnotation(
  data: AnnotationData
): data is CustomAnnotationData {
  return data.type === AnnotationType.Custom;
}

/**
 * Type guard to check if annotation is a signature annotation.
 */
export function isSignatureAnnotation(
  data: AnnotationData
): data is SignatureAnnotationData {
  return data.type === AnnotationType.Signature;
}

/**
 * Type guard to check if annotation is an initials annotation.
 */
export function isInitialsAnnotation(
  data: AnnotationData
): data is InitialsAnnotationData {
  return data.type === AnnotationType.Initials;
}

/**
 * Type guard to check if annotation is a date annotation.
 */
export function isDateAnnotation(
  data: AnnotationData
): data is DateAnnotationData {
  return data.type === AnnotationType.Date;
}

/**
 * Validates if a string is a valid annotation type.
 */
export function isValidAnnotationType(type: string): type is AnnotationType {
  return Object.values<string>(AnnotationType).includes(type);
}

/**
 * Gets configuration for a specific annotation type
 */
export function getAnnotationConfig(type: string): AnnotationConfig | null {
  if (!isValidAnnotationType(type)) {
    return null;
  }
  return ANNOTATION_CONFIGS[type];
}

/* ==========================================================================
   FACTORY FUNCTIONS
   ========================================================================== */

/**
 * Creates a new annotation data object with defaults.
 */
export function createAnnotationData<T extends AnnotationType>(
  type: T,
  overrides: Partial<Extract<AnnotationData, { type: T }>> = {}
): Extract<AnnotationData, { type: T }> {
  const baseData: BaseAnnotationData = {
    type,
    visible: true,
    readonly: false,
    filled: false,
    isTemplate: false,
    signee: null,
    signer: null,
    signedBy: [],
    createdAt: Date.now(),
    ...overrides,
  };

  switch (type) {
    case 'name':
      return {
        ...baseData,
        type: 'name',
        name: null,
        ...overrides,
      } as Extract<AnnotationData, { type: T }>;

    case 'signature':
      return {
        ...baseData,
        type: 'signature',
        ...overrides,
      } as Extract<AnnotationData, { type: T }>;

    case 'initials':
      return {
        ...baseData,
        type: 'initials',
        initials: null,
        ...overrides,
      } as Extract<AnnotationData, { type: T }>;

    case 'date':
      return {
        ...baseData,
        type: 'date',
        date: null,
        ...overrides,
      } as Extract<AnnotationData, { type: T }>;

    case 'custom':
      return {
        ...baseData,
        type: 'custom',
        ...overrides,
      } as Extract<AnnotationData, { type: T }>;

    default:
      throw new Error(`Unsupported annotation type: ${type}`);
  }
}

/**
 * Creates a SigneeInfo object with validation.
 */
export function createSigneeInfo(
  id: string,
  name: string,
  role: RequestUserRoles,
  options: Partial<Omit<SignerInfo, 'id' | 'name'>> = {}
): SignerInfo {
  if (!id.trim()) {
    throw new Error('Signee ID cannot be empty');
  }
  if (!name.trim()) {
    throw new Error('Signee name cannot be empty');
  }

  return {
    id: id.trim(),
    name: name.trim(),
    role,
    email: options.email?.trim() || undefined,
    phone: options.phone?.trim() || undefined,
    image: options.image || null,
    imageUrl: options.imageUrl?.trim() || null,
  };
}

/* ==========================================================================
   CONSTANTS AND ENUMS
   ========================================================================== */

/**
 * Default dimensions for annotations (in PDF points).
 */
export const DEFAULT_ANNOTATION_DIMENSIONS = {
  MIN_WIDTH: 50,
  MIN_HEIGHT: 20,
  MAX_WIDTH: 400,
  MAX_HEIGHT: 200,
} as const;

/**
 * Default styles for annotation rendering.
 */
export const DEFAULT_ANNOTATION_STYLES = {
  BACKGROUND_COLOR: 'transparent',
  BORDER_COLOR: '#007ACC',
  BORDER_WIDTH: 1,
  FONT_SIZE: 12,
  FONT_FAMILY: 'Arial, sans-serif',
} as const;

/* ==========================================================================
   FILE METADATA EXTENSION
   ========================================================================== */

// SignatureInstantJSON, FormFieldEntry, and the per-form-field types now live
// in `pdf/field-framework/types/instant-json.ts`. SigneeInfo / SignerInfo /
// SignedBy live in `pdf/field-framework/types/field-data.ts`. Imported and
// re-exported at the top of this file for v1 callers that haven't migrated.

export interface SignatureMetadata {
  signatureTask: SignatureInstantJSON;
}

export function hasSignatureMetadata(
  metadata?: unknown
): metadata is FileMetadata & { fileMetadata: SignatureMetadata } {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }
  const fileMetadata = (metadata as FileMetadata).fileMetadata;
  if (!fileMetadata || typeof fileMetadata !== 'object') {
    return false;
  }
  return (
    'signatureTask' in fileMetadata &&
    typeof (fileMetadata as SignatureMetadata).signatureTask === 'object' &&
    isSignatureInstantJSON((fileMetadata as SignatureMetadata).signatureTask)
  );
}

export function isSignatureInstantJSON(
  metadata?: unknown
): metadata is SignatureInstantJSON {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }
  const signatureTask = metadata as SignatureInstantJSON;
  return (
    'pdfId' in signatureTask &&
    'format' in signatureTask &&
    typeof signatureTask.format === 'string' &&
    Array.isArray(signatureTask.annotations) &&
    Array.isArray(signatureTask.formFields)
  );
}

export function extractSignatureMetadata(
  metadata?: FileMetadata | null
): SignatureInstantJSON | null {
  const fileMetadata = metadata?.fileMetadata;
  if (!fileMetadata || !('signatureTask' in fileMetadata)) {
    return null;
  }

  const signatureTask = fileMetadata.signatureTask as SignatureInstantJSON;

  // Validate the structure of the signature task
  if (!isSignatureInstantJSON(signatureTask)) {
    return null;
  }

  return signatureTask;
}

function isSignatureFormFieldValue(
  value: unknown
): value is SignatureInstantJSON['formFieldValues'][number] {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const formFieldValue = value as Record<string, unknown>;

  return (
    typeof formFieldValue['name'] === 'string' &&
    formFieldValue['type'] === 'pspdfkit/form-field-value' &&
    typeof formFieldValue['v'] === 'number' &&
    typeof formFieldValue['value'] === 'string'
  );
}

export function mergeFormFieldValues(
  listenerValues: SignatureInstantJSON['formFieldValues'],
  exportValues:
    | InstantJSON['formFieldValues']
    | SignatureInstantJSON['formFieldValues']
    | null
    | undefined
): SignatureInstantJSON['formFieldValues'] {
  const normalizedExportValues: SignatureInstantJSON['formFieldValues'] = [];

  for (const entry of exportValues ?? []) {
    if (isSignatureFormFieldValue(entry)) {
      normalizedExportValues.push(entry);
    }
  }

  const exportMap = new Map(normalizedExportValues.map(v => [v.name, v]));
  const listenerNames = new Set(listenerValues.map(v => v.name));
  const merged: SignatureInstantJSON['formFieldValues'] = listenerValues.map(
    entry => exportMap.get(entry.name) ?? entry
  );
  for (const entry of normalizedExportValues) {
    if (!listenerNames.has(entry.name)) {
      merged.push(entry);
    }
  }
  return merged;
}

/**
 * Treat a signer-bound annotation as completed for the purposes of the
 * finalize gate.
 *
 * - v1 annotations: must be `filled === true` (legacy behavior).
 * - v2 annotations that are EFFECTIVELY REQUIRED (`required: true` or the
 *   plugin declares `requiresAssignment: true` — signature/initials, etc):
 *   must be `filled === true`.
 * - v2 annotations that are OPTIONAL (`required !== true` and the plugin
 *   doesn't require assignment — currency/dropdown/text-input/checkbox/radio
 *   without explicit required): always count as completed regardless of
 *   `filled`. The user is free to skip them; their presence in
 *   `annotationsWithSigners` (because `mapCustomersToSigners` assigned the
 *   sole user to them) must not block the finalize UI.
 *
 * Mirrors the `effectiveRequired` rule used by
 * `PdfAnnotationFillDirective.allUserRequiredFieldsFilled`
 * (annotation-fill.directive.ts:228-257) so both signals agree.
 */
function isAnnotationCompletedForFinalize(
  annotation: SignatureInstantJSON['annotations'][number]
): boolean {
  const cd = annotation.customData as
    | (AnnotationData & {
        readonly schemaVersion?: number;
        readonly required?: boolean;
        readonly type?: string;
      })
    | null
    | undefined;
  if (!cd) return true;
  if (cd.schemaVersion === FIELD_DATA_SCHEMA_VERSION) {
    const plugin = Object.values(FIELD_PLUGINS).find(p => p.type === cd.type);
    const effectiveRequired =
      cd.required === true || plugin?.requiresAssignment === true;
    if (!effectiveRequired) return true;
  }
  return cd.filled === true;
}

export function isSignatureDocumentFullySigned(
  metadata?: FileMetadata | SignatureInstantJSON | null,
  options?: {
    allowSignedByFallback?: boolean;
  }
): boolean {
  const signatureMetadata = isSignatureInstantJSON(metadata)
    ? metadata
    : extractSignatureMetadata(metadata);

  if (!signatureMetadata) {
    return false;
  }

  const annotationsWithSigners = signatureMetadata.annotations.filter(
    annotation => (annotation.customData as AnnotationData | null)?.signer
  );

  // Required fields without a signer (e.g. a date field with required:true) must also
  // be filled before submission. Hidden annotations (noView flag) are excluded — they
  // have no resolved signer and cannot be filled by anyone.
  const requiredUnassignedVisible = signatureMetadata.annotations.filter(
    annotation => {
      const cd = annotation.customData as unknown as
        | Record<string, unknown>
        | null
        | undefined;
      if (!cd) return false;
      return (
        !cd['signer'] &&
        cd['required'] === true &&
        cd['filled'] !== true &&
        !(annotation.flags ?? []).includes('noView')
      );
    }
  );

  if (
    annotationsWithSigners.length > 0 ||
    requiredUnassignedVisible.length > 0
  ) {
    return (
      requiredUnassignedVisible.length === 0 &&
      annotationsWithSigners.every(isAnnotationCompletedForFinalize)
    );
  }

  return options?.allowSignedByFallback === true
    ? (signatureMetadata.signedBy?.length ?? 0) > 0
    : false;
}

export function getCustomDataFromAnnotation(
  metadata?: SignatureInstantJSON['annotations'][number] | null | undefined
): AnnotationData | null {
  if (!metadata) {
    return null;
  }

  return (metadata.customData as AnnotationData | null) ?? null;
}

function isSignerInfo(obj: unknown): obj is SignerInfo {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const signer = obj as SignerInfo;
  return (
    typeof signer.id === 'string' &&
    typeof signer.name === 'string' &&
    typeof signer.role === 'string' &&
    (signer.email === undefined || typeof signer.email === 'string') &&
    (signer.phone === undefined || typeof signer.phone === 'string') &&
    (signer.image === undefined ||
      signer.image instanceof Blob ||
      signer.image === null) &&
    (signer.imageUrl === undefined ||
      typeof signer.imageUrl === 'string' ||
      signer.imageUrl === null)
  );
}

function isSigneeInfo(obj: unknown): obj is SigneeInfo {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const signee = obj as SigneeInfo;
  return (
    typeof signee.id === 'string' &&
    typeof signee.name === 'string' &&
    Array.isArray(signee.roles) &&
    signee.roles.every(role => typeof role === 'string') &&
    (signee.email === undefined || typeof signee.email === 'string') &&
    (signee.phone === undefined || typeof signee.phone === 'string') &&
    (signee.image === undefined ||
      signee.image instanceof Blob ||
      signee.image === null) &&
    (signee.imageUrl === undefined ||
      typeof signee.imageUrl === 'string' ||
      signee.imageUrl === null)
  );
}

// Extracts signee/signer options from the signature metadata
function extractOptions(
  property: 'signee',
  metadata?: SignatureMetadata['signatureTask'] | null
): SigneeInfo[];
function extractOptions(
  property: 'signer',
  metadata?: SignatureMetadata['signatureTask'] | null
): SignerInfo[];
function extractOptions(
  property: 'signee' | 'signer',
  metadata?: SignatureMetadata['signatureTask'] | null
) {
  if (!metadata || !metadata.annotations || metadata.annotations.length === 0) {
    return [];
  }

  const signeeMap: Record<string, SigneeInfo | SignerInfo> = {};

  metadata.annotations.forEach(annotation => {
    // customData may legitimately be missing — pre-existing PDF form
    // widgets, externally-loaded annotations, or v2 multi-widget plugins
    // (checkbox/radio) whose secondary widgets carry no signee/signer.
    // Treat as "no entry to extract" rather than crashing.
    const customData = annotation.customData as AnnotationData | undefined;
    const value = customData?.[property as 'signee' | 'signer'];
    const id = value?.id;
    if (value && id) {
      if (isSignerInfo(value) && property === 'signer') {
        signeeMap[id] = {
          id: value.id,
          name: value.name,
          role: value.role || null,
          email: value.email || undefined,
          phone: value.phone || undefined,
          image: value.image || null,
          imageUrl: value.imageUrl || undefined,
        } as SignerInfo;
      } else if (isSigneeInfo(value) && property === 'signee') {
        signeeMap[id] = {
          id: value.id,
          name: value.name,
          roles: 'roles' in value && value.roles.length > 0 ? value.roles : [],
          email: value.email || undefined,
          phone: value.phone || undefined,
          image: value.image || null,
          imageUrl: value.imageUrl || undefined,
        } as SigneeInfo;
      } else {
        throw new Error(
          `Invalid ${property} data in annotation ${annotation.id}`
        );
      }
    }
  });

  return Object.values(signeeMap).sort((a, b) => a.id.localeCompare(b.id));
}

export const getSigneeOptions = (
  metadata?: SignatureInstantJSON | null | undefined
) => extractOptions('signee', metadata);
export const getSignerOptions = (
  metadata?: SignatureInstantJSON | null | undefined
) => extractOptions('signer', metadata);

/* ==========================================================================
   SIGNEE METADATA PIPELINE
   ========================================================================== */

/**
 * Internal helper: Compare SigneeInfo or SignerInfo objects for equality
 */
function isSigneeOrSignerEqual(
  a: SigneeInfo | SignerInfo,
  b: SigneeInfo | SignerInfo
): boolean {
  // Basic properties comparison
  if (
    a.id !== b.id ||
    a.name !== b.name ||
    a.email !== b.email ||
    a.phone !== b.phone ||
    a.imageUrl !== b.imageUrl
  ) {
    return false;
  }

  // Role comparison - handle both single role and multiple roles
  const aRole = 'role' in a ? a.role : a.roles;
  const bRole = 'role' in b ? b.role : b.roles;

  return isEqual(aRole, bRole);
}

export interface SigneeUpdatePipeline {
  originalMetadata: SignatureInstantJSON;
  newSigneeOptions: SigneeInfo[];
}

/**
 * Simplified pipeline that extracts current signees from metadata:
 * 1. Extract current signees from metadata
 * 2. Calculate which signees were removed
 * 3. Unassign signees on annotations that referenced removed signees
 *    (annotation + form field preserved; signee set to null)
 * 4. Update data for remaining signees
 */
export function processSigneeUpdatePipeline({
  originalMetadata,
  newSigneeOptions = [],
}: SigneeUpdatePipeline): SignatureInstantJSON {
  if (!originalMetadata) {
    throw new Error('Original metadata is required');
  }

  // Early return for no-op cases
  if (newSigneeOptions.length === 0 && !originalMetadata.annotations?.length) {
    return structuredClone(originalMetadata);
  }

  // Extract current signees from the metadata itself
  const currentSigneeOptions = getSigneeOptions(originalMetadata);
  const newSigneeIds = new Set(newSigneeOptions.map(s => s.id));

  // Calculate changes
  const removedSigneeIds = currentSigneeOptions
    .filter(s => !newSigneeIds.has(s.id))
    .map(s => s.id);

  const hasChanges =
    removedSigneeIds.length > 0 ||
    !newSigneeOptions.every(newSignee => {
      const currentSignee = currentSigneeOptions.find(
        s => s.id === newSignee.id
      );
      return currentSignee && isSigneeOrSignerEqual(currentSignee, newSignee);
    });

  if (!hasChanges) {
    return structuredClone(originalMetadata);
  }

  // Start with a deep clone to ensure complete immutability
  let processedMetadata = structuredClone(originalMetadata);

  // Stage 1: Unassign deleted signees + normalize v2 invariant.
  // The function does both responsibilities: (a) sets `signee: null` on
  // annotations whose signee was removed; (b) writes `signee: null` on any
  // v2 annotation whose `signee` is undefined. Always called so the
  // normalization runs even when no signees were deleted.
  processedMetadata = unassignSigneesFromMetadata(
    processedMetadata,
    removedSigneeIds
  );

  // Stage 2: Update remaining signee data
  processedMetadata = updateSigneeDataInMetadata(
    processedMetadata,
    newSigneeOptions
  );

  return processedMetadata;
}

/**
 * Internal helper: Unassign deleted signees from their annotations and
 * normalize the v2 signee invariant.
 *
 * Two responsibilities, one pass:
 * 1. **Unassign** — for every annotation whose `signee.id` is in
 *    `removedSigneeIds`, set `signee = null`. The annotation, its form field,
 *    and its form field value are preserved (orphaned, not deleted).
 * 2. **Normalize** — for every v2 signature annotation whose `signee` is
 *    `undefined` or missing (from instantJson round-trips, legacy data, or
 *    imports), explicitly write `signee = null`. The v2 schema only allows
 *    `{...} | null`, so this enforces the invariant at the write boundary
 *    and lets readers rely on `=== null` checks instead of falsy checks.
 */
function unassignSigneesFromMetadata(
  metadata: SignatureInstantJSON,
  removedSigneeIds: string[]
): SignatureInstantJSON {
  const ids = new Set(removedSigneeIds);
  let changed = false;

  const annotations = metadata.annotations.map(annotation => {
    const customData = annotation.customData as
      | (AnnotationData & { schemaVersion?: number })
      | undefined;
    const id = customData?.signee?.id;

    // Case 1: this annotation's signee was deleted — unassign explicitly.
    if (id && ids.has(id)) {
      changed = true;
      return {
        ...annotation,
        customData: { ...(customData ?? {}), signee: null },
      };
    }

    // Case 2: v2 invariant — `signee` must be present (either `{...}` or
    // explicit `null`). If it's missing/undefined, write `null`.
    if (customData?.schemaVersion === 2 && customData.signee === undefined) {
      changed = true;
      return {
        ...annotation,
        customData: { ...customData, signee: null },
      };
    }

    return annotation;
  });

  return changed ? { ...metadata, annotations } : metadata;
}

/**
 * Count how many annotations are currently assigned to the given signee id.
 * Used by host UIs to surface a confirmation dialog before deletion ("X
 * fields will be unassigned").
 */
export function countFieldsUsingSignee(
  metadata: SignatureMetadata | null | undefined,
  signeeId: string
): number {
  const task = metadata?.signatureTask;
  if (!task) {
    return 0;
  }
  let count = 0;
  for (const annotation of task.annotations ?? []) {
    const customData = annotation.customData as AnnotationData | undefined;
    if (customData?.signee?.id === signeeId) {
      count++;
    }
  }
  return count;
}

/**
 * Internal helper: Update signee data for remaining annotations
 * Returns a new SignatureInstantJSON object without modifying the input
 */
function updateSigneeDataInMetadata(
  metadata: SignatureInstantJSON,
  signeeOptions: SigneeInfo[]
): SignatureInstantJSON {
  if (signeeOptions.length === 0) {
    return metadata;
  }

  const signeeById = new Map(signeeOptions.map(signee => [signee.id, signee]));

  let hasChanges = false;

  // Process annotations and update signee data
  const updatedAnnotations = metadata.annotations.map(annotation => {
    const customData = annotation.customData as AnnotationData | undefined;
    const currentSignee = customData?.signee;
    const signeeId = currentSignee?.id;

    if (!signeeId) {
      return annotation;
    }

    const newSignee = signeeById.get(signeeId);
    if (!newSignee) {
      return annotation;
    }

    // Check if signee data actually changed
    if (isSigneeOrSignerEqual(currentSignee, newSignee)) {
      return annotation;
    }

    hasChanges = true;

    // Return new annotation with updated signee
    return {
      ...annotation,
      customData: {
        ...customData,
        signee: newSignee,
      },
    };
  });

  if (!hasChanges) {
    return metadata;
  }

  // Return completely new metadata object
  return {
    ...metadata,
    annotations: updatedAnnotations,
  };
}

function isIndividualEntity(
  entity: Partial<MinimalEntity>
): entity is Partial<IndividualMinimalEntity> {
  return entity.metaType === 'INDIVIDUAL';
}

export function getEntityName(
  entity: Partial<MinimalEntity>
): string | undefined {
  if (isIndividualEntity(entity)) {
    return [entity.firstName, entity.lastName]
      .filter(isNotNil)
      .map(str => str.trim())
      .join(' ');
  }
  return entity?.organizationName?.trim();
}

export function getEntityEmail(
  entity: Partial<MinimalEntity>
): string | undefined {
  if (isIndividualEntity(entity)) {
    return entity.email;
  }
  return entity.contact?.email;
}

export function getEntityPhoneNumber(
  entity: Partial<MinimalEntity>
): string | undefined {
  if (isIndividualEntity(entity)) {
    return entity.phone;
  }
  return entity.contact?.phone;
}

export const SIGNER_ROLE_PRIORITY: readonly RequestUserRoles[] = [
  RequestUserRoles.BORROWER,
  RequestUserRoles.CO_BORROWER,
  RequestUserRoles.GUARANTOR,
] as const;

/**
 * Maps customers to signers in annotations based on role matching.
 * Rules:
 * 1. Only assign a customer if its role is included in the signee's allowed roles
 * 2. Each signee is mapped to at most one signer, reused across all their annotations
 * 3. Priority order: BORROWER → CO_BORROWER → GUARANTOR
 */
export function mapCustomersToSigners(
  metadata: SignatureInstantJSON,
  customers: MinimalEntity[]
): SignatureInstantJSON {
  // Input validation
  if (!metadata) {
    throw new Error('Metadata is required');
  }

  if (!customers || customers.length === 0) {
    return structuredClone(metadata);
  }

  // Early return if no annotations to process
  if (!metadata.annotations?.length) {
    return structuredClone(metadata);
  }

  const priorityOrder: readonly RequestUserRoles[] = SIGNER_ROLE_PRIORITY;

  type CustomerWithRole = MinimalEntity & { role: RequestUserRoles };

  // Build customer lookup maps by role and id
  const customersByRoleMap = new Map<RequestUserRoles, CustomerWithRole[]>();
  const customersById = new Map<string, CustomerWithRole>();
  customers.forEach(customer => {
    if (!customer.role) return; // Skip customers without roles
    const customerWithRole = customer as CustomerWithRole;

    if (customerWithRole.id) {
      customersById.set(customerWithRole.id, customerWithRole);
    }

    const roleCustomers = customersByRoleMap.get(customerWithRole.role) || [];
    roleCustomers.push(customerWithRole);
    customersByRoleMap.set(customerWithRole.role, roleCustomers);
  });

  // Track used customers to avoid assigning the same signer to multiple signees
  const usedCustomerIds = new Set<string>();

  // Group annotations by signee id to ensure consistent signer assignment per signee
  const annotationsBySigneeId = new Map<
    string,
    {
      signee: SigneeInfo;
      annotations: SignatureInstantJSON['annotations'];
      existingSigners: Map<string, SignerInfo>;
    }
  >();

  metadata.annotations.forEach(annotation => {
    // customData may legitimately be missing (external PDF form widgets, or
    // v2 multi-widget plugins like checkbox/radio whose secondary option
    // widgets don't carry signee/signer). Treat as "no signee assignment".
    const customData = annotation.customData as AnnotationData | undefined;
    const signee = customData?.signee;
    const signeeId = signee?.id;

    if (!signeeId || !signee || !signee.roles || signee.roles.length === 0) {
      return;
    }

    const entry = annotationsBySigneeId.get(signeeId) ?? {
      signee,
      annotations: [],
      existingSigners: new Map<string, SignerInfo>(),
    };

    entry.annotations.push(annotation);

    const signer = customData?.signer;
    if (signer?.id) {
      entry.existingSigners.set(signer.id, signer);
    }

    annotationsBySigneeId.set(signeeId, entry);
  });

  // Determine signer assignment per signee based on priority
  const signerBySigneeId = new Map<string, SignerInfo>();

  const composeRolePriority = (roles: RequestUserRoles[]) => {
    const prioritized = priorityOrder.filter(role => roles.includes(role));
    const remaining = roles.filter(role => !priorityOrder.includes(role));
    return [...prioritized, ...remaining];
  };

  const buildSignerFromCustomer = (customer: CustomerWithRole): SignerInfo => ({
    id: customer.id ?? '',
    name: getEntityName(customer) ?? '',
    role: customer.role,
    email: getEntityEmail(customer) ?? '',
    phone: getEntityPhoneNumber(customer) ?? '',
    image: null,
    imageUrl: null,
  });

  annotationsBySigneeId.forEach(({ signee, existingSigners }, signeeId) => {
    const roles = signee.roles;
    const rolePriority = composeRolePriority(roles);

    const reuseExistingSigner = () => {
      for (const signer of existingSigners.values()) {
        const signerId = signer.id;
        if (!signerId || usedCustomerIds.has(signerId)) {
          continue;
        }

        const matchingCustomer = customersById.get(signerId);
        if (!matchingCustomer || !matchingCustomer.role) {
          continue;
        }

        if (!roles.includes(matchingCustomer.role)) {
          continue;
        }

        usedCustomerIds.add(signerId);
        return buildSignerFromCustomer(matchingCustomer);
      }

      return null;
    };

    const selectCustomerByPriority = () => {
      for (const role of rolePriority) {
        const customersForRole = customersByRoleMap.get(role) || [];
        const availableCustomer = customersForRole.find(customer => {
          const customerId = customer.id;
          return (
            typeof customerId === 'string' &&
            customerId.length > 0 &&
            !usedCustomerIds.has(customerId)
          );
        });

        if (availableCustomer?.id) {
          usedCustomerIds.add(availableCustomer.id);
          return buildSignerFromCustomer(availableCustomer);
        }
      }

      return null;
    };

    const assignedSigner = reuseExistingSigner() ?? selectCustomerByPriority();

    if (assignedSigner) {
      signerBySigneeId.set(signeeId, assignedSigner);
    }
  });

  let hasChanges = false;

  // Process each annotation and assign signers
  const updatedAnnotations = metadata.annotations.map(annotation => {
    const customData = annotation.customData as AnnotationData | undefined;
    const signeeId = customData?.signee?.id;

    if (!signeeId) {
      return annotation;
    }

    const assignedSigner = signerBySigneeId.get(signeeId);

    if (!assignedSigner) {
      return annotation;
    }

    const currentSigner = customData?.signer;
    if (currentSigner && isSigneeOrSignerEqual(currentSigner, assignedSigner)) {
      return annotation;
    }

    hasChanges = true;

    return {
      ...annotation,
      customData: {
        ...customData,
        signer: assignedSigner,
      },
    };
  });

  if (!hasChanges) {
    return metadata;
  }

  return {
    ...metadata,
    annotations: updatedAnnotations,
  };
}

/**
 * Processes annotations at request-creation time using three strategies:
 *
 * 1. **v2 optional-assignment** (e.g. date, `requiresAssignment: false`): always
 *    kept as-is. No signee or signer is required — the field is open for any user
 *    to fill at signing time.
 *
 * 2. **v2 required-assignment** (e.g. signature, initials, `requiresAssignment: true`)
 *    with no resolved signer: kept in the JSON but hidden via the PSPDFKit `noView`
 *    flag. The annotation and its form field are preserved so the JSON round-trips
 *    cleanly; the field is simply invisible in the signed request.
 *
 * 3. **v1 annotations** without a resolved signer: removed from the JSON (existing
 *    behavior, preserved for backward compatibility). Their form fields and
 *    form-field values are also pruned.
 *
 * Label TextAnnotations (`customData.kind === 'label'`) are always kept — they are
 * managed by the widget lifecycle and carry no signer of their own.
 *
 * @param metadata - The signature metadata to process
 * @returns Updated metadata
 */
export function removeAnnotationsWithoutSigners(
  metadata: SignatureInstantJSON
): SignatureInstantJSON {
  if (!metadata.annotations.length) {
    return metadata;
  }

  // v2 types that require a resolved signer at request-creation time.
  // Optional-assignment types (date, future additions) are intentionally absent.
  const REQUIRED_ASSIGNMENT_TYPES = new Set<string>(['signature', 'initials']);

  const processedAnnotations: SignatureInstantJSON['annotations'] = [];
  // Only tracks v1 annotations that were fully removed (not v2 hidden ones).
  const removedAnnotationIds = new Set<string>();

  metadata.annotations.forEach(annotation => {
    // customData may be missing on annotations that didn't originate from
    // this framework (external PDF form widgets, etc.). Treat them as opaque
    // — keep them in the output without further classification.
    const cd = annotation.customData as
      | Record<string, unknown>
      | undefined;
    if (!cd) {
      processedAnnotations.push(annotation);
      return;
    }

    // Label TextAnnotations: always keep — they're managed by widget lifecycle
    // and have no signer of their own.
    if (cd['kind'] === 'label' || cd['kind'] === 'option-label') {
      processedAnnotations.push(annotation);
      return;
    }

    // v2 widget: dispatch by requiresAssignment
    if (cd['schemaVersion'] === 2) {
      const type = cd['type'];
      const isRequiredAssignment =
        typeof type === 'string' && REQUIRED_ASSIGNMENT_TYPES.has(type);

      if (isRequiredAssignment) {
        const signer = cd['signer'] as { readonly id?: string } | null;
        if (signer?.id) {
          // Signer resolved: show normally.
          processedAnnotations.push(annotation);
        } else {
          // Required-assignment but no signer: hide with noView instead of removing.
          // Preserving the annotation and form field keeps the JSON round-trip clean.
          const existingFlags = annotation.flags ?? [];
          processedAnnotations.push({
            ...annotation,
            flags: [...existingFlags.filter(f => f !== 'noView'), 'noView'],
          });
        }
      } else {
        // Optional-assignment (date, future types): always show — no signer required.
        processedAnnotations.push(annotation);
      }
      return;
    }

    // v1 annotation: keep if signer resolved, remove entirely if not.
    if ((annotation.customData as AnnotationData | null)?.signer?.id) {
      processedAnnotations.push(annotation);
    } else {
      removedAnnotationIds.add(annotation.id);
    }
  });

  // Prune form fields that belong only to removed v1 annotations.
  // v2 hidden annotations keep their form fields — they're still in the JSON.
  const removedFormFieldNames = new Set<string>();
  const filteredFormFields: SignatureInstantJSON['formFields'] = [];

  metadata.formFields.forEach(formField => {
    if (formField.annotationIds.some(id => removedAnnotationIds.has(id))) {
      removedFormFieldNames.add(formField.name);
    } else {
      filteredFormFields.push(formField);
    }
  });

  const filteredFormFieldValues =
    metadata.formFieldValues?.filter(
      fieldValue => !removedFormFieldNames.has(fieldValue.name)
    ) ?? [];

  return {
    ...metadata,
    annotations: processedAnnotations,
    formFields: filteredFormFields,
    formFieldValues: filteredFormFieldValues,
  };
}

/**
 * Remaps signer IDs in annotation metadata using an ID lookup record.
 * Used to replace temporary frontend-generated IDs with real backend IDs
 * after entity creation in IAM.
 *
 * This handles non-template signature files where annotations have no signee
 * (created via the request-mode builder), which mapCustomersToSigners skips.
 */
export function remapSignerIdsInMetadata(
  metadata: SignatureInstantJSON,
  idRecord: Record<string, string>
): SignatureInstantJSON {
  if (
    !metadata?.annotations?.length ||
    !idRecord ||
    Object.keys(idRecord).length === 0
  ) {
    return metadata;
  }

  let hasChanges = false;

  const updatedAnnotations = metadata.annotations.map(annotation => {
    const customData = annotation.customData as AnnotationData | undefined;
    const signer = customData?.signer;

    if (!signer?.id) {
      return annotation;
    }

    const realId = idRecord[signer.id];
    if (!realId || realId === signer.id) {
      return annotation;
    }

    hasChanges = true;
    return {
      ...annotation,
      customData: {
        ...(customData ?? {}),
        signer: {
          ...signer,
          id: realId,
        },
      },
    };
  });

  if (!hasChanges) {
    return metadata;
  }

  return {
    ...metadata,
    annotations: updatedAnnotations,
  };
}
