import { Injectable, InjectionToken, inject } from '@angular/core';

export type AppEnvironment = 'local' | 'integration' | 'test' | 'production';

export interface EnvironmentConfiguration {
  pspdfLicenseKey?: string;
  novuApplicationIdentifier?: string;
  appType: 'backoffice' | 'web' | 'unknown';
}

export interface EnvironmentConfig {
  appType: 'backoffice' | 'web';
}

export const ENVIRONMENT_CONFIG = new InjectionToken<EnvironmentConfig>(
  'EnvironmentConfig'
);

export const MOBILE_APP_ENVIRONMENT_CONFIG = new InjectionToken<AppEnvironment>(
  'MobileAppEnvironmentConfig'
);

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  private envConfig = inject<EnvironmentConfig>(ENVIRONMENT_CONFIG);
  mobileAppEnvironment? = inject<AppEnvironment>(
    MOBILE_APP_ENVIRONMENT_CONFIG,
    { optional: true }
  );

  #currentEnvironment: AppEnvironment = 'production';

  public environmentConfiguration: EnvironmentConfiguration = {
    appType: 'unknown',
  };

  constructor() {
    const mobileAppEnvironment = this.mobileAppEnvironment;

    // Set app type from injected configuration if available
    if (this.envConfig?.appType) {
      this.environmentConfiguration.appType = this.envConfig.appType;
    }

    if (mobileAppEnvironment) {
      this.#currentEnvironment = mobileAppEnvironment;
      return;
    }

    // Hack for local development. Need that for the "getUIConfiguration call...".
    if (window.location.hostname.includes('.aglender.com')) {
      this.#currentEnvironment = 'local';
      return;
    }

    // Hack for test environment. Need that for the "getUIConfiguration call...".
    if (
      window.location.hostname === 'clients-test.landjourney.ai' ||
      window.location.hostname === 'admin-test.landjourney.ai' ||
      window.location.hostname === 'clients-mobile-test.landjourney.ai'
    ) {
      this.#currentEnvironment = 'test';
      return;
    }

    if (window.location.hostname.endsWith('local.landjourney.ai')) {
      this.#currentEnvironment = 'local';
      return;
    }

    if (window.location.hostname.endsWith('integration.landjourney.ai')) {
      this.#currentEnvironment = 'integration';
      return;
    }

    if (window.location.hostname.endsWith('test.landjourney.ai')) {
      this.#currentEnvironment = 'test';
      return;
    }

    if (window.location.hostname.endsWith('integration.landjourney.ai')) {
      this.#currentEnvironment = 'integration';
      return;
    }

    // Custom domains will always default to production
    this.#currentEnvironment = 'production';
  }

  setEnvironmentConfiguration(configuration: unknown) {
    Object.assign(this.environmentConfiguration, configuration);
  }

  getEnvironment(): AppEnvironment {
    return this.#currentEnvironment;
  }

  setPsPdfKey(licenseKey: string | undefined | null) {
    if (!licenseKey) {
      return;
    }

    this.environmentConfiguration.pspdfLicenseKey = licenseKey;
  }

  setNovuApplicationIdentifier(identifier: string | undefined | null) {
    if (!identifier) {
      return;
    }

    this.environmentConfiguration.novuApplicationIdentifier = identifier;
  }

  setEnvironment(environment?: string) {
    if (!environment) {
      return;
    }

    if (this.mobileAppEnvironment) {
      return;
    }

    this.#currentEnvironment = environment as AppEnvironment;
  }

  isLocal(): boolean {
    return this.#currentEnvironment === 'local';
  }

  isIntegration(): boolean {
    return this.#currentEnvironment === 'integration';
  }

  isTest(): boolean {
    return this.#currentEnvironment === 'test';
  }

  isProduction(): boolean {
    return this.#currentEnvironment === 'production';
  }

  // GET THE DIFFERENT CONFIGURATIONS

  getNovuApplicationIdentifier(): string {
    return this.environmentConfiguration.novuApplicationIdentifier ?? '';
  }

  getAppType(): 'backoffice' | 'web' | 'unknown' {
    return this.environmentConfiguration.appType;
  }
  getPsPdfKey(): string {
    return this.environmentConfiguration.pspdfLicenseKey ?? '';
  }
}
