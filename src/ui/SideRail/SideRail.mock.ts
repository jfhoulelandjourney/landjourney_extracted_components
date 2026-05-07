import type { RailItem } from './SideRail';

export const railItemsMock: RailItem[] = [
  { id: 'home',         label: 'Home',          icon: 'home',        href: '/home',         active: true },
  { id: 'requests',     label: 'Requests',      icon: 'source',      href: '/requests' },
  { id: 'templates',    label: 'Templates',     icon: 'edit_note',   href: '/templates' },
  { id: 'customers',    label: 'Customers',     icon: 'people',      href: '/customers' },
  { id: 'programs',     label: 'Programs',      icon: 'business',    href: '/programs' },
  { id: 'underwriting', label: 'Underwriting',  icon: 'assessment',  href: '/underwriting' },
  { id: 'loans',        label: 'Loans',         icon: 'folder',      href: '/loans' },
  { id: 'settings',     label: 'Settings',      icon: 'settings',    href: '/settings' },
  { id: 'tools',        label: 'Root Tools',    icon: 'build',       href: '/tools' },
  { id: 'events',       label: 'System Events', icon: 'history',     href: '/events' },
];
