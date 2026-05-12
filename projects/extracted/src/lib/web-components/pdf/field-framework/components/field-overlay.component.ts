import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  RequestUserRoles,
  getRequestUserRolesDisplayName,
} from '../../../../models/requestModels';
import { resolveRecipientForRoles } from '../../../signature/recipient-resolution.util';
import type { CheckboxFieldData } from '../plugins/checkbox/checkbox.plugin';
import { FIELD_PLUGINS, type V2FieldData } from '../plugins/field-plugin';
import type { RadioFieldData } from '../plugins/radio/radio.plugin';
import { FieldsBridgeService } from '../services/fields-bridge.service';

/** One row of the checkbox/radio option preview shown inside the widget. */
interface OptionPreviewRow {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
}

/** Discriminated preview model — non-null only for checkbox/radio fields. */
interface OptionsPreview {
  readonly type: 'checkbox' | 'radio';
  readonly options: readonly OptionPreviewRow[];
}

// Field type icons (Material Icons paths)
const SIGNATURE_ICON =
  'M563-491q73-54 114-118.5T718-738q0-32-10.5-47T679-800q-47 0-83 79.5T560-541q0 14 .5 26.5T563-491ZM120-120v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80ZM136-280l-56-56 64-64-64-64 56-56 64 64 64-64 56 56-64 64 64 64-56 56-64-64-64 64Zm482-40q-30 0-55-11.5T520-369q-25 14-51.5 25T414-322l-28-75q28-10 53.5-21.5T489-443q-5-22-7.5-48t-2.5-56q0-144 57-238.5T679-880q52 0 85 38.5T797-734q0 86-54.5 170T591-413q7 7 14.5 10.5T621-399q26 0 60.5-33t62.5-87l73 34q-7 17-11 41t1 42q10-5 23.5-17t27.5-30l63 49q-26 36-60 58t-63 22q-21 0-37.5-12.5T733-371q-28 25-57 38t-58 13Z';

const INITIALS_ICON =
  'M80-120v-80h800v80H80Zm680-160v-560h60v560h-60Zm-600 0 210-560h100l210 560h-96l-50-144H308l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z';

const FIELD_TYPE_ICONS = {
  signature: SIGNATURE_ICON,
  initials: INITIALS_ICON,
  date: 'M580-240q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T880-720v560q0 33-23.5 56.5T800-80H200Zm0-80h600v-480H200v480Z',
  name: 'M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-35 17.5-63.5T224-378q57-42 109.5-64T480-464q56 0 108.5 22.5T698-378q29 20 46.5 48.5T762-266v112H160Z',
  number:
    'M440-280v-160H280v-80h160v-160h80v160h160v80H520v160h-80Z',
  currency:
    'M441-120v-86q-53-12-91.5-46T293-348l74-30q15 48 44.5 73t77.5 25q41 0 69.5-18.5T587-356q0-35-22-55.5T463-458q-86-27-118-64.5T313-614q0-65 42-101t86-41v-84h80v84q50 8 82.5 36.5T651-650l-74 32q-12-32-34-48t-60-16q-44 0-67 19.5T393-614q0 33 30 52t104 40q72 22 108 67t36 99q0 71-42 108t-108 46v82h-80Z',
  dropdown:
    'M480-360 280-560h400L480-360ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z',
  'text-input':
    'M200-120v-80h600v80H200Zm0-200v-80h600v80H200Z',
  textarea:
    'M120-120v-720h720v720H120Zm80-560h560v-80H200v80Zm0 160h560v-80H200v80Zm0 160h560v-80H200v80Zm0 160h280v-80H200v80Z',
  checkbox:
    'M424-296 728-600l-56-56-248 248-128-128-56 56 184 184Zm-264 176q-33 0-56.5-23.5T80-200v-560q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v560q0 33-23.5 56.5T800-120H160Z',
  radio:
    'M480-280q83 0 141.5-58.5T680-480q0-83-58.5-141.5T480-680q-83 0-141.5 58.5T280-480q0 83 58.5 141.5T480-280Zm0 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z',
} as const;

const FIELD_TYPE_LABELS = {
  signature: 'Signature',
  initials: 'Initials',
  date: 'Date',
  name: 'Name',
  number: 'Number',
  currency: 'Currency',
  dropdown: 'Dropdown',
  'text-input': 'Text',
  textarea: 'Textarea',
  checkbox: 'Checkbox',
  radio: 'Radio',
} as const;

