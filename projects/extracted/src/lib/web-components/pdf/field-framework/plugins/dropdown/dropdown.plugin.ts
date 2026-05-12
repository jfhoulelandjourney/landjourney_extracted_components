import type {
  AnnotationsUnion,
  ComboBoxFormField,
  Instance,
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
 * via `resolveOptionValue`: `value > label > id`.
 */
export interface DropdownOption {
  readonly id: string;
  readonly label?: string;
  readonly value?: string;
  /**
   * Marks this option as the default selected value at field creation.
   * Single-select: at most one option should have `selected: true`. The
   * inspector enforces single-select on toggle.
   */
  readonly selected: boolean;
}

/** Resolves the emitted value for a dropdown option — value > label > id. */
export function resolveOptionValue(option: {
  value?: string;
  label?: string;
  id: string;
}): string {
  return option.value ?? option.label ?? option.id;
}

/**
 * Rebuild a `ComboBoxFormField`'s options + defaultValues from a dropdown
 * widget's `customData.options`. Used both at runtime (when the inspector
 * patches options) and at attach time (to repair PSPDFKit's PDF
 * serialization bug, which drops the last character of the last option in
 * the form field's saved options list).
 *
 * customData is preserved verbatim across save/load (it round-trips as JSON
 * in the widget's customData blob), so it's the source of truth. We
 * always reconstruct the form field's options from there.
 */
export async function syncDropdownFormFieldFromCustomData(
  instance: Instance,
  formFieldName: string,
  options: readonly DropdownOption[]
): Promise<void> {
  const PSPDFKit = await loadPSPDFKit();
  const formFields = await instance.getFormFields();
  const formField = formFields.find(f => f.name === formFieldName);
  if (
    !formField ||
    !(formField instanceof PSPDFKit.FormFields.ComboBoxFormField)
  ) {
    return;
  }
  const formOptions = options.map(
    opt =>
      new PSPDFKit.FormOption({
        label: opt.label ?? opt.value ?? opt.id,
        value: resolveOptionValue(opt),
      })
  );
  const defaultValues = options
    .filter(o => o.selected)
    .map(resolveOptionValue);
  const updatedFormField = formField
    .set('options', PSPDFKit.Immutable.List(formOptions))
    .set('defaultValues', PSPDFKit.Immutable.List(defaultValues));
  await instance.update(updatedFormField);
}

/**
 * Flat `customData` shape for a v2 dropdown widget.
 *
 * Stored directly on `WidgetAnnotation.customData`; no nested sub-objects.
 *
 * Backed by PSPDFKit's `ComboBoxFormField` (single-select, non-editable).
 * The native widget renders the chevron + popup; our overlay only adds the
 * type/role/required chrome above the widget.
 *
 * Optional-assignment field — `signee: null` is valid.
 *
 * Known Nutrient bug we work around: PSPDFKit's PDF serialization drops the
 * LAST character of the LAST option's label/value when a ChoiceFormField is
 * saved. customData (a separate JSON blob on the widget) round-trips
 * correctly. The bridge calls `syncDropdownFormFieldFromCustomData` on
 * attach to rebuild the form field options from customData, repairing the
 * corruption silently on every load. This is why the inspector edits go
 * through customData first; the form field is just a cached projection.
 */
export interface DropdownFieldData {
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  readonly type: 'dropdown';
  readonly label?: string;
  readonly fieldKey?: string;
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
  /**
   * The options the user can pick from. Stored on customData (not the form
   * field) so the inspector can read/write them via the standard
   * `FieldsService.update` patch flow. The plugin syncs these to the live
   * `ComboBoxFormField` when the field is created and on patch.
   */
  readonly options: readonly DropdownOption[];
  readonly groupId?: string;
}

const DEFAULTS: DropdownFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'dropdown',
  signee: null,
  signer: null,
  filled: false,
  filledByUser: false,
  readonly: false,
  required: false,
  options: [],
  placeholder: 'Select…',
};

export interface DropdownCreateResult {
  readonly widget: WidgetAnnotation;
  readonly formField: ComboBoxFormField;
  readonly label?: Serializers.TextAnnotationJSON;
  readonly annotationId: string;
  readonly formFieldName: string;
}

/**
 * Build the live PSPDFKit objects for one dropdown widget.
 *
 * Uses `ComboBoxFormField` with `edit: false, multiSelect: false` — a
 * classic non-editable single-select dropdown. PSPDFKit renders the chevron
 * and popup natively; we don't add focus/blur scripts (no formatting needed).
 *
 * Options + default selection live on `customData.options[]`. They're
 * mirrored to the form field's `options` / `defaultValues` at creation.
 * Subsequent inspector edits flow through `FieldsService.update`, which
 * detects dropdown option patches and rebuilds the live form field's
 * options list (see `syncDropdownOptions`). When a new "Default" option is
 * marked AND the field is currently empty, the default value is also pushed
 * via `setFormFieldValues` so the dropdown displays it immediately.
 */
