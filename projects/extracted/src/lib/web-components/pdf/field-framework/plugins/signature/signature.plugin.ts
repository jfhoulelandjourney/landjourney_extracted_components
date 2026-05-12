import type {
  Instance,
  Serializers,
  SignatureFormField,
  WidgetAnnotation,
} from '@nutrient-sdk/viewer';
import type { RequestUserRoles } from '../../../../../models/requestModels';
import { PDF_VIEWER_LOCALES } from '../../../../documents/pdf-viewer/pdf-viewer.locales';
import { loadPSPDFKit } from '../../../../documents/pdf-viewer/pspdfkit-loader';
import { makeLabelAnnotation } from '../../api/label';
import type { Bbox } from '../../api/types';
import { FIELD_DATA_SCHEMA_VERSION } from '../../constants';
import type { SignerInfo } from '../../types/field-data';
export type { Bbox };

/**
 * Flat `customData` shape for a v2 signature widget.
 *
 * Stored directly on `WidgetAnnotation.customData`; no nested sub-objects.
 */
export interface SignatureFieldData {
  /** Discriminates v2 from v1 customData. Always `2` for v2 fields. */
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  /** Field-type literal. Always `'signature'` for this plugin. */
  readonly type: 'signature';
  /** Human-readable label for the field (optional). */
  readonly label?: string;
  /** User-facing key for external-system integrations. Distinct from PSPDFKit's `formFieldName`. */
  readonly fieldKey?: string;
  /** Hint text shown inside the widget when no value has been entered. */
  readonly placeholder?: string;
  /**
   * Template-time signee assignment. Null for fields dropped directly in
   * request mode (no template signee — `signer` is set directly instead),
   * or for orphaned fields after the user deletes a signee that had fields.
   *
   * `roles` is mutable to align with v1's `SigneeInfo.roles: RequestUserRoles[]`
   * — avoids variance casts at the v1-interop boundary (e.g. mapCustomersToSigners).
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
  /** Whether filling this field is mandatory before submit. */
  readonly required?: boolean;
  /** UUID linking widget + label TextAnnotation (for move/delete glue). */
  readonly groupId?: string;
}

/**
 * Default `customData` for a freshly-created signature field.
 * `signer` is unset until fill time.
 */
const DEFAULTS: SignatureFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'signature',
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
export interface SignatureCreateResult {
  /** Live `WidgetAnnotation` to be passed to `instance.create`. */
  readonly widget: WidgetAnnotation;
  /** Live `SignatureFormField` to be passed to `instance.create`. */
  readonly formField: SignatureFormField;
  /** Optional label TextAnnotation (when label is non-empty). */
  readonly label?: Serializers.TextAnnotationJSON;
  /** PSPDFKit annotation id of the widget. */
  readonly annotationId: string;
  /** PSPDFKit form-field name (e.g. `signature-<uuid>`). */
  readonly formFieldName: string;
}

/**
 * Build the live PSPDFKit objects for one signature widget.
 *
 * Live-constructor approach mirrors v1's `AnnotationFactoryService` rather
 * than the InstantJSON pipeline; the latter pays off when pure-JSON mode
 * (template generation without a viewer) becomes a concrete need.
 *
 * @param input.bbox      - Position + size in PDF page space
 * @param input.pageIndex - Zero-based page index
 * @param input.data      - Optional partial overrides (signeeRoles, etc.)
 */
export async function createSignatureField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<SignatureFieldData>;
}): Promise<SignatureCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `signature.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `signature.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `signature-${PSPDFKit.generateInstantId()}`;
  const groupId = PSPDFKit.generateInstantId();

  const data: SignatureFieldData = input.data
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
  });

  // `readOnly` is intentionally omitted: setting it on the FormField makes
  // PSPDFKit suppress the native signature placeholder. The framework
  // enforces readonly itself via `onSignaturePress`.
  const formField = new PSPDFKit.FormFields.SignatureFormField({
    id: PSPDFKit.generateInstantId(),
    name: formFieldName,
    annotationIds: PSPDFKit.Immutable.List([annotationId]),
  });

  // Create label annotation if label is non-empty
  let label: Serializers.TextAnnotationJSON | undefined;
  if (data.label) {
    label = makeLabelAnnotation({
      id: PSPDFKit.generateInstantId(),
      pageIndex,
      widgetBbox: bbox,
      text: data.label,
      groupId,
      fieldType: 'signature',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

/**
 * Press-handler for signature widgets.
 *
 * PSPDFKit does NOT auto-trigger `InteractionMode.SIGNATURE` once a custom
 * renderer is registered via `setCustomRenderers`. The bridge wires this hook
 * into `annotations.press` to keep the modal opening on click.
 *
 * The bridge gates this call against the host-supplied authorization
 * callback before invoking it, so by the time the plugin runs the user is
 * already known to be allowed. Plugin-level concerns are limited to the
 * field-specific state (`readonly` here).
 *
 * The plugin is responsible for customizing the signature modal's wording
 * to say "Signature" instead of "Initials" — a field-type-specific concern
 * that belongs in the plugin, not in the fill directive.
 */
export function onSignaturePress(
  instance: Instance,
  annotation: WidgetAnnotation
): void {
  // Framework-level readonly enforcement: PSPDFKit's native readOnly flags
  // are intentionally NOT set (they hide the placeholder), so the press
  // handler is the only gate that prevents opening the signing modal.
  const cd = annotation.customData as
    | Pick<SignatureFieldData, 'readonly'>
    | undefined;
  if (cd?.readonly === true) {
    return;
  }
  void loadPSPDFKit().then(PSPDFKit => {
    // Ensure modal uses signature wording ("Add Signature" not "Add Initials").
    // Necessary when switching from an initials field to a signature field.
    instance.setLocale(PDF_VIEWER_LOCALES.BASE);

    instance.setViewState(vs =>
      vs.set('interactionMode', PSPDFKit.InteractionMode.SIGNATURE)
    );
  });
}

/**
 * Public plugin object for the signature field type.
 *
 * The bridge uses `type` for runtime dispatch via `customData.type`.
 * `FieldsService.create` calls `createField`. The bridge invokes
 * `onPress` from its `annotations.press` listener.
 *
 * Step 39+ promotes this to a generic `FieldPlugin<K>` registered in a
 * central `PLUGINS` map; until then a single export is enough.
 *
 * Icon strategy: the step-1 overlay is a hard-coded inline SVG (signature
 * pen) because Material Icons fonts don't reach inside the PSPDFKit iframe
 * + ShadowDom encapsulation. Once a second plugin lands we'll need a
 * shared per-plugin icon path (likely an SVG path string on each plugin,
 * rendered by the overlay) — re-evaluate when initials/date arrive.
 */
export const signaturePlugin = {
  type: 'signature' as const,
  label: 'Signature',
  size: { width: 200, height: 30 },
  defaults: DEFAULTS,
  requiresAssignment: true,
  createField: createSignatureField,
  onPress: onSignaturePress,
} as const;

export type SignaturePlugin = typeof signaturePlugin;
