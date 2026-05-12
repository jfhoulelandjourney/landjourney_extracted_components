/**
 * Public API types for the PDF field framework.
 */

/** Axis-aligned bounding box in PDF page space (top-left origin, points). */
export interface Bbox {
  /** Left edge offset from page origin. */
  readonly x: number;
  /** Top edge offset from page origin. */
  readonly y: number;
  /** Width in PDF points. */
  readonly w: number;
  /** Height in PDF points. */
  readonly h: number;
}
