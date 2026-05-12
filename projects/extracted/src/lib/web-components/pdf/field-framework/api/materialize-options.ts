/**
 * JSON-side materializer for checkbox / radio fields.
 *
 * In builder mode, dropping a checkbox or radio creates a SINGLE placeholder
 * `WidgetAnnotation` covering the field's bbox plus a stub `CheckBoxFormField`
 * / `RadioButtonFormField` carrying one dummy `FormOption`. The real options
 * live on `customData.options` and are edited via the inspector without
 * rebuilding the widget — keystroke stability is the trade-off.
 *
 * Before the customer fills the field, the placeholder must be expanded to N
 * native option widgets + a real form field with N FormOptions + N adjacent
 * label TextAnnotations. This module performs that expansion as a pure
 * transform on `SignatureInstantJSON` — no live PSPDFKit instance required.
 *
 * Plug it into the request-creation pipeline (e.g. right after
 * `mapCustomersToSigners` runs) so the saved request bytes contain the
 * materialized widgets, ready for native fill-mode rendering.
 *
 * Idempotent: a widget is recognized as "placeholder" only when its
 * `customData.optionIndex` is undefined. Once materialized, every produced
 * widget carries `optionIndex: 0..N-1`, so re-running this function is a
 * no-op.
 */

import type { Serializers } from '@nutrient-sdk/viewer';
import { getUUID7 } from '../../../../utils/stringUtil';
import type {
  CheckboxFieldData,
  CheckboxOption,
} from '../plugins/checkbox/checkbox.plugin';
import type { RadioFieldData, RadioOption } from '../plugins/radio/radio.plugin';
import type {
  CheckboxFormField,
  FormFieldEntry,
  RadioFormField,
  SignatureInstantJSON,
} from '../types/instant-json';
import { sliceBbox, splitOptionSlice } from './option-layout';
import { makeOptionLabelAnnotation } from './option-label';
import type { Bbox } from './types';

type AnyOption = CheckboxOption | RadioOption;
type WidgetEntry = SignatureInstantJSON['annotations'][number];
// SignatureInstantJSON.annotations narrows to `pspdfkit/widget` in the type
// system, but in practice the array also contains TextAnnotation entries
// (field labels and now option labels) since `signatureTask` is the full
// PSPDFKit InstantJSON output. Cast at the boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAnnotationEntry = WidgetEntry | (Serializers.TextAnnotationJSON & any);

function resolveOptionValue(o: AnyOption): string {
  return o.value ?? o.label ?? o.id;
}

function isPlaceholderOptionWidget(
  ann: WidgetEntry
): ann is WidgetEntry & {
  customData: (CheckboxFieldData | RadioFieldData) & { optionIndex?: undefined };
} {
  const cd = ann.customData as
    | (CheckboxFieldData | RadioFieldData)
    | null
    | undefined;
  if (!cd) return false;
  if (cd.type !== 'checkbox' && cd.type !== 'radio') return false;
  // Already materialized → has an explicit optionIndex.
  if (typeof (cd as { optionIndex?: number }).optionIndex === 'number') {
    return false;
  }
  // No options configured → leave the placeholder; the user-facing builder
  // overlay still shows "no options yet" guidance.
  if (!cd.options || cd.options.length === 0) return false;
  return true;
}

function makeId(): string {
  // PSPDFKit accepts arbitrary unique strings as InstantJSON ids; the
  // 26-char InstantID format is a convention, not a constraint. UUIDv7 is
  // the project-wide id generator (see stringUtil.getUUID7) — time-ordered,
  // sortable, and consistent with how other entities mint ids.
  return getUUID7();
}

interface MaterializeWork {
  readonly placeholder: WidgetEntry;
  readonly newWidgets: WidgetEntry[];
  readonly optionLabels: AnyAnnotationEntry[];
  /**
   * Form fields produced for this placeholder. **Checkbox emits N fields
   * (one per option)** so each box toggles independently — PSPDFKit's
   * InstantJSON `CheckboxFormField` only supports a singular `defaultValue`,
   * meaning a shared field collapses N widgets into a single togglable
   * state (visually radio-like). Radio emits ONE shared field, which is
   * the correct shape for a mutually-exclusive group.
   */
  readonly newFormFields: FormFieldEntry[];
  readonly oldFormFieldName: string;
}

