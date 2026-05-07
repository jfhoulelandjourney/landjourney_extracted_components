import React, { useMemo, useState } from 'react';
import { AppShell } from '../ui/AppShell';
import { SideRail, railItemsMock } from '../ui/SideRail';
import { PageHeader } from '../ui/PageHeader';
import { SectionCard } from '../ui/SectionCard';
import { SearchInput } from '../ui/SearchInput';
import { FilterBar } from '../ui/FilterBar';
import { Tabs } from '../ui/Tabs';
import { DataTable, DataTableColumn } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import { ProgressBar } from '../ui/ProgressBar';
import { Avatar } from '../ui/Avatar';
import { AvatarStack } from '../ui/AvatarStack';
import { requestsMock, stageTone } from '../mocks/requests';
import { fullName, initials } from '../mocks/users';
import type { RequestRow } from '../mocks/types';
import './RequestsShowcase.scss';

const RAIL = railItemsMock.map(i => ({ ...i, active: i.id === 'requests' }));

export const RequestsShowcase: React.FC = () => {
  const [tab, setTab] = useState<'mine' | 'team' | 'all' | 'drafts'>('mine');
  const [search, setSearch] = useState('');
  const [chips, setChips] = useState([
    { id: 'stage:initiated', label: 'Stage', value: 'Initiated' },
    { id: 'owner:me', label: 'Owner', value: 'JF Houle' },
  ]);
  const [page, setPage] = useState(1);
  const [showClosed, setShowClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' }>({ id: 'activityAt', dir: 'desc' });

  const filtered = useMemo(() => {
    let rows = requestsMock;
    if (!showClosed) rows = rows.filter(r => r.stage !== 'Closed');
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.stage.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => {
      const get = (r: RequestRow) => (r as any)[sort.id];
      const av = get(a), bv = get(b);
      const cmp = String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [search, showClosed, sort]);

  const columns: DataTableColumn<RequestRow>[] = [
    { id: 'name', header: 'Request Name', sortable: true, cell: r => (
      <div className="rs-name">
        <span>{r.name}</span>
      </div>
    )},
    { id: 'tasks', header: 'Tasks', cell: r => (
      <div className="rs-tasks">
        <span className="rs-tasks__count">{r.taskCount}</span>
        <ProgressBar
          segments={[
            { value: r.taskProgress.done,    tone: 'warning' },
            { value: r.taskProgress.pending, tone: 'danger' },
          ]}
        />
      </div>
    )},
    { id: 'createdAt',  header: 'Created',  sortable: true, cell: r => r.createdAt },
    { id: 'activityAt', header: 'Activity', sortable: true, cell: r => r.activityAt },
    { id: 'stage',      header: 'Stage',    sortable: true, cell: r => <StatusPill tone={stageTone(r.stage)}>{r.stage}</StatusPill> },
    { id: 'customers',  header: 'Customers', cell: r => (
      <AvatarStack size="sm" people={r.customers.map(u => ({ initials: initials(u), name: fullName(u) }))} />
    )},
    { id: 'team', header: 'Team Members', cell: r => (
      <AvatarStack size="sm" people={r.team.map(u => ({ initials: initials(u), name: fullName(u) }))} />
    )},
  ];

  return (
    <AppShell
      rail={<SideRail items={RAIL} userInitials="JF" />}
      header={
        <PageHeader
          title="Requests"
          primaryAction={<button className="lj-btn lj-btn--primary">+ Create New</button>}
        />
      }
    >
      <SectionCard noPadding>
        <div className="rs-toolbar">
          <SearchInput
            variant="banner"
            value={search}
            onChange={setSearch}
            placeholder="Search by request name, stage, customer, request owner, or more ..."
          />
          <div className="rs-filterbar-row">
            <FilterBar
              chips={chips}
              onRemove={id => setChips(chips.filter(c => c.id !== id))}
              onAdd={() => alert('Open filter picker (mock)')}
            />
          </div>
        </div>

        <Tabs
          activeId={tab}
          onChange={(id) => setTab(id as any)}
          items={[
            { id: 'mine', label: 'My Requests' },
            { id: 'team', label: "My Team's Requests" },
            { id: 'all',  label: 'All Requests' },
            { id: 'drafts', label: 'Drafts' },
          ]}
          rightSlot={
            <>
              <button className="lj-btn rs-sort">Updated <span className="material-symbols-outlined">arrow_downward</span></button>
              <label className="rs-toggle">
                <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} />
                <span>Show Closed Requests</span>
              </label>
              <button className="lj-btn" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1200); }}>Reload</button>
            </>
          }
        />

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          loading={loading}
          emptyMessage="There are no requests to display"
          page={page} pageCount={Math.max(1, Math.ceil(filtered.length / 25))} onPageChange={setPage}
          sort={sort} onSortChange={(id, dir) => setSort({ id, dir })}
          onRowClick={r => alert('Open request: ' + r.name)}
        />
      </SectionCard>
    </AppShell>
  );
};