export async function createDropdownField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<DropdownFieldData>;
}): Promise<DropdownCreateResult> {
  const { bbox, pageIndex } = input;

  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(
      `dropdown.createField: bbox.w must be positive (got ${bbox.w})`
    );
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(
      `dropdown.createField: bbox.h must be positive (got ${bbox.h})`
    );
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `dropdown-${PSPDFKit.generateInstantId()}`;
  const groupId = PSPDFKit.generateInstantId();

  const data: DropdownFieldData = input.data
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

  const formOptions = data.options.map(
    opt =>
      new PSPDFKit.FormOption({
        label: opt.label ?? opt.value ?? opt.id,
        value: resolveOptionValue(opt),
      })
  );
  const defaultValues = data.options
    .filter(o => o.selected)
    .map(resolveOptionValue);

  const formField = new PSPDFKit.FormFields.ComboBoxFormField({
    id: PSPDFKit.generateInstantId(),
    name: formFieldName,
    annotationIds: PSPDFKit.Immutable.List([annotationId]),
    options: PSPDFKit.Immutable.List(formOptions),
    defaultValues: PSPDFKit.Immutable.List(defaultValues),
    multiSelect: false,
    commitOnChange: true,
    edit: false,
    doNotSpellCheck: true,
  });

  let label: Serializers.TextAnnotationJSON | undefined;
  if (data.label) {
    label = makeLabelAnnotation({
      id: PSPDFKit.generateInstantId(),
      pageIndex,
      widgetBbox: bbox,
      text: data.label,
      groupId,
      fieldType: 'dropdown',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

/**
 * Optional plugin hook the framework calls AFTER `instance.update(widget)` runs
 * for any v2 customData patch. Lets a plugin keep PSPDFKit primitives in sync
 * with customData mutations that the generic patch path can't handle on its
 * own (here: rebuilding the live `ComboBoxFormField` options when the
 * inspector edits `customData.options`).
 *
 * Without this, the inspector shows the new options but PSPDFKit's native
 * dropdown popup stays at its initial (empty) options list — "No results
 * found".
 *
 * UX touch: when a new "Default" option is marked AND the field is currently
 * empty, push the default value via `setFormFieldValues` so the dropdown
 * displays it immediately. Skipped when the field already has a value
 * (that belongs to the user, not the template).
 */
export async function onDropdownPatch(input: {
  readonly instance: Instance;
  readonly annotation: AnnotationsUnion;
  readonly patch: Partial<DropdownFieldData>;
  readonly nextCustomData: DropdownFieldData;
}): Promise<void> {
  const { instance, annotation, patch, nextCustomData } = input;
  if (!('options' in patch)) return;
  if (!('formFieldName' in annotation)) return;
  const formFieldName = annotation.formFieldName;
  if (typeof formFieldName !== 'string') return;

  const PSPDFKit = await loadPSPDFKit();
  const formFields = await instance.getFormFields();
  const formField = formFields.find(f => f.name === formFieldName);
  if (
    !formField ||
    !(formField instanceof PSPDFKit.FormFields.ComboBoxFormField)
  ) {
    return;
  }

  const options = nextCustomData.options ?? [];
  const formOptions = options.map(
    opt =>
      new PSPDFKit.FormOption({
        label: opt.label ?? opt.value ?? opt.id,
        value: resolveOptionValue(opt),
      })
  );
  const defaultValues = options
    .filter(o => o.selected)
    .map(resolveOptionValue);

  const updatedFormField = formField
    .set('options', PSPDFKit.Immutable.List(formOptions))
    .set('defaultValues', PSPDFKit.Immutable.List(defaultValues));

  await instance.update(updatedFormField);

  const currentValues = instance.getFormFieldValues();
  const current = currentValues[formFieldName];
  const isEmpty =
    current === null ||
    current === undefined ||
    (typeof current === 'string' && current === '') ||
    (Array.isArray(current) && current.length === 0);
  const firstDefault = defaultValues[0];
  if (isEmpty && firstDefault !== undefined) {
    await instance.setFormFieldValues({ [formFieldName]: firstDefault });
  }
}

export const dropdownPlugin = {
  type: 'dropdown' as const,
  label: 'Dropdown',
  size: { width: 200, height: 30 },
  defaults: DEFAULTS,
  requiresAssignment: false,
  createField: createDropdownField,
  onPatch: onDropdownPatch,
  // Intentionally no `formatValueForDisplay` — dropdowns store the picked
  // option's value verbatim; no parse/format pass needed.
} as const;

export type DropdownPlugin = typeof dropdownPlugin;
