import { TemplateRef } from '@angular/core';

export type NavLinkItemVariant = 'icon-only' | 'text-only' | 'icon-and-text';

export type NavLinkItem = {
  title: string;
  href?: string;
  icon?: string | TemplateRef<unknown>;
  variant?: NavLinkItemVariant;
  customSvg?: boolean;
  onClick?: (event: Event) => void;
};

export const DEFAULT_NAV_LINK_ITEM_VARIANT: NavLinkItemVariant =
  'icon-and-text' as const;
