# PDF Field Framework — Plugin Authoring Guide

Adding a new field type means writing **one plugin** plus **one inspector component** and registering both. The framework handles the rest: drag-drop from the toolbox, custom rendering, change detection, customData persistence, and submit-time gating.

This guide walks through it end-to-end using a hypothetical `phone` field as the running example. For real plugins to copy from, look at:

- `number/` — text-input-backed field with format-on-blur
- `currency/` — same as number, plus a configuration knob (currency code)
- `dropdown/` — non-text field (`ComboBoxFormField`) with collection-shaped customData
- `signature/`, `initials/` — fields that require an assignment (signee/signer)

## Architecture in 90 seconds

```
┌─────────────────────────────────────────────────────────┐
│  <pdf-viewer>  +  provideFieldFramework()               │
│                                                         │
│   FieldsBridgeService  ←─ owns setCustomRenderers,      │
│        ↑                  events, cache                 │
│        │                                                │
│   FieldsService  ←─ public API: create / update         │
│        │                                                │
│   FIELD_PLUGINS  ←─ registry, keyed by `type`           │
│   INSPECTOR_REGISTRY  ←─ inspector components by type   │
└─────────────────────────────────────────────────────────┘
```

A field type is a `customData.type` literal (e.g. `'number'`). Two layers care about it:

1. **`FIELD_PLUGINS[type]`** — how to **build** the live PSPDFKit annotation + form field at drop time, plus optional behavior hooks.
2. **`INSPECTOR_REGISTRY[type]`** — the Angular component shown when the user selects the field in the builder.

Everything else (overlay chrome, drag previews, fill flow, autosave) is generic and reads `customData.type` to pick the right plugin / inspector.

## customData is the source of truth

This is the framework's load-bearing invariant: the framework stores all field state in `widget.customData` (a JSON blob PSPDFKit round-trips verbatim). PSPDFKit's primitives (`TextFormField`, `ComboBoxFormField`, etc.) are treated as a **cached projection** of customData.

Practical consequences:
- Inspector edits patch `customData` — they don't touch the form field directly.
- The plugin's `onPatch` hook (optional) mirrors `customData` changes back into the live form field for the user to see immediately.
- On document load, anything PSPDFKit corrupts (e.g. it strips the last char of the last option of a `ComboBoxFormField` on save) gets repaired from customData.

If you find yourself reading state from a form field, ask whether you should be reading `customData` instead.

## Step 1 — Pick a backing form field type

PSPDFKit's primitives constrain what's possible without writing a fully custom DOM widget:

| Need                              | PSPDFKit form field        | Used by                   |
| --------------------------------- | -------------------------- | ------------------------- |
| Free text / numeric / formatted   | `TextFormField`            | `text-input`, `number`, `currency`, `date`, `name` |
| Single-select from fixed list     | `ComboBoxFormField`        | `dropdown`                |
| Click-to-open a custom modal      | `SignatureFormField`       | `signature`, `initials`   |

If you need something the SDK doesn't provide, your options are (a) render an HTML overlay on top of a hidden form field via the `FieldOverlayComponent` chrome, or (b) render a fully custom widget through `setCustomRenderers` (see how `signature` does it).

## Step 2 — Author the plugin

Create `plugins/<type>/<type>.plugin.ts`. The shape is duck-typed; the framework discovers behavior by `'method' in plugin` checks. Required:

