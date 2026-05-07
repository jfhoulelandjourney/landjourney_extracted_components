import React from 'react';
import './SectionCard.scss';

export interface SectionCardProps {
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, toolbar, children, noPadding }) => (
  <section className="lj-section-card">
    {(title || toolbar) && (
      <header className="lj-section-card__header">
        {title && <h2 className="lj-section-card__title">{title}</h2>}
        {toolbar && <div className="lj-section-card__toolbar">{toolbar}</div>}
      </header>
    )}
    <div className={'lj-section-card__body' + (noPadding ? ' is-flush' : '')}>{children}</div>
  </section>
);
