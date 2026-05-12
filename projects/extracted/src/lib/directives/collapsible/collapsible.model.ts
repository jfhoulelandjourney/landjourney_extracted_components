import { isNonNullable } from '../../utils/nullishUtil';

// CSS size unit pattern type
type CSSSize =
  `${number}${'px' | 'em' | 'rem' | 'vw' | 'vh' | 'vmin' | 'vmax' | '%'}`;

export interface BreakpointItem {
  maxWidth?: CSSSize | string;
  minWidth?: CSSSize | string;
  maxHeight?: CSSSize | string;
  minHeight?: CSSSize | string;
}

export const isBreakpointItem = (input?: object): input is BreakpointItem => {
  if (!input) return false;
  const fields = ['minWidth', 'maxWidth', 'minHeight', 'maxHeight'] as const;
  return fields.some(field => field in input);
};

export const stringifyBreakpointItem = (value?: BreakpointItem): string => {
  const { maxWidth, minWidth, maxHeight, minHeight } = value ?? {};
  const minWidthStr = minWidth ? `(min-width: ${minWidth})` : undefined;
  const maxWidthStr = maxWidth ? `(max-width: ${maxWidth})` : undefined;
  const minHeightStr = minHeight ? `(min-height: ${minHeight})` : undefined;
  const maxHeightStr = maxHeight ? `(max-height: ${maxHeight})` : undefined;

  const values = [minWidthStr, maxWidthStr, minHeightStr, maxHeightStr].filter(
    isNonNullable
  );
  return values.join(' and ');
};

// CollapsibleState
export type CollapsibleState = 'fixed' | 'collapsed' | 'expanded';
