import type {
  CheckBoxFormField,
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
 * Identity is the immutable `id` (so reordering / editing label / value
 * doesn't drop user-selected state). The emitted form-field value resolves
 * via `resolveCheckboxOptionValue`: `value > label > id`.
 */
export interface CheckboxOption {
  readonly id: string;
  readonly label?: string;
  readonly value?: string;
  /**
   * Default-checked at field creation. Multiple options may be checked
   * simultaneously — checkbox is multi-select by nature.
   */
  readonly checked: boolean;
}

/** Resolves the emitted value for a checkbox option — value > label > id. */
export function resolveCheckboxOptionValue(option: {
  value?: string;
  label?: string;
  id: string;
}): string {
  return option.value ?? option.label ?? option.id;
}

/**
 * Flat `customData` shape for a v2 checkbox widget.
 *
 * Stored on EVERY widget in the group (primary + secondaries). Secondaries
 * additionally carry `optionIndex: number`. This redundancy keeps the bridge
 * + inspector lookups simple — every widget in the group answers
 * `getAnnotationById` with the full options list.
 *
 * Backed by PSPDFKit's `CheckBoxFormField` with N WidgetAnnotations sharing
 * one `formFieldName`. Optional-assignment field — `signee: null` is valid.
 */
export interface CheckboxFieldData {
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  readonly type: 'checkbox';
  readonly label?: string;
  readonly fieldKey?: string;
  /**
   * Unused at render time (the native checkbox widget doesn't display a
   * placeholder). Kept on the customData shape so the V2FieldData union
   * stays homogeneous with text-style fields whose inspectors read
   * `data()?.placeholder` directly.
   */
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
  /** The options the user can pick from. Drives the rebuilt widget grid. */
  readonly options: readonly CheckboxOption[];
  /** Shared groupId across primary widget, secondaries, field label, and option labels. */
  readonly groupId?: string;
  /**
   * Position of THIS widget within the option group (0..N-1). Undefined on
   * the placeholder widget emitted when `options.length === 0`.
   */
  readonly optionIndex?: number;
}

const DEFAULTS: CheckboxFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'checkbox',
  signee: null,
  signer: null,
  filled: false,
  filledByUser: false,
  readonly: false,
  required: false,
  options: [],
};

export interface CheckboxCreateResult {
  readonly widget: WidgetAnnotation;
  readonly formField: CheckBoxFormField;
  readonly label?: Serializers.TextAnnotationJSON;
  readonly annotationId: string;
  readonly formFieldName: string;
}

/**
 * Builder-mode field creation: emits a SINGLE placeholder WidgetAnnotation
 * filling the dropped bbox, plus a `CheckBoxFormField` carrying the option
 * configuration as metadata. No per-option widgets are created here.
 *
 * This deliberately deviates from a "live native rendering" model: per-
 * option native checkbox widgets are NOT created during template editing.
 * Reasons:
 *  - Inspector edits patch customData repeatedly (every keystroke). A
 *    destructive rebuild on each patch would flicker the field, drop the
 *    inspector's selection target, and steal focus mid-typing.
 *  - The native widget visual sizing changes (full-bbox placeholder vs.
 *    14×14 option boxes) created jarring "big square → small square"
 *    transitions when the first option was added.
 *
 * Materialization to N native widgets + per-option labels happens later,
 * when the template is converted to a fill-able request. See
 * `materializeCheckboxField` (TODO) for the fill-time path.
 *
 * The CheckBoxFormField is still attached to the placeholder widget
 * because PSPDFKit asserts `options.length === widgets.length` for
 * checkbox form fields. We satisfy that with a single empty FormOption
 * matching the single placeholder widget.
 */
export async function createCheckboxField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<CheckboxFieldData>;
}): Promise<CheckboxCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `checkbox.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `checkbox.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `checkbox-${PSPDFKit.generateInstantId()}`;
  const groupId = input.data?.groupId ?? PSPDFKit.generateInstantId();

  const data: CheckboxFieldData = input.data
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

  // Single placeholder widget → single FormOption to satisfy PSPDFKit's
  // widgets.length === options.length assertion. The real options live on
  // `customData.options` and drive materialization at fill time.
  const formField = new PSPDFKit.FormFields.CheckBoxFormField({
    id: PSPDFKit.generateInstantId(),
    name: formFieldName,
    annotationIds: PSPDFKit.Immutable.List([annotationId]),
    options: PSPDFKit.Immutable.List([
      new PSPDFKit.FormOption({ label: '', value: '' }),
    ]),
    defaultValues: PSPDFKit.Immutable.List<string>([]),
  });

  let label: Serializers.TextAnnotationJSON | undefined;
  if (data.label) {
    label = makeLabelAnnotation({
      id: PSPDFKit.generateInstantId(),
      pageIndex,
      widgetBbox: bbox,
      text: data.label,
      groupId,
      fieldType: 'checkbox',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

export const checkboxPlugin = {
  type: 'checkbox' as const,
  label: 'Checkbox',
  size: { width: 200, height: 90 },
  defaults: DEFAULTS,
  requiresAssignment: false,
  createField: createCheckboxField,
  // Intentionally no `onPatch`: customData edits flow through the standard
  // FieldsService.update path and patch the placeholder widget's
  // customData in place. Per-option native widgets are created at
  // materialization time (fill mode), not on every keystroke.
} as const;

export type CheckboxPlugin = typeof checkboxPlugin;
