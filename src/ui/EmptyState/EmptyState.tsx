import React from 'react';
import './EmptyState.scss';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'folder_off', title, description, action }) => (
  <div className="lj-empty-state">
    <span className="material-symbols-outlined lj-empty-state__icon">{icon}</span>
    <h3 className="lj-empty-state__title">{title}</h3>
    {description && <p className="lj-empty-state__desc">{description}</p>}
    {action && <div className="lj-empty-state__action">{action}</div>}
  </div>
);
