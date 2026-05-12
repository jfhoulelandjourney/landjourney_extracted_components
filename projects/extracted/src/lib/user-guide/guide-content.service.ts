import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { marked } from 'marked';
import { filter } from 'rxjs';

import { OrganizationService } from '../services/organization/organization.service';

const USER_GUIDE_BASE_URL = 'https://docs.landjourney.ai';

export interface GuideManifestPage {
  title: string;
  file: string;
  slug: string;
}

export interface GuideManifestSection {
  title: string;
  icon: string;
  slug: string;
  pages: GuideManifestPage[];
}

export interface GuideRouteMapEntry {
  pattern: string;
  file: string;
}

export interface GuideManifest {
  title: string;
  routeMap?: GuideRouteMapEntry[];
  sections: GuideManifestSection[];
}

export interface GuidePageInfo {
  section: GuideManifestSection;
  page: GuideManifestPage;
}

@Injectable({
  providedIn: 'root',
})
export class GuideContentService {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private organizationService = inject(OrganizationService);

  private _sections = signal<GuideManifestSection[]>([]);
  private _currentPageInfo = signal<GuidePageInfo | null>(null);
  private _content = signal<string>('');
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _showToc = signal<boolean>(false);

  readonly sections = this._sections.asReadonly();
  readonly currentPageInfo = this._currentPageInfo.asReadonly();
  readonly content = this._content.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly showToc = this._showToc.asReadonly();

  private _currentPath = signal('');
  private _routeMap = signal<{ pattern: RegExp; file: string }[]>([]);

  readonly hasContentForCurrentRoute = computed(() =>
    this._routeMap().some(m => m.pattern.test(this._currentPath()))
  );

  private static readonly FALLBACK_BACKOFFICE_ROUTE_MAP: {
    pattern: RegExp;
    file: string;
  }[] = [
    {
      pattern: /^\/requests\/[^/]+\/section\/[^/]+\/task\/[^/]+/,
      file: 'backoffice/08_reviewing-tasks.md',
    },
    {
      pattern: /^\/requests\/new(\/|$)/,
      file: 'backoffice/05_creating-a-request.md',
    },
    {
      pattern: /^\/requests\/drafts\/[^/]+(\/|$)/,
      file: 'backoffice/05_creating-a-request.md',
    },
    {
      pattern: /^\/requests\/[^/]+\/edit(\/|$)/,
      file: 'backoffice/05_creating-a-request.md',
    },
    {
      pattern: /^\/requests\/[^/]+\/add(\/|$)/,
      file: 'backoffice/05_creating-a-request.md',
    },
    {
      pattern: /^\/requests\/[^/]+\/documents/,
      file: 'backoffice/06_request-overview.md',
    },
    {
      pattern: /^\/requests\/[^/]+\/offers/,
      file: 'backoffice/06_request-overview.md',
    },
    {
      pattern: /^\/requests\/[^/]+$/,
      file: 'backoffice/06_request-overview.md',
    },
    { pattern: /^\/requests$/, file: 'backoffice/07_requests.md' },
    { pattern: /^\/home$/, file: 'backoffice/01_home-dashboard.md' },
    { pattern: /^\/templates/, file: 'backoffice/04_templates.md' },
    { pattern: /^\/customers/, file: 'backoffice/02_customers.md' },
    { pattern: /^\/programs/, file: 'backoffice/03_programs.md' },
    { pattern: /^\/discussions\//, file: 'backoffice/09_discussions.md' },
    {
      pattern: /^\/settings\/export-settings$/,
      file: 'backoffice/11_settings-export.md',
    },
    { pattern: /^\/settings\/users/, file: 'backoffice/10_settings-users.md' },
  ];

  private static readonly FALLBACK_BORROWER_ROUTE_MAP: {
    pattern: RegExp;
    file: string;
  }[] = [
    { pattern: /^\/home$/, file: 'borrower-portal/01_home.md' },
    {
      pattern: /^\/requests\/[^/]+/,
      file: 'borrower-portal/02_my-requests.md',
    },
    { pattern: /^\/requests$/, file: 'borrower-portal/02_my-requests.md' },
    {
      pattern: /^\/settings\/profile$/,
      file: 'borrower-portal/03_settings-profile.md',
    },
    {
      pattern: /^\/settings\/communications$/,
      file: 'borrower-portal/04_settings-communications.md',
    },
    {
      pattern: /^\/settings\/third-party-sharing$/,
      file: 'borrower-portal/05_settings-sharing.md',
    },
    { pattern: /^\/settings$/, file: 'borrower-portal/03_settings-profile.md' },
  ];

  public isBackoffice(): boolean {
    return (
      window.location.hostname.toLowerCase().includes('backoffice.') ||
      window.location.hostname.toLowerCase().includes('backoffice-test.') ||
      window.location.hostname
        .toLowerCase()
        .includes('backoffice-integration.') ||
      Boolean(
        this.organizationService.uiConfiguration.backofficeFQDN?.includes(
          window.location.hostname
        )
      )
    );
  }

  private getFallbackRouteMap(): { pattern: RegExp; file: string }[] {
    return this.isBackoffice()
      ? GuideContentService.FALLBACK_BACKOFFICE_ROUTE_MAP
      : GuideContentService.FALLBACK_BORROWER_ROUTE_MAP;
  }

  private manifestCache: GuideManifest | null = null;
  private contentCache = new Map<string, string>();

  constructor() {
    this._routeMap.set(this.getFallbackRouteMap());
    this._currentPath.set(this.currentPathFromRouterUrl(this.router.url));

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        this._currentPath.set(
          this.currentPathFromRouterUrl(event.urlAfterRedirects)
        );
      });

