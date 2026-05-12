/**
 * Native label TextAnnotation — printable, flatten-safe, sits ~9px above
 * the widget. Used by field plugins when the user sets a label in the inspector.
 *
 * The label is linked to its widget via `customData.groupId`: every member
 * of the ensemble (widget + optional label) shares the same UUID, so the
 * bridge can find the label later for updates / deletes when the inspector
 * edits or clears the label value.
 */

import type { Serializers } from '@nutrient-sdk/viewer';
import type { Bbox } from './types';

/** Vertical gap between the label's bottom edge and the widget's top edge. */
export const LABEL_GAP_PX = 9;

/** Reserved height for the label box. Slightly larger than font size to leave room for descenders. */
export const LABEL_HEIGHT_PX = 16;

/** Font size for the label text — fixed across plugins for visual consistency. */
export const LABEL_FONT_SIZE_PX = 14;

/**
 * Builds a `TextAnnotationJSON` positioned above the given widget bbox.
 * Caller is responsible for generating the `id` and `groupId` and appending
 * the result to the fragment's `annotations` array.
 *
 * @param args.id - Unique annotation id for the label
 * @param args.pageIndex - Zero-based page index
 * @param args.widgetBbox - Bounding box of the widget
 * @param args.text - Label text to display
 * @param args.groupId - Shared UUID linking widget + label (for move/delete glue)
 * @param args.fieldType - Field type (e.g., 'signature'); included in customData for reference
 * @returns TextAnnotationJSON ready to pass to `instance.create`
 */
export function makeLabelAnnotation(args: {
  id: string;
  pageIndex: number;
  widgetBbox: Bbox;
  text: string;
  groupId: string;
  fieldType: string;
}): Serializers.TextAnnotationJSON {
  const { id, pageIndex, widgetBbox, text, groupId, fieldType } = args;
  const labelBbox: [number, number, number, number] = [
    widgetBbox.x,
    widgetBbox.y - LABEL_GAP_PX - LABEL_HEIGHT_PX,
    widgetBbox.w,
    LABEL_HEIGHT_PX,
  ];
  return {
    type: 'pspdfkit/text',
    v: 1,
    id,
    pageIndex,
    bbox: labelBbox,
    opacity: 1,
    text: { format: 'plain', value: text },
    // PSPDFKit asserts `font` on text annotations even though the type
    // declares it optional. Helvetica is the safe baseline.
    font: 'Helvetica',
    fontSize: LABEL_FONT_SIZE_PX,
    fontColor: '#000000',
    backgroundColor: null,
    horizontalAlign: 'left',
    verticalAlign: 'center',
    // Labels are framework-managed (regenerated from configuration.label).
    // Rendered with pointer-events: none in the custom renderer to prevent
    // user interaction. No flags needed — PSPDFKit native behavior is fine.
    flags: [],
    customData: {
      kind: 'label',
      groupId,
      fieldType,
    },
  } as Serializers.TextAnnotationJSON;
}