```ts
// plugins/phone/phone.plugin.ts
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

/** Flat customData shape — stored directly on `WidgetAnnotation.customData`. */
export interface PhoneFieldData {
  readonly schemaVersion: typeof FIELD_DATA_SCHEMA_VERSION;
  readonly type: 'phone';
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
  /** Plugin-specific knobs go here. */
  readonly format?: 'us' | 'international';
  readonly groupId?: string;
}

const DEFAULTS: PhoneFieldData = {
  schemaVersion: FIELD_DATA_SCHEMA_VERSION,
  type: 'phone',
  signee: null,
  signer: null,
  filled: false,
  filledByUser: false,
  readonly: false,
  required: false,
  format: 'us',
  placeholder: '(555) 123-4567',
};

export interface PhoneCreateResult {
  readonly widget: WidgetAnnotation;
  readonly formField: TextFormField;
  readonly label?: Serializers.TextAnnotationJSON;
  readonly annotationId: string;
  readonly formFieldName: string;
}

export async function createPhoneField(input: {
  readonly bbox: Bbox;
  readonly pageIndex: number;
  readonly data?: Partial<PhoneFieldData>;
}): Promise<PhoneCreateResult> {
  const { bbox, pageIndex } = input;
  if (!Number.isFinite(bbox.w) || bbox.w <= 0) {
    throw new RangeError(`phone.createField: bbox.w must be positive`);
  }
  if (!Number.isFinite(bbox.h) || bbox.h <= 0) {
    throw new RangeError(`phone.createField: bbox.h must be positive`);
  }

  const PSPDFKit = await loadPSPDFKit();
  const annotationId = PSPDFKit.generateInstantId();
  const formFieldName = `phone-${PSPDFKit.generateInstantId()}`;
  const groupId = PSPDFKit.generateInstantId();

  const data: PhoneFieldData = input.data
    ? Object.assign({}, DEFAULTS, input.data, { groupId })
    : { ...DEFAULTS, groupId };

  const widget = new PSPDFKit.Annotations.WidgetAnnotation({
    id: annotationId,
    pageIndex,
    boundingBox: new PSPDFKit.Geometry.Rect({
      left: bbox.x, top: bbox.y, width: bbox.w, height: bbox.h,
    }),
    formFieldName,
    customData: { ...data },
    backgroundColor: PSPDFKit.Color.TRANSPARENT,
    borderColor: PSPDFKit.Color.TRANSPARENT,
  });

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
      fieldType: 'phone',
    });
  }

  return { widget, formField, label, annotationId, formFieldName };
}

export const phonePlugin = {
  type: 'phone' as const,
  label: 'Phone',
  size: { width: 180, height: 30 },
  defaults: DEFAULTS,
  /** True if assignment to a signee/signer is mandatory (signature/initials).
   *  False for "anyone can fill" fields like text/number/date/phone. */
  requiresAssignment: false,
  createField: createPhoneField,
} as const;
```

Don't add CTRL+F-style copy-paste to other plugins — only the bits you need:

| Optional plugin field      | Purpose                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `formatValueForDisplay`    | Bridge calls it on `annotations.blur` and on `formFieldValues.update` (when not focused). Used by `number`/`currency` to format `12345.6` → `12,345.60`. Signature: `(value: string, customData: D) => string`. |
| `onPatch`                  | Called by `FieldsService.update` AFTER `instance.update(widget)` runs. Lets you mirror customData changes into PSPDFKit primitives the generic patch path can't reach (e.g. `dropdown` rebuilds the form field's options list). |
| `onPress`                  | Called by the bridge on `annotations.press` for fill mode. Used by `signature`/`initials` to open the native signing modal. |

## Step 3 — Author the inspector component

Create `plugins/<type>/<type>.inspector.ts/.html/.scss`. Extend `BaseFieldInspector<'phone'>`. The base wires up `data()` (typed customData), `annotation()`, and `patch(...)` so you only write field-specific UI.

Skeleton:

```ts
// plugins/phone/phone.inspector.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BaseFieldInspector } from '../../components/base-field-inspector';
import { FieldsBridgeService } from '../../services/fields-bridge.service';
import { FieldsService } from '../../services/fields.service';
import type { PhoneFieldData } from './phone.plugin';

@Component({
  selector: 'lj-pdf-phone-inspector',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './phone.inspector.html',
  styleUrl: './phone.inspector.scss',
})
export class PhoneInspectorComponent extends BaseFieldInspector<'phone'> {
  readonly type = 'phone' as const;
  readonly annotationId = input.required<string>();

  private readonly bridge = inject(FieldsBridgeService);
  private readonly fields = inject(FieldsService);

  readonly labelInput = signal('');
  readonly placeholderInput = signal('');
  readonly formatInput = signal<'us' | 'international'>('us');

  constructor() {
    super();
    this.setupAnnotationTracking(this.bridge);
    effect((): void => {
      const data = this.data() as PhoneFieldData | null;
      if (!data) return;
      this.labelInput.set(data.label ?? '');
      this.placeholderInput.set(data.placeholder ?? '');
      this.formatInput.set(data.format ?? 'us');
    });
  }

  protected override patch(p: Record<string, unknown>): Promise<void> {
    return this.fields.update(this.annotationId(), p);
  }

  onLabelChange(label: string): void {
    this.labelInput.set(label);
    void this.patch({ label });
  }
  onFormatChange(format: 'us' | 'international'): void {
    this.formatInput.set(format);
    void this.patch({ format });
  }
  onRequiredChange(checked: boolean): void { void this.patch({ required: checked }); }
  onReadonlyChange(checked: boolean): void { void this.patch({ readonly: checked }); }
}
```

The HTML mirrors the other inspectors — `inspector-section` rows with bound inputs and checkboxes. The SCSS file just imports the shared sheet:

```scss
@use '../inspector';
```