    this.ensureManifest();
  }

  private currentPathFromRouterUrl(rawUrl: string): string {
    return rawUrl.split('?')[0]?.split('#')[0] ?? '';
  }

  async loadForCurrentRoute(): Promise<void> {
    await this.ensureManifest();

    const path = this._currentPath();
    const matched = this._routeMap().find(m => m.pattern.test(path));
    if (matched) {
      this._showToc.set(false);
      await this.loadPageByFile(matched.file);
    } else {
      this._showToc.set(true);
      this._content.set('');
      this._currentPageInfo.set(null);
    }
  }

  async loadPage(sectionSlug: string, pageSlug: string): Promise<void> {
    await this.ensureManifest();

    const section = this._sections().find(s => s.slug === sectionSlug);
    const page = section?.pages.find(p => p.slug === pageSlug);
    if (section && page) {
      this._showToc.set(false);
      this._currentPageInfo.set({ section, page });
      await this.fetchContent(page.file);
    }
  }

  showTableOfContents(): void {
    this._showToc.set(true);
    this._content.set('');
    this._currentPageInfo.set(null);
  }

  private async loadPageByFile(file: string): Promise<void> {
    await this.ensureManifest();

    for (const section of this._sections()) {
      const page = section.pages.find(p => p.file === file);
      if (page) {
        this._currentPageInfo.set({ section, page });
        await this.fetchContent(file);
        return;
      }
    }

    this._currentPageInfo.set(null);
    this._showToc.set(false);
    await this.fetchContent(file);
  }

  private async ensureManifest(): Promise<void> {
    if (this.manifestCache) return;

    try {
      const res = await fetch(`${USER_GUIDE_BASE_URL}/docs/manifest.json`);
      if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
      const manifest = (await res.json()) as GuideManifest;
      this.manifestCache = manifest;
      this._sections.set(manifest.sections);
      if (this.isBackoffice() && manifest.routeMap?.length) {
        // this._routeMap.set(
        //   manifest.routeMap.map(entry => ({
        //     pattern: new RegExp(entry.pattern),
        //     file: entry.file,
        //   }))
        // );
        // TODO: Remove this once the manifest is updated because it has wrong data in it
        this._routeMap.set(this.getFallbackRouteMap());
      } else {
        this._routeMap.set(this.getFallbackRouteMap());
      }
    } catch {
      this._error.set('Failed to load guide navigation.');
      this._sections.set([]);
      this._routeMap.set(this.getFallbackRouteMap());
    }
  }

  private async fetchContent(file: string): Promise<void> {
    const cachedContent = this.contentCache.get(file);
    if (cachedContent !== undefined) {
      this._content.set(cachedContent);
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      const res = await fetch(`${USER_GUIDE_BASE_URL}/docs/${file}`);
      if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`);

      let markdown = await res.text();

      markdown = markdown.replace(
        /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
        (_, alt, path) => {
          const absolutePath = path.startsWith('/')
            ? `${USER_GUIDE_BASE_URL}${path}`
            : `${USER_GUIDE_BASE_URL}/${path}`;
          return `![${alt}](${absolutePath})`;
        }
      );

      const html = await marked(markdown);
      this.contentCache.set(file, html);
      this._content.set(html);
    } catch {
      this._error.set('Failed to load guide content. Please try again.');
      this._content.set('');
    } finally {
      this._loading.set(false);
    }
  }
}
