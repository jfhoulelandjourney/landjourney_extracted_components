import React from 'react';
import './Avatar.scss';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  src?: string;
  initials?: string;
  name?: string;
  size?: AvatarSize;
  /** Optional override for background color. If absent, derived from initials/name */
  color?: string;
  title?: string;
}

const PALETTE = [
  '#23bebb', '#9c27b0', '#cc18ba', '#ef6c00', '#43a047',
  '#3949ab', '#d81b60', '#00897b', '#5e35b1', '#1e88e5',
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function initialsFor(name?: string, fallback?: string) {
  if (fallback) return fallback;
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('');
}

export const Avatar: React.FC<AvatarProps> = ({ src, initials, name, size = 'md', color, title }) => {
  const text = initialsFor(name, initials);
  const bg = color ?? colorFor(name ?? initials ?? text);
  return (
    <div className={'lj-avatar lj-avatar--' + size} style={src ? undefined : { background: bg }} title={title ?? name}>
      {src ? <img src={src} alt={name ?? text} /> : <span>{text}</span>}
    </div>
  );
};
