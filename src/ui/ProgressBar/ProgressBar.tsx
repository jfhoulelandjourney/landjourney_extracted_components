import React from 'react';
import './ProgressBar.scss';

export interface ProgressSegment {
  /** Portion 0..1 */
  value: number;
  /** Tone or hex color */
  tone?: 'warning' | 'danger' | 'success' | 'info';
  color?: string;
  label?: string;
}

export interface ProgressBarProps {
  segments: ProgressSegment[];
  height?: number;
  rounded?: boolean;
  showPercent?: boolean;
}

const TONE_COLOR: Record<string, string> = {
  warning: '#efa22f',  // observed orange
  danger:  '#e87466',  // observed red/coral
  success: '#16a34a',
  info:    '#1c507e',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ segments, height = 8, rounded = true, showPercent }) => {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  return (
    <div
      className={'lj-progress' + (rounded ? ' lj-progress--rounded' : '')}
      style={{ height }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(segments[0]?.value * 100 ?? 0)}
    >
      {segments.map((s, i) => (
        <span
          key={i}
          className="lj-progress__segment"
          title={s.label}
          style={{
            width: ((s.value / total) * 100) + '%',
            background: s.color ?? TONE_COLOR[s.tone ?? 'info'],
          }}
        />
      ))}
      {showPercent && <span className="lj-progress__label">{Math.round((segments[0]?.value ?? 0) * 100)}%</span>}
    </div>
  );
};
