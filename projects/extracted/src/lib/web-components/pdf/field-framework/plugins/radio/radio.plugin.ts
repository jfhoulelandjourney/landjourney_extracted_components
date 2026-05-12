import type {
  RadioButtonFormField,
  Serializers,
  WidgetAnnotation,
} from '@nutrient-sdk/viewer';
import type { RequestUserRoles } from '../../../../../models/requestModels';
import { loadPSPDFKit } from '../../../../documents/pdf-viewer/pspdfkit-loader';
import { makeLabelAnnotation } from '../../api/label';
import type { Bbox } from '../../api/types';
import { FIELD_DATA_SCHEMA_VERSION } from '../../constants';
import type { SignerInfo } from '../../types/field-data';
export type { Bbox };

/**
 * Single option entry stored in `customData.options`.
 *
 * Identity is the immutable `id`. The emitted form-field value resolves via
 * `resolveRadioOptionValue`: `value > label > id`.
 *
 * Single-select: at most one option may carry `selected: true` at any time
 * (the inspector enforces this).
 */
export interface RadioOption {
  readonly id: string;
  readonly label?: string;
  readonly value?: string;
  /** Default-selected at field creation. At most one option should be true. */
  readonly selected: boolean;
}

/** Resolves the emitted value for a radio option — value > label > id. */
export function resolveRadioOptionValue(option: {
  value?: string;
  label?: string;
  id: string;
}): string {
  return option.value ?? option.label ?? option.id;
}

/**
 * Flat `customData` shape for a v2 radio widget.
 *
 * Same structure as checkbox, with two PDF-spec differences in the form
 * field: `defaultValue` (singular) and `noToggleToOff: false` so the user
 * can deselect the picked radio by clicking it again.
 */
export interface RadioFieldData {
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  readonly type: 'radio';
  readonly label?: string;
  readonly fieldKey?: string;
  /** See `CheckboxFieldData.placeholder` — kept solely for union homogeneity. */
  readonly placeholder?: string;
  readonly signee: {
    readonly id: string;
    readonly name: string;
    readonly roles: RequestUserRoles[];
  } | null;
  readonly signer: SignerInfo | null;
  readonly filled: boolean;
  readonly filledByUser: boolean;
  readonly readonly: boolean;
  readonly required?: boolean;
  readonly options: readonly RadioOption[];
  readonly groupId?: string;
  readonly optionIndex?: number;
}

const DEFAULTS: RadioFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'radio',
  signee: null,
  signer: null,
  filled: false,
  filledByUser: false,
  readonly: false,
  required: false,
  options: [],
};

export interface RadioCreateResult {
  readonly widget: WidgetAnnotation;
  readonly formField: RadioButtonFormField;
  readonly label?: Serializers.TextAnnotationJSON;
  readonly annotationId: string;
  readonly formFieldName: string;
}

/**
 * Builder-mode field creation: emits a single placeholder widget at the
 * dropped bbox and a `RadioButtonFormField` carrying the option config as
 * metadata. Per-option native widgets are NOT created here — they are
 * deferred to fill-time materialization. See `createCheckboxField` for the
 * rationale (avoid keystroke-driven destructive rebuilds and the visual
 * "big square → small square" jump when the first option is added).
 */
export async function createRadioField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<RadioFieldData>;
}): Promise<RadioCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `radio.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `radio.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `radio-${PSPDFKit.generateInstantId()}`;
  const groupId = input.data?.groupId ?? PSPDFKit.generateInstantId();

  const data: RadioFieldData = input.data
    ? { ...DEFAULTS, ...input.data, groupId }
    : { ...DEFAULTS, groupId };

  const widget = new PSPDFKit.Annotations.WidgetAnnotation({
    id: annotationId,
    pageIndex,
    boundingBox: new PSPDFKit.Geometry.Rect({
      left: bbox.x,
      top: bbox.y,
      width: bbox.w,
      height: bbox.h,
    }),
    formFieldName,
    customData: { ...data },
    backgroundColor: PSPDFKit.Color.TRANSPARENT,
    borderColor: PSPDFKit.Color.TRANSPARENT,
  });

  // PSPDFKit's RadioButtonFormField type does not list every constructor
  // option in the public surface; the cast keeps `noToggleToOff` /
  // `radiosInUnison` writable at construct time.
  // Single placeholder widget → single FormOption (PSPDFKit asserts
  // widgets.length === options.length). Real options live on customData.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formField = new (PSPDFKit.FormFields.RadioButtonFormField as any)({
    id: PSPDFKit.generateInstantId(),
    name: formFieldName,
    annotationIds: PSPDFKit.Immutable.List([annotationId]),
    options: PSPDFKit.Immutable.List([
      new PSPDFKit.FormOption({ label: '', value: '' }),
    ]),
    defaultValue: '',
    noToggleToOff: false,
    radiosInUnison: false,
  });

  let label: Serializers.TextAnnotationJSON | undefined;
  if (data.label) {
    label = makeLabelAnnotation({
      id: PSPDFKit.generateInstantId(),
      pageIndex,
      widgetBbox: bbox,
      text: data.label,
      groupId,
      fieldType: 'radio',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

export const radioPlugin = {
  type: 'radio' as const,
  label: 'Radio',
  size: { width: 200, height: 90 },
  defaults: DEFAULTS,
  requiresAssignment: false,
  createField: createRadioField,
  // No `onPatch`: see checkbox.plugin.ts. CustomData edits flow through the
  // standard FieldsService.update path; option widgets are produced at
  // fill-time materialization, not on every keystroke.
} as const;

export type RadioPlugin = typeof radioPlugin;
