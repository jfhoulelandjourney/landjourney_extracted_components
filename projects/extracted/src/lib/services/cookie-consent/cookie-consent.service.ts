import { inject, Injectable, signal } from '@angular/core';
import { OrganizationService } from '../organization/organization.service';

const STORAGE_KEY = 'cookieConsent';

export type CookieConsentStatus = 'accepted' | 'rejected' | null;

@Injectable({
  providedIn: 'root',
})
export class CookieConsentService {
  private readonly organizationService = inject(OrganizationService);
  /** Current consent from localStorage. null = not yet decided. */
  private readonly consentSignal = signal<CookieConsentStatus>(
    this.readFromStorage()
  );

  /** When true, banner should show even if user already decided (e.g. "Manage preferences"). */
  private readonly showPreferencesSignal = signal<boolean>(false);

  consent = this.consentSignal.asReadonly();
  showPreferences = this.showPreferencesSignal.asReadonly();

  /** Has the user accepted or rejected (stored in localStorage)? */
  hasUserDecided(): boolean {
    return this.consentSignal() !== null;
  }

  /** Should the banner be visible? Yes if no decision yet, or if "Manage preferences" was requested. */
  shouldShowBanner(): boolean {
    return !this.hasUserDecided() || this.showPreferencesSignal();
  }

  getConsent(): CookieConsentStatus {
    return this.consentSignal();
  }

  getCookieAccepted(): boolean {
    // adding this here so open replay starts if the feature flag is deactivated
    if (
      !this.organizationService.isFeatureFlagActivated('COOKIE_CONSENT_BANNER')
    ) {
      return true;
    }
    return this.getConsent() === 'accepted';
  }

  setConsent(status: 'accepted' | 'rejected'): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, status);
    this.consentSignal.set(status);
    this.showPreferencesSignal.set(false);
  }

  /** Call when user clicks "Manage Cookie Preferences" to re-display the banner. */
  showBannerForPreferences(): void {
    this.showPreferencesSignal.set(true);
  }

  dismissPreferencesView(): void {
    this.showPreferencesSignal.set(false);
  }

  private readFromStorage(): CookieConsentStatus {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'accepted' || raw === 'rejected') return raw;
    return null;
  }
}
