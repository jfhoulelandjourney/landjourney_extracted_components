import React, { useState } from 'react';
import { HomeShowcase } from './pages/HomeShowcase';
import { RequestsShowcase } from './pages/RequestsShowcase';
import { NotFoundPage } from './ui/NotFoundPage/NotFoundPage';

const PAGES = {
  home: { label: 'Home (AppShell + EmptyState)', render: () => <HomeShowcase /> },
  requests: { label: 'Requests (DataTable + Tabs + Filters)', render: () => <RequestsShowcase /> },
  notfound: { label: '404 page', render: () => <NotFoundPage onBack={() => location.reload()} /> },
} as const;

type PageKey = keyof typeof PAGES;

export const App: React.FC = () => {
  const [page, setPage] = useState<PageKey>('requests');
  return (
    <div>
      <div style={{ position: 'fixed', top: 8, right: 8, zIndex: 9999, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 10px', borderRadius: 6, fontFamily: 'system-ui', fontSize: 12 }}>
        <select value={page} onChange={e => setPage(e.target.value as PageKey)} style={{ background: 'transparent', color: '#fff', border: 'none' }}>
          {Object.entries(PAGES).map(([k, v]) => (
            <option key={k} value={k} style={{ color: '#000' }}>{v.label}</option>
          ))}
        </select>
      </div>
      {PAGES[page].render()}
    </div>
  );
};
