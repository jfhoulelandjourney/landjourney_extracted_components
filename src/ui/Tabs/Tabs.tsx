import React from 'react';
import './Tabs.scss';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Right-side area for sort dropdowns / toggles, like the real Requests page */
  rightSlot?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, rightSlot }) => (
  <div className="lj-tabs">
    <div className="lj-tabs__list" role="tablist">
      {items.map(it => (
        <button
          key={it.id}
          role="tab"
          aria-selected={it.id === activeId}
          aria-disabled={it.disabled || undefined}
          className={'lj-tabs__tab' + (it.id === activeId ? ' is-active' : '') + (it.disabled ? ' is-disabled' : '')}
          onClick={() => !it.disabled && onChange(it.id)}
          type="button"
        >
          <span>{it.label}</span>
          {typeof it.count === 'number' && <span className="lj-tabs__count">{it.count}</span>}
        </button>
      ))}
    </div>
    {rightSlot && <div className="lj-tabs__right">{rightSlot}</div>}
  </div>
);
