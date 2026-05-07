import React, { useState } from 'react';
import './SideRail.scss';

export interface RailItem {
  id: string;
  label: string;
  icon: string; // Material Symbols name
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

export type SideRailMode = 'collapsed' | 'expanded' | 'auto';

export interface SideRailProps {
  logoSrc?: string;
  /** Wide-form logo shown when expanded (e.g. brand wordmark) */
  logoExpandedSrc?: string;
  brandName?: string;
  items: RailItem[];
  userAvatarSrc?: string;
  userInitials?: string;
  onLogout?: () => void;
  /**
   * collapsed: always 65px wide, icons only.
   * expanded:  always wide (~186px), labels visible.
   * auto:      collapsed by default, expands on hover (overlays content).
   */
  mode?: SideRailMode;
}

export const SideRail: React.FC<SideRailProps> = ({
  logoSrc, logoExpandedSrc, brandName = 'Landjourney', items,
  userAvatarSrc, userInitials = '?', onLogout, mode = 'auto'
}) => {
  const [hovered, setHovered] = useState(false);
  const expanded = mode === 'expanded' || (mode === 'auto' && hovered);

  return (
    <nav
      className={'lj-rail' + (expanded ? ' lj-rail--expanded' : ' lj-rail--collapsed') + ' lj-rail--' + mode}
      aria-label="Primary"
      onMouseEnter={() => mode === 'auto' && setHovered(true)}
      onMouseLeave={() => mode === 'auto' && setHovered(false)}
    >
      <div className="lj-rail__logo">
        {expanded && logoExpandedSrc ? (
          <img src={logoExpandedSrc} alt={brandName} className="lj-rail__logo-wide" />
        ) : logoSrc ? (
          <img src={logoSrc} alt={brandName} />
        ) : (
          <div className="lj-rail__logo-fallback">{expanded ? brandName : brandName[0]}</div>
        )}
      </div>

      <ul className="lj-rail__items">
        {items.map(it => (
          <li key={it.id}>
            <a
              href={it.href ?? '#'}
              className={'lj-rail__link' + (it.active ? ' lj-rail__link--active' : '')}
              onClick={(e) => { if (it.onClick) { e.preventDefault(); it.onClick(); } }}
              aria-current={it.active ? 'page' : undefined}
              title={it.label}
            >
              <span className="lj-rail__icon material-symbols-outlined">{it.icon}</span>
              <span className="lj-rail__label">{it.label}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="lj-rail__footer">
        <div className="lj-rail__avatar">
          {userAvatarSrc ? <img src={userAvatarSrc} alt="" /> : <span>{userInitials}</span>}
        </div>
        <button className="lj-rail__logout" onClick={onLogout} aria-label="Log out">
          <span className="lj-rail__icon material-symbols-outlined">logout</span>
          <span className="lj-rail__label">Logout</span>
        </button>
      </div>
    </nav>
  );
};
