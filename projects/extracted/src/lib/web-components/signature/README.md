# Signature — Field Consumer Guide

This folder contains the **builder** and **filler** UI for PDF signature/field workflows. The actual field types (signature, initials, date, name, number, currency, dropdown, text-input, textarea) are defined in `../pdf/field-framework/plugins/`. This guide is for engineers who want to **use** those fields in a page or feature.

If you need to **add a new field type**, read [`../pdf/field-framework/README.md`](../pdf/field-framework/README.md) instead.

## What's in this folder

| File / folder                                | Role                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `annotations-menu/`                          | Sidebar of draggable field tiles (the "toolbox")                      |
| `draggable-annotation/`                      | A single draggable tile (also reused for v1 custom fields)            |
| `annotation-drop-zone.directive.ts`          | The droppable PDF area; resolves drag-data → real annotation creation |
| `annotation-fill.directive.ts`               | The fill-mode counterpart: hooks form events, gates on permissions    |
| `annotation-authorization.ts`                | Who can fill what (currentUser + impersonation rules)                 |
| `recipient-resolution.util.ts`               | Maps signee roles → concrete recipient at request time                |
| `signee-selector/`                           | UI for picking who signs a template                                   |
| `template-summary/`                          | Read-only summary of a template's fields                              |
| `pdf-signature-builder.stories.ts`           | Reference Storybook for the **builder** (template designer)           |
| `pdf-signature-signer.stories.ts`            | Reference Storybook for the **signer** (fill mode)                    |

## Two modes — same components, different wiring

Both modes share the field framework and the underlying `<lj-pdf-viewer>`. They differ in which directives + assignment-mode you wire up.

### Builder mode (template designer / request builder)

Goal: drag fields from a sidebar onto the PDF, configure them in an inspector, save the layout.

```html
<!-- The inspector renders modal-style for whichever field is selected -->
<lj-pdf-field-inspector />

<div cdkDropListGroup style="display: flex">
  <!-- Left: the field tile sidebar -->
  <lj-annotations-menu
    [connectedTo]="['pdf-drop-area']"
    [signee]="currentSignee"
    [signer]="null"
    [isTemplate]="true" />

  <!-- Right: the PDF with a drop zone wrapping it -->
  <div
    lj-pdf-annotation-dropzone
    dropListId="pdf-drop-area"
    [pdfViewerInstance]="pdfViewer.pdfViewerInstance()"
    (create)="onAnnotationCreated($event)"
    (fail)="onDropFail($event)">
    <lj-pdf-viewer
      #pdfViewer
      mode="edit"
      [file]="pdfFile" />
  </div>
</div>
```

```ts
@Component({
  imports: [
    DragDropModule,
    PdfViewerComponent,
    AnnotationsMenuComponent,
    PdfAnnotationDropZoneDirective,
    FieldInspectorComponent,
  ],
  // REQUIRED: scoped to this component, NOT providedIn: 'root'
  providers: [provideFieldFramework()],
  // ...
})
export class MyTemplateBuilder {
  // The bridge needs to know what assignment context we're in:
  private readonly bridge = inject(FieldsBridgeService);
  constructor() {
    this.bridge.setAssignmentMode({
      kind: 'signees',
      signees: this.signees(),
      onSigneeCreate: this.onSigneeCreate.bind(this),
    });
  }
}
```

### Fill mode (signer)

Goal: render a saved layout, let the authorized user fill values, gate on permissions, persist values back to the form metadata.

```html
<lj-pdf-viewer
  #pdfViewer
  mode="view"
  [file]="pdfFile"
  lj-pdf-annotation-fill
  #fill="ljPdfAnnotationFill"
  [users]="request.users"
  [pdfViewerInstance]="pdfViewer.pdfViewerInstance()"
  [fileMetadata]="fileMetadata" />
```

```ts
@Component({
  imports: [PdfViewerComponent, PdfAnnotationFillDirective],
  providers: [provideFieldFramework()],
  // ...
})
export class MyRequestSigner {
  // The directive exposes signals you can read for UI gating:
  // fill.allUserRequiredFieldsFilled() -> ready-to-confirm
  // fill.alreadySignedByUser()        -> already submitted
  // fill.documentFullySigned()         -> done by everyone
  // fill.currentFileMetadata()         -> current form-field-values map
}
```

In fill mode, `provideFieldFramework()` is still required — the **same plugins** drive the focus/blur format pipeline, the press → signing-modal flow, etc.

## Assignment modes