Inspector gotchas (the ones that bit us):
- **Don't re-sync collection-shaped state from `data()` on every patch.** The bridge re-emits `data` after each patch, your effect would fire, and Angular CD overwrites in-progress typing. For collections (e.g. dropdown's options list), seed once per annotation switch and let the inspector own the state thereafter. See `dropdown.inspector.ts` for the `lastSeededAnnotationId` pattern.
- **No parse-on-focus.** `setFormFieldValues` is async and races the user's first keystroke. Format-on-blur is enough; don't try to "unformat" on focus.

## Step 4 — Register the plugin

Two registrations:

```ts
// plugins/field-plugin.ts
import { phonePlugin } from './phone/phone.plugin';

export const FIELD_PLUGINS = {
  signature: signaturePlugin,
  initials: initialsPlugin,
  // ...
  phone: phonePlugin,        // ← add here
} as const;
```

```ts
// plugins/inspector-registry.ts
import { PhoneInspectorComponent } from './phone/phone.inspector';

export const INSPECTOR_REGISTRY: Record<RegisteredFieldType, Type<object>> = {
  // ...
  phone: PhoneInspectorComponent,    // ← add here
};
```

That's it for the framework side. The annotations menu auto-discovers from `FIELD_PLUGINS`, the inspector dialog auto-discovers from `INSPECTOR_REGISTRY`, and the overlay icon list reads from neither — see Step 6.

## Step 5 — Wire the drag-drop entry

`signature/draggable-annotation/draggable-annotation.component.ts` is the v1 + v2 toolbox tile. Add your type to its switch and icon map:

```ts
// In dragData computed():
case 'text-input':
case 'textarea':
case 'number':
case 'currency':
case 'dropdown':
case 'phone':                                    // ← add
  return { ...baseData, type };

// In iconName computed iconMap:
phone: 'phone',                                  // ← Material icon name
```

## Step 6 — Add the overlay chrome (icon + label)

`pdf/field-framework/components/field-overlay.component.ts` shows the small badge above each rendered field in builder mode (icon + type label + required asterisk + role pills). Add your entry to the two maps:

```ts
const FIELD_TYPE_ICONS = {
  // ...
  phone: 'M798-120q...Z',     // SVG path data; Material Symbols is fine
};

const FIELD_TYPE_LABELS = {
  // ...
  phone: 'Phone',
};
```

If your field has special "constraint" metadata (min/max, currency code, etc.) that's worth surfacing in the badge, extend the `constraintLabel` computed in the same file — see how `number`/`currency` show `0–100` / `≥ 0` / `≤ 100`.

## Step 7 — FF gate (automatic)

`signature/annotations-menu/annotations-menu.component.ts` filters visible fields against `ORIGINAL_FIELD_TYPES`. Anything NOT in that set is gated behind the `PDF_NEW_FIELDS` feature flag automatically. To make your field always-visible, add it to that set; otherwise, do nothing — gating is the default for new types.

## Reading list (for non-trivial cases)

- **Live form-field sync after inspector edits** → `dropdown/dropdown.plugin.ts` `onDropdownPatch`, plus `services/fields.service.ts` `doUpdate` (look for `'onPatch' in plugin`).
- **Format-on-blur** → `number/number.plugin.ts` `formatNumberValueForDisplay`, plus `services/fields-bridge.service.ts` `applyFormatOnBlur` and the `formFieldValues.update` listener.
- **Persistence corruption repair** → `services/fields-bridge.service.ts` `repairDropdownFormFieldsFromCustomData` (rebuilds form field options from customData on load to fix a Nutrient PDF serialization bug).
- **Required + readonly enforcement** → `field-overlay.component.ts` for the visual cues; submit-time gating is in `annotation-fill.directive.ts` `allUserRequiredFieldsFilled`.
- **Optional-vs-required assignment** → `requiresAssignment: true` on the plugin makes signee/signer mandatory; `false` lets the field be filled by anyone authorized to interact with the PDF. The orphan UI (red "⚠ Unassigned" pill) is in `field-overlay.component.ts` `isOrphan`.

## Conventions enforced via review

- **Three files per inspector**: `.ts`, `.html`, `.scss`. No inline templates.
- **No `any`**. Plugin data interfaces go on the plugin file; everything else is typed against them.
- **Feature flag lives at the UI gate**, not on the plugin/data definition.
- **Plugin file is Node-safe** (it imports types only and calls `loadPSPDFKit` lazily). Inspector files are Angular-only.

Once you've checked all the above, the field is ready: drop it from the toolbox, configure it in the inspector, fill it in fill mode, save, reload, repeat.
