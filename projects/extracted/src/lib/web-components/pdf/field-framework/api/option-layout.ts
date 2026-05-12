/**
 * Vertical-only layout helpers for multi-widget option fields (checkbox / radio).
 *
 * `sliceBbox` divides the field's overall bbox into N equal vertical slices,
 * one per option. `splitOptionSlice` splits each slice into the small box
 * (where the native CheckBoxFormField/RadioButtonFormField widget lives) and
 * the remaining label area (where the per-option TextAnnotation is placed).
 *
 * Horizontal layout is intentionally not supported in V1.
 */

import type { Bbox } from './types';

/** Side length of the native checkbox/radio box in PDF points. */
export const OPTION_BOX_PX = 14;

/** Horizontal gap between the box and its adjacent label. */
export const OPTION_BOX_LABEL_GAP_PX = 6;

/**
 * Divide `total` into `count` equal-height vertical slices and return the
 * slice at `index`. When `count <= 0`, returns `total` unchanged (placeholder
 * case — caller emits a single widget filling the bbox).
 */
export function sliceBbox(total: Bbox, count: number, index: number): Bbox {
  if (count <= 0) return total;
  const h = total.h / count;
  return { x: total.x, y: total.y + h * index, w: total.w, h };
}

/**
 * Split one option slice into its box (vertically centered, OPTION_BOX_PX
 * square) and label area (everything to the right of the box, with a small
 * gap). Both rects are in PDF page space.
 */
export function splitOptionSlice(slice: Bbox): {
  readonly box: Bbox;
  readonly label: Bbox;
} {
  const top = slice.y + Math.max(0, (slice.h - OPTION_BOX_PX) / 2);
  return {
    box: { x: slice.x, y: top, w: OPTION_BOX_PX, h: OPTION_BOX_PX },
    label: {
      x: slice.x + OPTION_BOX_PX + OPTION_BOX_LABEL_GAP_PX,
      y: slice.y,
      w: Math.max(0, slice.w - OPTION_BOX_PX - OPTION_BOX_LABEL_GAP_PX),
      h: slice.h,
    },
  };
}