/**
 * Decorative overlay mounted by `FieldsBridgeService` over each v2 widget.
 *
 * In builder mode, displays:
 * - Field type icon + label on the left (above widget)
 * - Role badges on the right (above widget)
 *
 * Pointer events are disabled at the host level so PSPDFKit's native widget
 * receives all clicks. Chrome styling is CSS-only (DOM layer); it never
 * touches PSPDFKit's annotation properties and doesn't leak into exported PDFs.
 * Style encapsulation is `ShadowDom` so PSPDFKit's inner-iframe stylesheet
 * cannot bleed in.
 */
@Component({
  selector: 'lj-pdf-field-overlay',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  templateUrl: './field-overlay.component.html',
  styleUrl: './field-overlay.component.scss',
  host: {
    '[class.readonly]': 'isReadonly()',
    '[class.orphan]': 'isOrphan()',
    '[class.fill-mode]': 'isFillMode()',
    '[class.filled]': 'isFilled()',
  },
})
export class FieldOverlayComponent {
  private readonly bridge = inject(FieldsBridgeService);

  /**
   * The field's customData. The bridge gates this overlay on
   * `isV2Custom(annotation.customData)` before mounting.
   * Null only during the very first CD pass before the bridge calls
   * `setInput('data', cd)`.
   */
  readonly data = input<V2FieldData | null>(null);

  /** Whether the field is readonly. When true, displays a readonly indicator. */
  readonly isReadonly = computed(
    (): boolean => this.data()?.readonly === true
  );

  /**
   * Whether the field is required. When true, displays a red asterisk
   * next to the type label (web-form convention).
   */
  readonly isRequired = computed(
    (): boolean => this.data()?.required === true
  );

  /** Field type extracted from customData, used for icon and label lookup. */
  readonly fieldType = computed(
    (): string => this.data()?.type ?? 'signature'
  );

  /** Icon SVG path for the field type. */
  readonly iconPath = computed((): string => {
    const path = (FIELD_TYPE_ICONS as Record<string, string>)[this.fieldType()];
    return path || SIGNATURE_ICON;
  });

  /** Human-readable label for the field type. */
  readonly typeLabel = computed((): string => {
    const label = (FIELD_TYPE_LABELS as Record<string, string>)[
      this.fieldType()
    ];
    return label || 'Field';
  });

  /**
   * Compact range string for number/currency fields based on `min`/`max` in
   * customData. Returns null when neither bound is set or when the field type
   * doesn't carry numeric bounds.
   * Examples: "0–100", "≥ 0", "≤ 100" (currency code is already visible in
   * the formatted display value, so it's not repeated here).
   */
  readonly constraintLabel = computed((): string | null => {
    const cd = this.data();
    if (!cd) return null;
    if (cd.type !== 'number' && cd.type !== 'currency') return null;
    const boundedCd = cd as V2FieldData & {
      readonly min?: number | null;
      readonly max?: number | null;
    };
    const hasMin =
      boundedCd.min !== null && boundedCd.min !== undefined;
    const hasMax =
      boundedCd.max !== null && boundedCd.max !== undefined;
    if (!hasMin && !hasMax) return null;
    if (hasMin && hasMax) return `${boundedCd.min}–${boundedCd.max}`;
    if (hasMin) return `≥ ${boundedCd.min}`;
    return `≤ ${boundedCd.max}`;
  });

  /**
   * Formatted role labels for display on the right. Applies human-readable
   * display names to each role in `signee.roles` (e.g., CO_BORROWER → Co-Borrower).
   */
  readonly allFormattedRoles = computed((): readonly string[] => {
    const roles = this.data()?.signee?.roles;
    if (!roles || roles.length === 0) {
      return [];
    }
    return roles.map(role => getRequestUserRolesDisplayName(role));
  });

  /**
   * True when this field requires person assignment but has none.
   * - `'signees'` mode (template builder): orphan when `customData.signee` is falsy.
   * - `'recipients'` mode (request builder): orphan when `customData.signer` is falsy.
   *
   * Only field types with `requiresAssignment: true` (signature, initials)
   * can trigger this — other types (date, etc.) treat unassigned as valid.
   */
  readonly isOrphan = computed((): boolean => {
    const cd = this.data();
    if (!cd) return false;
    const plugin = Object.values(FIELD_PLUGINS).find(p => p.type === cd.type);
    if (!plugin?.requiresAssignment) return false;
    const mode = this.bridge.assignmentMode();
    if (mode?.kind === 'signees') return !cd.signee;
    if (mode?.kind === 'recipients') {
      if (cd.signer) return false;
      const roles = (cd.signee?.roles ?? []) as RequestUserRoles[];
      const { suggested } = resolveRecipientForRoles(roles, [...mode.recipients]);
      return suggested === null;
    }
    return false;
  });

