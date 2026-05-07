import React from 'react';
import './StatusPill.scss';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'progress';

export interface StatusPillProps {
  tone?: StatusTone;
  children: React.ReactNode;
  /** Optional small leading dot */
  dot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({ tone = 'neutral', children, dot = false }) => (
  <span className={'lj-status-pill lj-status-pill--' + tone}>
    {dot && <span className="lj-status-pill__dot" aria-hidden />}
    {children}
  </span>
);