`FieldsBridgeService.setAssignmentMode(...)` tells the inspector how to render the "Assigned to" section. Three states:

- **`null`** (default) — fill mode. The inspector hides assignment UI entirely.
- **`{ kind: 'signees', signees, onSigneeCreate }`** — template builder. Lets the designer pick from existing signees or create new ones inline.
- **`{ kind: 'recipients', recipients }`** — request builder. Lets the configurator pick from concrete recipients (users with names, emails).

The mode also drives orphan detection in the field overlay (the red "⚠ Unassigned" pill on signature/initials fields without a signee).

## Adding a new field type to the toolbox

If the plugin already exists in `field-framework/plugins/`, the toolbox **picks it up automatically** — no code change needed in this folder. The `lj-annotations-menu` component reads from `FIELD_PLUGINS` and renders one tile per registered type.

Visibility is gated by the `PDF_NEW_FIELDS` feature flag for any plugin not in this hardcoded set:

```ts
// annotations-menu/annotations-menu.component.ts
private readonly ORIGINAL_FIELD_TYPES = new Set<RegisteredFieldType>([
  'signature', 'initials', 'date', 'name',
]);
```

Anything else (`number`, `currency`, `dropdown`, `text-input`, `textarea`, your future plugin) is hidden until `PDF_NEW_FIELDS` is on for the org. To make a field always-visible, add it to that set; to hide an existing always-on field, remove it. There's no per-type flag — one umbrella switch keeps the registration boilerplate to zero.

## Filling a field — what happens at runtime

1. User clicks/types into the form widget. PSPDFKit emits `formFieldValues.update`.
2. `PdfAnnotationFillDirective.fieldUpdateListener` catches it, normalizes the value (handles list-shaped values from combobox, etc.), and:
   - Calls `registerAnnotationUpdate` to set `customData.filled`, `customData.filledBy`, `customData.filledAt`, plus type-specific fields (`date`, `name`).
   - Calls `syncFormFieldValue` to record the raw value in `signatureTask.formFieldValues`.
3. The bridge's listener concurrently:
   - Updates `latestFieldValues` (for the deferred format-on-blur).
   - Triggers `formatValueForDisplay` for the field's plugin if the field is no longer focused (so number → `"1234.56"` becomes `"1,234.56"` after blur).
4. `allUserRequiredFieldsFilled()` recomputes; the host can show a "Confirm" CTA when it flips to `true`.

For signature/initials specifically, step 1 is replaced by a press → signing modal flow handled by the plugin's `onPress` hook (the bridge dispatches it after the host's auth gate passes).

## Authorization (who can fill what)

Three layers:

- **Per-annotation gate** — `canFillAnnotation(annotation, currentUser, impersonate)` in `annotation-authorization.ts`. Wires into PSPDFKit via `instance.setIsEditableAnnotation`.
- **Press gate (for signature/initials)** — `bridge.setCanFillAnnotation(fn)`. Without this, an unauthorized user could open the signature modal even though the field is marked readonly. The fill directive sets it for you.
- **Submit gate** — `allUserRequiredFieldsFilled()` is the gate-keeper. Before unlocking the confirm button, the host should also check `alreadySignedByUser()` to avoid double-submits.

Optional-assignment fields (date, name, number, …) bypass the per-user authorization — anyone authorized to interact with the PDF can fill them. Required-assignment fields (signature, initials) are scoped to the signee.

## Common pitfalls

- **Forgetting `provideFieldFramework()`.** The bridge + service are scoped, not root. If you see "no PSPDFKit instance attached" or the inspector shows nothing, check the providers array.
- **Sharing a builder + filler in the same component.** Don't. They register separate listeners; put each in its own scope so the bridges don't collide.
- **Mutating `customData` directly.** Always go through `FieldsService.update(annotationId, patch)`. The service handles the update queue, runs the plugin's `onPatch` hook, and keeps the bridge cache in sync.
- **Reading values from form fields instead of `customData`.** customData is the source of truth (PSPDFKit corrupts some form-field state on save/load — see the dropdown-options repair in the bridge). When you need state about a field, read its `customData`.
- **Bypassing `coerceFormFieldValue` in the fill directive.** Combobox values arrive as `Immutable.List<string>` or `string[]`, not strings. The helper is shared on purpose.

## Reference Storybooks

- `pdf-signature-builder.stories.ts` — minimal end-to-end builder wiring with mocks.
- `pdf-signature-signer.stories.ts` — minimal end-to-end fill flow with synthesized request metadata.

Both stories are kept as living examples; if you're starting a new builder/filler page, copy from there.
