import React from 'react';
import './AppShell.scss';

export interface AppShellProps {
  rail: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ rail, header, children }) => (
  <div className="lj-app-shell">
    <aside className="lj-app-shell__rail">{rail}</aside>
    <main className="lj-app-shell__main">
      {header && <div className="lj-app-shell__header">{header}</div>}
      <div className="lj-app-shell__content">{children}</div>
    </main>
  </div>
);
