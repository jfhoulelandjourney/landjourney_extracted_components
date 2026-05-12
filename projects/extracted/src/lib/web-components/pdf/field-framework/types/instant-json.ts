import type { InstantJSON } from '@nutrient-sdk/viewer';
import type { SignedBy } from './field-data';

/**
 * Common shape for every InstantJSON form-field entry. PSPDFKit-defined.
 */
interface BaseFormField {
  readonly annotationIds: string[];
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly pdfObjectId: number;
  readonly v: number;
}

export interface TextFormField extends BaseFormField {
  readonly type: 'pspdfkit/form-field/text';
  readonly comb: boolean;
  readonly defaultValue: string;
  readonly doNotScroll: boolean;
  readonly doNotSpellCheck: boolean;
  readonly multiLine: boolean;
  readonly password: boolean;
  readonly richText: boolean;
}

export interface CheckboxFormField extends BaseFormField {
  readonly type: 'pspdfkit/form-field/checkbox';
  readonly defaultValue: string;
  readonly options: ReadonlyArray<{ label: string; value: string }>;
}

export interface RadioFormField extends BaseFormField {
  readonly type: 'pspdfkit/form-field/radio';
  readonly defaultValue: string;
  readonly options: ReadonlyArray<{ label: string; value: string }>;
  readonly noToggleToOff: boolean;
}

export interface ComboBoxFormField extends BaseFormField {
  readonly type: 'pspdfkit/form-field/comboBox';
  readonly defaultValue: string;
  readonly options: ReadonlyArray<{ label: string; value: string }>;
  readonly edit: boolean;
}

export interface ListBoxFormField extends BaseFormField {
  readonly type: 'pspdfkit/form-field/listBox';
  readonly defaultValue: string;
  readonly options: ReadonlyArray<{ label: string; value: string }>;
}

export interface SignatureFormField extends BaseFormField {
  readonly type: 'pspdfkit/form-field/signature';
}

export type FormFieldEntry =
  | TextFormField
  | CheckboxFormField
  | RadioFormField
  | ComboBoxFormField
  | ListBoxFormField
  | SignatureFormField;

/**
 * Signature-specific subset of PSPDFKit's `InstantJSON` blob, persisted at
 * `FileMetadata.fileMetadata.signatureTask`. Carries widget annotations,
 * their backing form fields, current form-field values, and an audit list
 * of signers who have already confirmed.
 *
 * Note on `customData`: typed as `unknown` because annotations may carry v1
 * (`AnnotationData`) or v2 (`V2FieldData`) shapes during the migration window.
 * Callers narrow via `isV1Custom` / `isV2Custom` (or cast to a v1 type at sites
 * that pre-date the v2 split). After Step 38 (v1 sunset), this can narrow to
 * v2-only.
 */
export interface SignatureInstantJSON extends Pick<
  InstantJSON,
  'pdfId' | 'format'
> {
  schemaVersion?: number;
  annotations: Array<{
    bbox: [number, number, number, number];
    createdAt: string;
    creatorName: string;
    customData: unknown;
    /** PSPDFKit annotation flags. `noView` hides the annotation in the viewer without removing it from the JSON. */
    flags?: readonly string[];
    formFieldName: string;
    id: string;
    name: string;
    pageIndex: number;
    type: 'pspdfkit/widget';
    updatedAt: string;
    v: number;
  }>;
  formFieldValues: Array<{
    name: string;
    type: 'pspdfkit/form-field-value';
    v: number;
    value: string;
  }>;
  formFields: FormFieldEntry[];
  signedBy?: SignedBy[];
}
