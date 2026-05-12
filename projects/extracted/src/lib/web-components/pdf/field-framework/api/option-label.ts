/**
 * Per-option label TextAnnotation — sibling utility to `api/label.ts`.
 *
 * Used by checkbox/radio plugins to place a printable, flatten-safe label
 * next to each option's native widget. Linked to the widget via the shared
 * `customData.groupId` and identified by `customData.kind = 'option-label'`
 * with `optionIndex` matching the option's position in `customData.options`.
 */

import type { Serializers } from '@nutrient-sdk/viewer';
import { ANNOTATION_KIND_OPTION_LABEL } from '../constants';
import type { Bbox } from './types';

/** Font size for per-option labels — slightly smaller than field labels. */
export const OPTION_LABEL_FONT_SIZE_PX = 12;

/**
 * Builds a TextAnnotationJSON for the label adjacent to one option's box.
 * Caller is responsible for generating `id` and the shared `groupId`.
 */
export function makeOptionLabelAnnotation(args: {
  id: string;
  pageIndex: number;
  labelBbox: Bbox;
  text: string;
  groupId: string;
  fieldType: string;
  optionIndex: number;
}): Serializers.TextAnnotationJSON {
  const { id, pageIndex, labelBbox, text, groupId, fieldType, optionIndex } =
    args;
  const bbox: [number, number, number, number] = [
    labelBbox.x,
    labelBbox.y,
    labelBbox.w,
    labelBbox.h,
  ];
  // Two PSPDFKit-isms the importInstantJSON validator enforces (unlike
  // `instance.create(fromSerializableObject(...))`, which is more lenient):
  //   1. `backgroundColor: null` is rejected — omit the property entirely.
  //   2. `text` must be a plain string, NOT the `{ format, value }` object
  //      shape used by the live-create path.
  // The materializer routes per-option labels through importInstantJSON, so
  // we emit the strict shape here.
  return {
    type: 'pspdfkit/text',
    v: 1,
    id,
    pageIndex,
    bbox,
    opacity: 1,
    text,
    font: 'Helvetica',
    fontSize: OPTION_LABEL_FONT_SIZE_PX,
    fontColor: '#000000',
    horizontalAlign: 'left',
    verticalAlign: 'center',
    flags: [],
    customData: {
      kind: ANNOTATION_KIND_OPTION_LABEL,
      groupId,
      fieldType,
      optionIndex,
    },
  } as unknown as Serializers.TextAnnotationJSON;
}
