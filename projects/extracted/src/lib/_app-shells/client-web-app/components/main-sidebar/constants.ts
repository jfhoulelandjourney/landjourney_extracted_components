import { Actions, Resources } from 'common';

export type NavLinkPermission = {
  resource: Resources;
  action: Actions;
};

export const MAIN_NAVIGATION_ITEMS: {
  title: string;
  href: string;
  icon: string;
  customSvg?: boolean;
  featureFlag?: string;
}[] = [
  {
    title: 'Home',
    href: '/home',
    icon: 'home',
  },
  {
    title: 'Loans',
    href: '/loans',
    icon: 'loans',
    customSvg: true,
    featureFlag: 'LENDING_FEATURE',
  },
  {
    title: 'Requests',
    href: '/requests',
    icon: 'checklist',
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: 'mail',
    featureFlag: 'MESSAGING_TAB_CLIENT_FEATURE',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'settings',
    featureFlag: 'CLIENT_SETTINGS_FEATURE',
  },
];

export const SUB_MAIN_NAVIGATION_ITEMS = [
  {
    title: 'Logout',
    href: '/logout',
    icon: 'logout',
  },
] as const;

type NavigationItemTitle = (
  | typeof MAIN_NAVIGATION_ITEMS
  | typeof SUB_MAIN_NAVIGATION_ITEMS
)[number]['title'];

export const NAVIGATION_ITEM_PERMISSIONS = new Map<
  NavigationItemTitle,
  NavLinkPermission | NavLinkPermission[] | null
>([
  ['Home', null],
  ['Loans', null],
  ['Requests', null],
  ['Messages', null],
  ['Settings', null],
  ['Logout', null],
]);
