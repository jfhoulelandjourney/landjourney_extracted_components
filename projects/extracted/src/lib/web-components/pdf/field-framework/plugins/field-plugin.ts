import type {
  AnnotationsUnion,
  CheckBoxFormField,
  ComboBoxFormField,
  Instance,
  RadioButtonFormField,
  Serializers,
  SignatureFormField,
  TextFormField,
  WidgetAnnotation,
} from '@nutrient-sdk/viewer';
import type { Bbox } from '../api/types';
import { FIELD_DATA_SCHEMA_VERSION } from '../constants';
import { checkboxPlugin } from './checkbox/checkbox.plugin';
import { currencyPlugin } from './currency/currency.plugin';
import { datePlugin } from './date/date.plugin';
import { dropdownPlugin } from './dropdown/dropdown.plugin';
import { initialsPlugin } from './initials/initials.plugin';
import { namePlugin } from './name/name.plugin';
import { numberPlugin } from './number/number.plugin';
import { radioPlugin } from './radio/radio.plugin';
import { signaturePlugin } from './signature/signature.plugin';
import { textInputPlugin } from './text-input/text-input.plugin';
import { textareaPlugin } from './textarea/textarea.plugin';

export interface FieldCreateResult {
  /** Primary widget. Equals the only widget for single-widget plugins. */
  readonly widget: WidgetAnnotation;
  /**
   * Additional option widgets for multi-widget plugins (checkbox/radio), in
   * `optionIndex` order. Undefined for single-widget plugins.
   */
  readonly extraWidgets?: readonly WidgetAnnotation[];
  /**
   * SignatureFormField for signature/initials; TextFormField for date / text /
   * number / currency; ComboBoxFormField for dropdown; CheckBoxFormField /
   * RadioButtonFormField for the multi-widget plugins.
   */
  readonly formField:
    | SignatureFormField
    | TextFormField
    | ComboBoxFormField
    | CheckBoxFormField
    | RadioButtonFormField;
  readonly label?: Serializers.TextAnnotationJSON;
  /**
   * Per-option text annotations, one per option. Undefined for single-widget
   * plugins. Order matches `extraWidgets` (index = `optionIndex`).
   */
  readonly optionLabels?: readonly Serializers.TextAnnotationJSON[];
  readonly annotationId: string;
  readonly formFieldName: string;
}

export interface FieldPlugin<K extends string, D extends { readonly type: K }> {
  readonly type: K;
  readonly label: string;
  readonly size: { readonly width: number; readonly height: number };
  readonly defaults: D;
  /** Whether person assignment is mandatory in both template-builder (signee) and request-builder (signer) modes. False for types like date where unassigned is valid. */
  readonly requiresAssignment: boolean;
  createField(input: {
    readonly bbox: Bbox;
    readonly pageIndex: number;
    readonly data?: Partial<D>;
  }): Promise<FieldCreateResult>;
  /**
   * Optional click-time hook. Bridge calls it on `annotations.press` for
   * any v2 widget whose plugin defines this.
   *
   * Required for signature/initials (PSPDFKit's native `InteractionMode.SIGNATURE`
   * trigger breaks once a custom renderer is registered). Not needed for
   * TextFormField-based types (date, text-input, etc.) whose native click
   * behaviour works without intervention.
   */
  onPress?(instance: Instance, annotation: WidgetAnnotation): void;
  /**
   * Optional patch-time hook. Called by `FieldsService.update` AFTER merging
   * the patch into customData so the plugin can keep PSPDFKit primitives in
   * sync (e.g. dropdown rebuilds the live ComboBoxFormField options;
   * checkbox/radio rebuild N option widgets when the options array changes).
   */
  onPatch?(input: {
    readonly instance: Instance;
    readonly annotation: AnnotationsUnion;
    readonly patch: Partial<D>;
    readonly nextCustomData: D;
  }): Promise<void>;
}

export const FIELD_PLUGINS = {
  signature: signaturePlugin,
  initials: initialsPlugin,
  date: datePlugin,
  name: namePlugin,
  number: numberPlugin,
  currency: currencyPlugin,
  dropdown: dropdownPlugin,
  'text-input': textInputPlugin,
  textarea: textareaPlugin,
  checkbox: checkboxPlugin,
  radio: radioPlugin,
} as const;

export type RegisteredFieldType = keyof typeof FIELD_PLUGINS;

export type V2FieldData =
  (typeof FIELD_PLUGINS)[RegisteredFieldType]['defaults'];

/** Returns true if `type` is a key in the FIELD_PLUGINS registry. */
export function isRegisteredFieldType(
  type: unknown
): type is RegisteredFieldType {
  return typeof type === 'string' && type in FIELD_PLUGINS;
}

/**
 * Returns true if a v2 field's customData is unassigned in template-builder
 * (signees) mode and the field type requires assignment.
 *
 * Date and other optional-assignment types always return false — `signee: null`
 * is intentional for them and must not block save.
 */
export function isUnassignedInSigneesMode(customData: unknown): boolean {
  if (typeof customData !== 'object' || customData === null) return false;
  const cd = customData as Record<string, unknown>;
  if (cd['schemaVersion'] !== FIELD_DATA_SCHEMA_VERSION) return false;
  if (typeof cd['type'] !== 'string') return false;
  const plugin = Object.values(FIELD_PLUGINS).find(p => p.type === cd['type']);
  if (!plugin?.requiresAssignment) return false;
  return !cd['signee'];
}

/**
 * Returns true if a v2 field's customData is unassigned in request-builder
 * (recipients) mode and the field type requires assignment.
 *
 * A field is only orphaned when it has NEITHER an explicit signer NOR a
 * design-time signee. Having a signee is sufficient — `mapCustomersToSigners`
 * at request creation will resolve it to a concrete signer.
 *
 * Date and other optional-assignment types always return false.
 */
export function isUnassignedInRecipientsMode(customData: unknown): boolean {
  if (typeof customData !== 'object' || customData === null) return false;
  const cd = customData as Record<string, unknown>;
  if (cd['schemaVersion'] !== FIELD_DATA_SCHEMA_VERSION) return false;
  if (typeof cd['type'] !== 'string') return false;
  const plugin = Object.values(FIELD_PLUGINS).find(p => p.type === cd['type']);
  if (!plugin?.requiresAssignment) return false;
  return !cd['signer'] && !cd['signee'];
}