function buildMaterializeWork(
  placeholder: WidgetEntry,
  oldFormField: FormFieldEntry | undefined
): MaterializeWork | null {
  const cd = placeholder.customData as CheckboxFieldData | RadioFieldData;
  const options = cd.options ?? [];
  if (options.length === 0) return null;

  const bbox: Bbox = {
    x: placeholder.bbox[0],
    y: placeholder.bbox[1],
    w: placeholder.bbox[2],
    h: placeholder.bbox[3],
  };
  const groupId = (cd as { groupId?: string }).groupId ?? makeId();
  const formFieldName = placeholder.formFieldName;

  const newWidgets: WidgetEntry[] = [];
  const optionLabels: AnyAnnotationEntry[] = [];
  const widgetIds: string[] = [];
  const newFormFields: FormFieldEntry[] = [];

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (!opt) continue;
    const slice = sliceBbox(bbox, options.length, i);
    const { box, label: labelSlice } = splitOptionSlice(slice);

    const widgetId = makeId();
    widgetIds.push(widgetId);

    // For checkbox, give every widget its OWN form field (`-{i}` suffix).
    // For radio, all widgets share the original form field name (one
    // field with N widgets is the canonical PDF radio-group shape).
    const widgetFormFieldName =
      cd.type === 'checkbox' ? `${formFieldName}-${i}` : formFieldName;

    // Spread the placeholder verbatim then override the geometry, id,
    // optionIndex, and (for checkbox) per-option formFieldName. Spread
    // preserves createdAt / creatorName / pageIndex / every other
    // PSPDFKit-required field without us having to enumerate them.
    newWidgets.push({
      ...placeholder,
      id: widgetId,
      formFieldName: widgetFormFieldName,
      bbox: [box.x, box.y, box.w, box.h],
      customData: { ...(cd as object), groupId, optionIndex: i },
    });

    const labelText = opt.label ?? opt.value ?? opt.id;
    optionLabels.push(
      makeOptionLabelAnnotation({
        id: makeId(),
        pageIndex: placeholder.pageIndex,
        labelBbox: labelSlice,
        text: labelText,
        groupId,
        fieldType: cd.type,
        optionIndex: i,
      }) as unknown as AnyAnnotationEntry
    );

    if (cd.type === 'checkbox') {
      // One independent CheckboxFormField per option. PSPDFKit's actual
      // InstantJSON validator wants `defaultValues: string[]` (plural)
      // even for single-widget checkbox fields — the singular form is
      // rejected with "defaultValue is not allowed to be set when
      // defaultValues is expected". The TypeScript narrowing on
      // `CheckboxFormField` (instant-json.ts:27-31) is misleading;
      // ignore it via the unknown cast below.
      const optionValue = resolveOptionValue(opt);
      const optChecked = (opt as CheckboxOption).checked;
      newFormFields.push({
        type: 'pspdfkit/form-field/checkbox',
        v: 1,
        id: makeId(),
        name: widgetFormFieldName,
        annotationIds: [widgetId],
        label: '',
        options: [{ label: opt.label ?? opt.value ?? opt.id, value: optionValue }],
        pdfObjectId: null,
        ...({ defaultValues: optChecked ? [optionValue] : [] } as object),
      } as unknown as CheckboxFormField);
    }
  }

  if (newWidgets.length === 0) return null;

  if (cd.type === 'radio') {
    // One shared RadioButtonFormField for all option widgets.
    const formFieldId = oldFormField?.id ?? makeId();
    const formOptions = options.map(o => ({
      label: o.label ?? o.value ?? o.id,
      value: resolveOptionValue(o),
    }));
    const selected = (options as readonly RadioOption[]).find(o => o.selected);
    const defaultValue = selected ? resolveOptionValue(selected) : '';
    newFormFields.push({
      ...(oldFormField ?? {}),
      type: 'pspdfkit/form-field/radio',
      v: oldFormField?.v ?? 1,
      id: formFieldId,
      name: formFieldName,
      annotationIds: widgetIds,
      label: oldFormField?.label ?? '',
      defaultValue,
      options: formOptions,
      noToggleToOff: false,
      pdfObjectId: oldFormField?.pdfObjectId ?? null,
      // radiosInUnison defaults to true in PSPDFKit; we want false so
      // distinct option values stay independent if a designer ever
      // types duplicates. Cast through unknown — the public TS surface
      // omits this field on RadioFormField.
      ...({ radiosInUnison: false } as object),
    } as unknown as RadioFormField);
  }

  return {
    placeholder,
    newWidgets,
    optionLabels,
    newFormFields,
    oldFormFieldName: formFieldName,
  };
}

/**
 * Pure JSON transform: walk every annotation, materialize each placeholder
 * checkbox/radio widget into N option widgets + N option labels + a real
 * form field with N FormOptions. Returns a new `SignatureInstantJSON`
 * (the input is not mutated).
 *
 * Wire it into the request-creation pipeline like:
 *
 * ```ts
 * let updatedValue = mapCustomersToSigners(signatureMetadata, mappedCustomers);
 * updatedValue = materializeOptionFieldsInJson(updatedValue);
 * updatedValue = removeAnnotationsWithoutSigners(updatedValue);
 * ```
 *
 * Order matters: run AFTER `mapCustomersToSigners` (so the placeholder
 * carries the resolved signer), and BEFORE `removeAnnotationsWithoutSigners`
 * (so the placeholder gets removed if it has no signer / signee, sparing
 * us the materialization work).
 */
