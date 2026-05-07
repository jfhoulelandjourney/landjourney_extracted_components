import React from 'react';
import './NotFoundPage.scss';

export interface NotFoundPageProps {
  onBack?: () => void;
  title?: string;
  message?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onBack,
  title = "Oops! Looks like you've wandered off the beaten path.",
  message = "The page you requested must've gotten lost in the fields. Let's plow ahead: try heading back home.",
}) => (
  <div className="lj-404">
    <div className="lj-404__art" aria-hidden>
      <svg viewBox="0 0 80 80" width="120" height="120">
        <g stroke="#caa46a" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M40 70 C30 55 25 45 30 30" />
          <path d="M40 70 C50 55 55 45 50 30" />
          <path d="M30 30 L20 22" />
          <path d="M50 30 L60 22" />
          <path d="M40 26 L40 14" />
          <path d="M40 14 L34 8" />
          <path d="M40 14 L46 8" />
        </g>
      </svg>
    </div>
    <span className="lj-404__badge">Error 404</span>
    <h1 className="lj-404__title">{title}</h1>
    <p className="lj-404__message">{message}</p>
    {onBack && (
      <button className="lj-404__back" onClick={onBack}>
        <span className="material-symbols-outlined">chevron_left</span> Back
      </button>
    )}
  </div>
);
