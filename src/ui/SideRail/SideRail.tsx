import React from 'react';
import './SideRail.scss';

export interface RailItem {
  id: string;
  label: string;
  icon: string; // Material Symbols name
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface SideRailProps {
  logoSrc?: string;
  items: RailItem[];
  userAvatarSrc?: string;
  userInitials?: string;
  onLogout?: () => void;
}

export const SideRail: React.FC<SideRailProps> = ({
  logoSrc, items, userAvatarSrc, userInitials = '?', onLogout
}) => (
  <nav className="lj-rail" aria-label="Primary">
    <div className="lj-rail__logo">
      {logoSrc ? <img src={logoSrc} alt="Logo" /> : <div className="lj-rail__logo-fallback">L</div>}
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
            <span className="material-symbols-outlined">{it.icon}</span>
          </a>
        </li>
      ))}
    </ul>

    <div className="lj-rail__footer">
      <div className="lj-rail__avatar">
        {userAvatarSrc ? <img src={userAvatarSrc} alt="" /> : <span>{userInitials}</span>}
      </div>
      <button className="lj-rail__logout" onClick={onLogout} aria-label="Log out">
        <span className="material-symbols-outlined">logout</span>
      </button>
    </div>
  </nav>
);