export function materializeOptionFieldsInJson(
  metadata: SignatureInstantJSON
): SignatureInstantJSON {
  if (!metadata.annotations || metadata.annotations.length === 0) {
    return metadata;
  }

  // First pass: scan placeholders. If none, short-circuit.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placeholders: WidgetEntry[] = [];
  for (const ann of metadata.annotations as AnyAnnotationEntry[]) {
    if (ann?.type !== 'pspdfkit/widget') continue;
    const widget = ann as WidgetEntry;
    if (!isPlaceholderOptionWidget(widget)) continue;
    placeholders.push(widget);
  }
  if (placeholders.length === 0) {
    // Diagnostic: identify why checkbox/radio widgets bypass the placeholder
    // guard in fill mode. Remove once the root cause is understood.
    const optionWidgets = (metadata.annotations as AnyAnnotationEntry[]).filter(
      a => {
        if (a?.type !== 'pspdfkit/widget') return false;
        const t = (a.customData as { type?: string } | null)?.type;
        return t === 'checkbox' || t === 'radio';
      }
    );
    if (optionWidgets.length > 0) {
      console.error('[materializeOptionFieldsInJson] no placeholders detected', {
        total: optionWidgets.length,
        sample: optionWidgets.slice(0, 4).map(w => {
          const cd = w.customData as Record<string, unknown> | null;
          const opts = cd?.['options'];
          return {
            id: (w as WidgetEntry).id,
            type: cd?.['type'],
            optionIndex: cd?.['optionIndex'],
            optionsKind: Array.isArray(opts)
              ? `array[${opts.length}]`
              : typeof opts,
            rawOptions: opts,
          };
        }),
      });
    }
    return metadata;
  }

  // Index form fields by name for O(1) lookup.
  const formFieldByName = new Map<string, FormFieldEntry>();
  for (const ff of metadata.formFields ?? []) {
    formFieldByName.set(ff.name, ff);
  }

  const work: MaterializeWork[] = [];
  const placeholderIds = new Set<string>();
  const replacedFormFieldNames = new Set<string>();
  for (const placeholder of placeholders) {
    const oldFormField = formFieldByName.get(placeholder.formFieldName);
    const w = buildMaterializeWork(placeholder, oldFormField);
    if (!w) continue;
    work.push(w);
    placeholderIds.add(placeholder.id);
    replacedFormFieldNames.add(w.oldFormFieldName);
  }
  if (work.length === 0) return metadata;

  // Replace placeholder widgets in-place (preserving order) and append
  // option labels at the end of the annotations list.
  const newAnnotations: AnyAnnotationEntry[] = [];
  for (const ann of metadata.annotations as AnyAnnotationEntry[]) {
    if (
      ann?.type === 'pspdfkit/widget' &&
      placeholderIds.has((ann as WidgetEntry).id)
    ) {
      const matched = work.find(
        w => w.placeholder.id === (ann as WidgetEntry).id
      );
      if (matched) {
        newAnnotations.push(...matched.newWidgets);
      }
      continue;
    }
    newAnnotations.push(ann);
  }
  for (const w of work) {
    newAnnotations.push(...w.optionLabels);
  }

  // Replace matching form fields, leave the rest untouched. Each work
  // item may contribute MULTIPLE form fields (checkbox: one per option;
  // radio: one shared) — the placeholder's stub form field is dropped
  // and the produced fields take its place.
  const newFormFields: FormFieldEntry[] = [];
  const emittedWorkOldNames = new Set<string>();
  for (const ff of metadata.formFields ?? []) {
    if (replacedFormFieldNames.has(ff.name)) {
      if (!emittedWorkOldNames.has(ff.name)) {
        const matched = work.find(w => w.oldFormFieldName === ff.name);
        if (matched) newFormFields.push(...matched.newFormFields);
        emittedWorkOldNames.add(ff.name);
      }
      continue;
    }
    newFormFields.push(ff);
  }
  // Fallback: if the placeholder's form field wasn't in the input list,
  // append the synthesized fields.
  for (const w of work) {
    if (!emittedWorkOldNames.has(w.oldFormFieldName)) {
      newFormFields.push(...w.newFormFields);
      emittedWorkOldNames.add(w.oldFormFieldName);
    }
  }

  // Drop any formFieldValues that referenced the original placeholder
  // form fields — those names no longer exist (replaced by N per-option
  // names for checkbox, or kept-but-distinct for radio). PSPDFKit's
  // import would otherwise log:
  //   "Could not find form field 'checkbox-…' for applying value"
  // and abort. The placeholder never carried real fill data, so dropping
  // is safe.
  const newFormFieldValues = (metadata.formFieldValues ?? []).filter(
    v => !replacedFormFieldNames.has(v.name)
  );

  return {
    ...metadata,
    annotations: newAnnotations as SignatureInstantJSON['annotations'],
    formFields: newFormFields,
    formFieldValues: newFormFieldValues,
  };
}