  /** Visible role badges (limited to first 2). */
  readonly visibleRoles = computed(
    (): readonly string[] => this.allFormattedRoles().slice(0, 2)
  );

  /** Count of additional roles not shown in badges. */
  readonly extraRoleCount = computed((): number => {
    const total = this.allFormattedRoles().length;
    return total > 2 ? total - 2 : 0;
  });

  /**
   * True when the host is rendering in fill context. Builder hosts (template
   * editor, request builder) set `bridge.assignmentMode` to a non-null value;
   * fill hosts (request signing flows) leave it null.
   *
   * Caveat: there's a brief window between `attach` and the host calling
   * `setAssignmentMode` where this returns true on a builder. Hosts should
   * call `setAssignmentMode` synchronously after `provideFieldFramework()`
   * resolves the bridge to avoid flicker.
   */
  readonly isFillMode = computed(
    (): boolean => this.bridge.assignmentMode() === null
  );

  /**
   * Caption to render beneath the widget, or null when no caption applies.
   *
   * - Fill mode (mode === null): shows the explicit signer name, never automatic.
   * - Request builder ('recipients'): shows explicit signer name, or the
   *   auto-resolved signer name with `automatic: true` (derived from signee roles).
   * - Template builder ('signees'): null — role pills already communicate assignment.
   */
  readonly resolvedSignerCaption = computed(
    (): { readonly name: string; readonly automatic: boolean } | null => {
      const mode = this.bridge.assignmentMode();
      const cd = this.data();
      if (!cd) return null;

      if (mode?.kind === 'recipients') {
        if (cd.signer) return { name: cd.signer.name, automatic: false };
        const { suggested } = resolveRecipientForRoles(
          (cd.signee?.roles ?? []) as RequestUserRoles[],
          [...mode.recipients]
        );
        return suggested ? { name: suggested.name, automatic: true } : null;
      }

      // Fill mode (mode === null): existing behaviour, never automatic.
      if (mode === null) {
        const name = cd.signer?.name ?? '';
        return name ? { name, automatic: false } : null;
      }

      // Template builder ('signees'): role pills cover this — no caption.
      return null;
    }
  );

  /**
   * Whether the field already has a value. Once filled, the signer caption
   * fades so the actual signed value reads cleanly.
   */
  readonly isFilled = computed((): boolean => this.data()?.filled === true);

  /**
   * Builder/preview render of the checkbox or radio option list. Mirrors the
   * `sliceBbox` + `splitOptionSlice` geometry that `materialize*Field` will
   * produce at fill time: N equal vertical slices, each with a small box on
   * the left and the option label on the right. CSS handles the equal
   * partitioning via `flex: 1` per row, which matches the geometric slicing
   * exactly when the host's height === the original field bbox height.
   *
   * Returns null for non-option field types (so the template skips rendering).
   */
  readonly optionsPreview = computed((): OptionsPreview | null => {
    const cd = this.data();
    if (!cd) return null;
    if (cd.type !== 'checkbox' && cd.type !== 'radio') return null;
    const options =
      cd.type === 'checkbox'
        ? (cd as CheckboxFieldData).options
        : (cd as RadioFieldData).options;
    return {
      type: cd.type,
      options: (options ?? []).map(o => ({
        id: o.id,
        label: o.label ?? o.value ?? o.id,
        checked:
          cd.type === 'checkbox'
            ? (o as { checked: boolean }).checked
            : (o as { selected: boolean }).selected,
      })),
    };
  });

  /** Hint text to show inside the widget when empty. Empty string when unset. */
  readonly placeholder = computed((): string => this.data()?.placeholder ?? '');

  /**
   * True when placeholder text should be rendered. Shown whenever the field
   * is unfilled and a placeholder is configured — both in builder mode
   * (so the designer sees how it will look) and in fill mode (as a user hint).
   */
  readonly showPlaceholder = computed(
    (): boolean => !this.isFilled() && this.placeholder().length > 0
  );

}
