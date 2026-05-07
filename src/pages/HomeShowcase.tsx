import React from 'react';
import { AppShell } from '../ui/AppShell';
import { SideRail, railItemsMock } from '../ui/SideRail';
import { PageHeader } from '../ui/PageHeader';
import { SectionCard } from '../ui/SectionCard';
import { EmptyState } from '../ui/EmptyState';
import './HomeShowcase.scss';

export const HomeShowcase: React.FC = () => (
  <AppShell
    rail={<SideRail items={railItemsMock} userInitials="JF" />}
    header={
      <PageHeader
        title="Programs"
        subtitle="Manage the programs you offer to your clients and their associated products."
        primaryAction={<button className="lj-btn lj-btn--primary">+ Create New</button>}
      />
    }
  >
    <SectionCard
      title="Programs"
      toolbar={<input className="lj-input" placeholder="Search" />}
    >
      <EmptyState
        icon="folder_off"
        title="No programs yet"
        description="Get started by creating your first program. Programs help you organize and manage your products."
        action={<button className="lj-btn lj-btn--primary">+ Create Program</button>}
      />
    </SectionCard>
  </AppShell>
);
