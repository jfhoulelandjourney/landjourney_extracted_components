import type {
  Serializers,
  TextFormField,
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
 * AcroForm date format script executed inside PSPDFKit's Duktape sandbox.
 *
 * `Intl.DateTimeFormat` is NOT available in Duktape — use the AcroForm
 * helper `AFDate_FormatEx` which PSPDFKit registers globally inside the sandbox.
 */
const DATE_FORMAT_SCRIPT = 'AFDate_FormatEx("mm/dd/yyyy");';

/**
 * Flat `customData` shape for a v2 date widget.
 *
 * Stored directly on `WidgetAnnotation.customData`; no nested sub-objects.
 *
 * Unlike signature and initials, date is an **optional-assignment** field:
 * `signee: null` is valid in template-builder mode and does NOT trigger the
 * orphan indicator. The field simply accepts any signer's date input.
 */
export interface DateFieldData {
  /** Discriminates v2 from v1 customData. Always `2` for v2 fields. */
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  /** Field-type literal. Always `'date'` for this plugin. */
  readonly type: 'date';
  /** Human-readable label for the field (optional). */
  readonly label?: string;
  /** User-facing key for external-system integrations. Distinct from PSPDFKit's `formFieldName`. */
  readonly fieldKey?: string;
  /** Hint text shown inside the widget when no value has been entered. */
  readonly placeholder?: string;
  /**
   * Optional template-time signee assignment.
   * Null is valid for date fields — no signee required.
   *
   * `roles` is mutable to align with v1's `SigneeInfo.roles: RequestUserRoles[]`
   * — avoids variance casts at the v1-interop boundary.
   * Defensive copy at every patch site keeps stored values effectively immutable.
   */
  readonly signee: {
    readonly id: string;
    readonly name: string;
    readonly roles: RequestUserRoles[];
  } | null;
  /**
   * Resolved actual filler. Populated at fill time from the user system.
   * `null` when no filler is yet known (template / unfilled).
   */
  readonly signer: SignerInfo | null;
  /** True when the field has any value (prefill OR user-driven). */
  readonly filled: boolean;
  /** True when the user has actually interacted with the field. */
  readonly filledByUser: boolean;
  /** Whether the field is uneditable. */
  readonly readonly: boolean;
  /**
   * Whether filling this field is mandatory before submit.
   * Defaults `true` — date fields are typically required to evidence when a
   * document was filled. Inspector lets the user opt out.
   */
  readonly required?: boolean;
  /** UUID linking widget + label TextAnnotation (for move/delete glue). */
  readonly groupId?: string;
}

/**
 * Default `customData` for a freshly-created date field.
 * `required` defaults `true` — date fields evidence when the document was
 * filled and are typically expected to be present.
 */
const DEFAULTS: DateFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'date',
  signee: null,
  signer: null,
  filled: false,
  filledByUser: false,
  readonly: false,
  required: true,
};

/**
 * Output of the plugin's `createField` — the live PSPDFKit objects ready to
 * pass to `instance.create([...])`, plus the SDK-internal names callers need
 * to drive `setFormFieldValues`.
 */
export interface DateCreateResult {
  /** Live `WidgetAnnotation` to be passed to `instance.create`. */
  readonly widget: WidgetAnnotation;
  /** Live `TextFormField` to be passed to `instance.create`. */
  readonly formField: TextFormField;
  /** Optional label TextAnnotation (when label is non-empty). */
  readonly label?: Serializers.TextAnnotationJSON;
  /** PSPDFKit annotation id of the widget. */
  readonly annotationId: string;
  /** PSPDFKit form-field name (e.g. `date-<uuid>`). */
  readonly formFieldName: string;
}

/**
 * Build the live PSPDFKit objects for one date widget.
 *
 * Uses `TextFormField` (not `SignatureFormField`) with an `onFormat`
 * JavaScriptAction that applies `AFDate_FormatEx("mm/dd/yyyy")` inside
 * PSPDFKit's Duktape sandbox. No `onPress` is needed — PSPDFKit's native
 * text-field click behaviour (open keyboard / input) works without
 * intervention, unlike signature fields which require explicit
 * `InteractionMode.SIGNATURE` activation.
 *
 * @param input.bbox      - Position + size in PDF page space
 * @param input.pageIndex - Zero-based page index
 * @param input.data      - Optional partial overrides (signee, label, etc.)
 */
export async function createDateField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<DateFieldData>;
}): Promise<DateCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `date.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `date.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `date-${PSPDFKit.generateInstantId()}`;
  const groupId = PSPDFKit.generateInstantId();

  const data: DateFieldData = input.data
    ? Object.assign({}, DEFAULTS, input.data, { groupId })
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
    additionalActions: {
      onFormat: new PSPDFKit.Actions.JavaScriptAction({
        script: DATE_FORMAT_SCRIPT,
      }),
    },
  });

  // TextFormField: the native PSPDFKit text input, rendered inside the widget
  // bounding box. No `readOnly` flag set here — the framework enforces
  // readonly via `customData.readonly` and the overlay lock icon.
  const formField = new PSPDFKit.FormFields.TextFormField({
    id: PSPDFKit.generateInstantId(),
    name: formFieldName,
    annotationIds: PSPDFKit.Immutable.List([annotationId]),
  });

  let label: Serializers.TextAnnotationJSON | undefined;
  if (data.label) {
    label = makeLabelAnnotation({
      id: PSPDFKit.generateInstantId(),
      pageIndex,
      widgetBbox: bbox,
      text: data.label,
      groupId,
      fieldType: 'date',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

/**
 * Public plugin object for the date field type.
 *
 * No `onPress` is defined: PSPDFKit's native text-field click handler
 * (open the OS keyboard / in-page input) works correctly for TextFormField
 * even when `setCustomRenderers` is registered. Only SignatureFormField
 * requires the explicit `InteractionMode.SIGNATURE` override.
 *
 * The `required` default is `true` — date fields evidence document
 * completion; the inspector lets the user opt out when not needed.
 */
export const datePlugin = {
  type: 'date' as const,
  label: 'Date',
  size: { width: 120, height: 30 },
  defaults: DEFAULTS,
  requiresAssignment: false,
  createField: createDateField,
} as const;

export type DatePlugin = typeof datePlugin;
