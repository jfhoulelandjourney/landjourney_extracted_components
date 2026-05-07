import React from 'react';
import './PageHeader.scss';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  guidebookHref?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  back?: { label: string; onClick: () => void };
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title, subtitle, guidebookHref, primaryAction, secondaryActions, back
}) => (
  <header className="lj-page-header">
    <div className="lj-page-header__top">
      <div className="lj-page-header__title-row">
        {back && (
          <button className="lj-page-header__back" onClick={back.onClick}>
            <span className="material-symbols-outlined">arrow_back</span>
            {back.label}
          </button>
        )}
        <h1 className="lj-page-header__title">{title}</h1>
        {guidebookHref && (
          <a className="lj-page-header__guidebook" href={guidebookHref} target="_blank" rel="noreferrer" aria-label="Open guidebook">
            <span className="material-symbols-outlined">menu_book</span>
          </a>
        )}
      </div>
      <div className="lj-page-header__actions">
        {secondaryActions}
        {primaryAction}
      </div>
    </div>
    {subtitle && <p className="lj-page-header__subtitle">{subtitle}</p>}
  </header>
);
