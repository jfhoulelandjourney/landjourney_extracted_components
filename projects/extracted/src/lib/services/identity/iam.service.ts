import { Injectable, Injector, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import pako from 'pako';
import {
  BehaviorSubject,
  filter,
  Observable,
  shareReplay,
  Subject,
} from 'rxjs';
import { RemoveLink, ShareLink } from '../../models/shareLinks';
import {
  UpdateMeUserSettingsSchema,
  UserProfile,
  type CoreUpdateExecuteSchema,
  type CoreUpdateRequest,
  type CoreUpdateResponseSchema,
} from '../../models/userModels';
import { isNil, isNonNullable, isNull } from '../../utils/nullishUtil';
import { TimeUtil } from '../../utils/timeUtil';
import {
  ApiMessage,
  ApiService,
  LandjourneyAgents,
  ServiceConfiguration,
} from '../api/api.service';
import { ClientLoansService } from '../client/loans/client-loans.service';
import { ClientRequestsService } from '../client/requests/client-requests.service';
import { UserActivityService } from './userActivity';

export enum AuthMessages {
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  LOGOUT = 'LOGOUT',
}

export enum SocialLoginProviders {
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
}

export interface OrganizationMembership {
  userId: string;
  name: string;
  key: 'root';
  root: boolean;
  groups: string[];
  permissions: Record<string, number>;
  featureFlags?: Record<string, boolean>;
}

export interface JWTToken {
  iss: string;
  user_id: string;
  email: string;
  name: string;
  picture: string;
  iat: number;
  exp: number;
  groups: string[];
  organizations?: Record<string, OrganizationMembership>;
  scope?: string[];
}

interface LogoutExclusion {
  path: string;
  fullMatch: boolean;
}

const LOGOUT_EXCLUDED_PATH: LogoutExclusion[] = [
  { path: '/login', fullMatch: true },
  { path: '/login/reset', fullMatch: false },
  { path: '/login/complete', fullMatch: false },
  { path: '/forms/embed', fullMatch: false },
];

function shouldRedirect(): boolean {
  const fullPath = window.location.pathname.toLowerCase();

  for (const exclusion of LOGOUT_EXCLUDED_PATH) {
    if (exclusion.fullMatch) {
      if (fullPath === exclusion.path) {
        return false;
      }
    } else {
      if (fullPath.startsWith(exclusion.path)) {
        return false;
      }
    }
  }

  return true;
}

@Injectable({
  providedIn: 'root',
})
export class IAMService {
  private apiService = inject(ApiService);
  private userActivityService = inject(UserActivityService);
  private router = inject(Router);
  private injector = inject(Injector);
  private dialogRef = inject(MatDialog);

  private serviceConfiguration: ServiceConfiguration;
  private activeToken: string = localStorage.getItem('token') || '';
  private activeUser: UserProfile | null = null;
  private jwtToken: JWTToken | null = null;
  private tokenRefreshTimer: number | null = null;
  private pendingLoginTimer: ReturnType<Window['setInterval']> | null = null;
  private loggedInSubject = new BehaviorSubject(false);
  private returnUrl: string | undefined = undefined;
  private sharedDomainAuthentication = false;

  public authServiceMessages = new Subject<AuthMessages>();
  public loggedIn$ = this.loggedInSubject.asObservable();

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.IAM;

    if (this.isLoggedIn()) {
      this.loggedInSubject.next(true);
    }

    setTimeout(() => {
      if (!this.isLoggedIn()) {
        this.registerPendingLoginTimer();
        this.activeUser = null;
      }
    }, 1000);

    this.registerTokenRefreshCheckTimer();

    this.router.events.subscribe({
      next: _event => {
        if (this.isLoggedIn()) {
          this.userActivityService.registerActivity();
        }
      },
    });

    this.apiService.activity.subscribe({
      next: () => {
        if (this.isLoggedIn()) {
          this.userActivityService.registerActivity();
        }
      },
    });
  }

  private registerTokenRefreshCheckTimer() {
    this.tokenRefreshTimer = window.setInterval(
      () => this.checkTokenRefresh(),
      1000 * 60 // Every minute.
    );
  }

  private unregisterTokenRefreshCheckTimer() {
    window.clearInterval(this.tokenRefreshTimer ?? undefined);
  }

  private checkTokenRefresh() {
    if (!this.isLoggedIn()) {
      return;
    }

    this.checkTokenExpired(this.getToken());

    const token = this.getJWTFromToken();

    if (!token) {
      return;
    }

    if (this.userActivityService.userShouldRefreshToken()) {
      this.refreshToken();
    }
  }

  private registerPendingLoginTimer() {
    this.pendingLoginTimer = window.setInterval(
      () => this.checkTokenChange(),
      250
    );
  }

  private checkTokenChange() {
    const storedToken = localStorage.getItem('token') || '';

    if (storedToken !== this.activeToken) {
      this.activeToken = storedToken;
      if (this.activeToken === '') {
        this.authServiceMessages.next(AuthMessages.LOGOUT);
      } else {
        this.authServiceMessages.next(AuthMessages.TOKEN_REFRESH);
      }

      clearInterval(this.pendingLoginTimer ?? undefined);
    }
  }

  private getJWTFromToken(): JWTToken | null {
    if (isNil(this.activeToken) || this.activeToken.trim() === '') {
      return null;
    }

    if (isNil(this.jwtToken)) {
      try {
        const claims = this.activeToken.split('.')[1];
        if (isNil(claims)) {
          throw new Error('Token is not valid.');
        }
        this.jwtToken = JSON.parse(atob(claims));
        return this.jwtToken;
      } catch {
        return null;
      }
    } else {
      return this.jwtToken;
    }
  }

  public getJWTToken(): JWTToken | null {
    return this.getJWTFromToken();
  }

  private checkTokenExpired(token: string) {
    try {
      const decodedToken: JwtPayload = jwtDecode(token);
      const exp: number = decodedToken?.exp || 0;

      if (exp - 30 <= TimeUtil.getTimestampSeconds()) {
        console.error('Token expired, logging out.');
        this.logout();
      }
    } catch (error) {
      console.error(
        'An error happened when decoding the token in checkTokenEpired.',
        error
      );
      this.logout();
    }
  }

  public setSharedDomainAuthentication(sharedDomain: boolean) {
    this.sharedDomainAuthentication = sharedDomain;

    if (this.isLoggedIn() && sharedDomain) {
      this.navigateToTenantSelection();
    }
  }

  public setActiveOrganization(
    organizationId: string,
    organizationUserId: string
  ) {
    if (this.activeUser) {
      const activeUser = structuredClone(this.activeUser);

      activeUser.activeOrganization = organizationId;
      activeUser.activeOrganizationUserId =
        organizationUserId || activeUser.activeOrganizationUserId;
      this.setActiveUser(activeUser);
    }
  }

  public isSharedDomainAuthentication(): boolean {
    return this.sharedDomainAuthentication;
  }

  public navigateToTenantSelection(forcedSelection: string | null = null) {
    const path = window.location.pathname.toLowerCase();

    if (
      path.startsWith('/auth/code') ||
      path.startsWith('/login/complete') ||
      path.startsWith('/signup') ||
      path.startsWith('/login/reset')
    ) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);

    const organizationParam =
      (forcedSelection ?? urlParams.get('organization'))
        ? `&organization=${forcedSelection ?? urlParams.get('organization')}`
        : '';

    this.router.navigateByUrl(
      `/login/complete?token=${this.getToken(true)}&redirect=true${organizationParam}`
    );
  }

  public setReturnUrl(path_only: string | undefined) {
    if (this.returnUrl && !path_only) {
      return;
    }

    this.returnUrl = path_only;
  }

  public redirectAfterLogin(defaultPath: string | undefined = undefined) {
    if (this.isSharedDomainAuthentication()) {
      this.navigateToTenantSelection();
    } else {
      if (this.returnUrl) {
        this.router.navigateByUrl(this.returnUrl, { state: {} });
        this.returnUrl = undefined;
      } else {
        if (defaultPath) {
          this.router.navigateByUrl(defaultPath, { state: {} });
        }
      }
    }
  }

  public getSocialLoginUrl(
    socialLoginProvider: SocialLoginProviders,
    agent: LandjourneyAgents = LandjourneyAgents.MOBILE,
    backoffice = false
  ): string {
    let organizationKey =
      this.apiService.organizationKey ??
      window.location.hostname.split('.')[0] ??
      'app';
    if (
      ['backoffice', 'app', 'mobile'].includes(organizationKey?.toLowerCase())
    ) {
      organizationKey = 'NO_ORGANIZATION_KEY_PROVIDED';
    }

    return `${this.serviceConfiguration.getBaseServiceUrl()}/login/${socialLoginProvider.toLowerCase()}?x-landjourney-agent=${agent}&backoffice=${backoffice}&organization=${organizationKey}`;
  }

  public setToken(token: string): void {
    try {
      const realToken = this.decompressToken(token);
      this.checkTokenExpired(realToken);
      localStorage.setItem('compressedToken', token);
      localStorage.setItem('token', realToken);
      this.activeToken = realToken;
      this.jwtToken = null; // Clear cached JWT token to force re-decoding
      this.authServiceMessages.next(AuthMessages.TOKEN_REFRESH);
      this.loggedInSubject.next(true);
    } catch (error) {
      console.error(
        'An error happened when decoding the token in setToken',
        error
      );
      this.logout();
    }
  }

  private resetUserActivityService() {
    const jwtToken = this.getJWTFromToken();

    if (jwtToken) {
      const currentTimestamp = TimeUtil.getTimestampSeconds();
      const timeout = jwtToken.exp - currentTimestamp;
      this.userActivityService.reset(timeout);
    }
  }

  private decompressToken(compressedToken: string): string {
    try {
      const urlSafeBase64Decode = (base64String: string) => {
        base64String = base64String.replace(/-/g, '+').replace(/_/g, '/');
        while (base64String.length % 4) {
          base64String += '=';
        }
        const binaryString = atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const compressedData = urlSafeBase64Decode(compressedToken);

      return pako.inflate(compressedData, { to: 'string' });
    } catch (error) {
      console.error('there was an error, fallback to original', error);

      return compressedToken;
    }
  }

  public getToken(compressed = false): string {
    try {
      this.checkTokenExpired(this.activeToken);

      return compressed
        ? (localStorage.getItem('compressedToken') ?? 'NO_TOKEN_IN_STORAGE')
        : this.activeToken;
    } catch (error) {
      console.error(
        'An error happened when decoding the token in getToken',
        error
      );
      this.logout();
      return 'TOKEN_EXPIRED';
    }
  }

  public getPictureFromToken(): string {
    try {
      const token: JWTToken | null = this.getJWTFromToken();
      if (isNull(token)) {
        return '/assets/misc/avatar.svg';
      }

      const picture: string = token?.picture;

      if (isNil(picture) || picture.trim() === '') {
        return '/assets/misc/avatar.svg';
      } else {
        return picture;
      }
    } catch {
      return '/assets/misc/avatar.svg';
    }
  }

  public isLoggedIn(): boolean {
    const token = localStorage.getItem('token') ?? '';

    if (token && token !== '') {
      this.activeToken = token;
      return true;
    } else {
      this.activeToken = '';
      return false;
    }
  }

  public refreshToken(): void {
    this.apiService
      .get<{
        token: string;
      }>(this.serviceConfiguration, '/token/refresh', {}, true)
      .subscribe({
        next: value => {
          this.setToken(value.token);
        },
        error: _error => {
          // Already handled
        },
      });
  }

  public getOwnProfile(): Observable<UserProfile> {
    return this.apiService
      .get<UserProfile>(this.serviceConfiguration, '/users/me', {}, true)
      .pipe(filter(isNonNullable), shareReplay(1));
  }

  public initiateCoreUpdate(
    args: CoreUpdateRequest
  ): Observable<CoreUpdateResponseSchema> {
    return this.apiService.put<CoreUpdateResponseSchema>(
      this.serviceConfiguration,
      '/users/me/core-update',
      args
    );
  }

  public executeCoreUpdate(args: CoreUpdateExecuteSchema): Observable<string> {
    return this.apiService.post<string>(
      this.serviceConfiguration,
      '/users/me/core-update',
      args
    );
  }

  public updateOwnProfile(update: UpdateMeUserSettingsSchema) {
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/users/me`,
      update
    );
  }

  public removeConditionsFromActiveUser() {
    if (this.activeUser) {
      this.activeUser.conditionsToAccept = [];
      this.setActiveUser(this.activeUser);
    }
  }

  getAvailableOrganizations(): Record<string, OrganizationMembership> {
    if (this.activeUser && this.isLoggedIn()) {
      const token: JWTToken | null = this.getJWTFromToken();

      if (token) {
        return token.organizations ?? {};
      }
    }

    return {};
  }

  public getActiveUser(): UserProfile | null {
    if (this.activeUser && this.isLoggedIn()) {
      return this.activeUser;
    } else {
      const localSavedUser = localStorage.getItem('activeUser');
      if (localSavedUser && this.isLoggedIn()) {
        try {
          const decodedValue = atob(localSavedUser);
          this.activeUser = JSON.parse(decodedValue);
          return this.activeUser;
        } catch (error) {
          console.error(
            'An error happened when decoding the active user.',
            error
          );
          return null;
        }
      }
      return null;
    }
  }

  public setActiveUser(user: UserProfile, resetClientServices = false) {
    if (!user) {
      throw new Error('User cannot be null.');
    }
    this.activeUser = structuredClone(user);
    user.conditionsToAccept = undefined;
    localStorage.setItem('activeUser', btoa(JSON.stringify(user)));
    this.resetUserActivityService();
    this.loggedInSubject.next(true);

    if (resetClientServices) {
      const clientRequestsService = this.injector.get(ClientRequestsService);
      const clientLoansService = this.injector.get(ClientLoansService);
      clientRequestsService.reset();
      clientLoansService.reset();
    }
  }

  public initiateEmailLogin(
    email: string,
    password: string,
    backoffice = false
  ) {
    return this.apiService.post(
      this.serviceConfiguration,
      `/login/traditional?backoffice=${backoffice}`,
      {
        email: email,
        password: password,
      }
    );
  }

  public completeEmailLogin(
    email: string,
    password: string,
    code: string,
    backoffice = false
  ): Observable<{ token?: string }> {
    return this.apiService.post<{ token?: string }>(
      this.serviceConfiguration,
      `/login/traditional?backoffice=${backoffice}`,
      {
        email: email,
        password: password,
        code: code,
      }
    );
  }

  public completeLoginWithLink(
    authentication_token: string,
    path: string | undefined,
    organization: string | undefined
  ) {
    const apiUrl: string = this.serviceConfiguration.getBaseServiceUrl();

    let redirectUrl = `${apiUrl}/auth/link?token=${authentication_token}`;
    this.returnUrl = undefined;

    if (path) {
      redirectUrl = `${redirectUrl}&path=${path}&organization=${organization ?? this.apiService.organizationKey}`;
    } else {
      redirectUrl = `${redirectUrl}&organization=${organization ?? this.apiService.organizationKey}`;
    }

    window.location.href = redirectUrl;
  }

  public completeMobileLoginWithLink(authentication_token: string): Observable<{
    authorizationToken?: string;
    redirectPath?: string;
    message?: string;
  }> {
    return this.apiService.get(
      this.serviceConfiguration,
      `/auth/link?token=${authentication_token}&redirect=false`
    );
  }

  public async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('compressedToken');

    this.dialogRef.closeAll();

    this.checkTokenChange();
    this.clearTimers();

    this.activeUser = null;
    this.jwtToken = null; // Clear cached JWT token
    this.authServiceMessages.next(AuthMessages.LOGOUT);

    if (shouldRedirect()) {
      this.router.navigateByUrl('/login');
    }

    this.loggedInSubject.next(false);
    this.unregisterTokenRefreshCheckTimer();

    this.apiService.get(this.serviceConfiguration, '/logout').subscribe({
      next: () => {
        // Done
      },
    });

    setTimeout(() => this.registerPendingLoginTimer(), 1000);
  }

  getShareLinks(resourceId: string | null, userId: string | null) {
    let path = 'resources';
    let id: string | null = resourceId;

    if (userId) {
      path = 'users';
      id = userId;
    }

    return this.apiService.get<ShareLink[]>(
      this.serviceConfiguration,
      `/share/${path}/${id}`
    );
  }

  createShareLink(shareLink: ShareLink) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      '/share',
      shareLink
    );
  }

  createShareLinks(shareLinks: ShareLink[]) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      '/share/batch',
      { shareLinks }
    );
  }

  removeShareLink(linkId: string) {
    const removeLink: RemoveLink = {
      id: linkId,
      disabled: true,
      disabledReason: `Disabled by user ${this.getActiveUser()?.id}`,
    };
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/share/${linkId}`,
      removeLink
    );
  }

  public clearTimers() {
    if (isNonNullable(this.pendingLoginTimer))
      clearInterval(this.pendingLoginTimer);
  }

  public getUserGroups(organizationId: string): string[] {
    const token: string = this.activeToken;

    if (token) {
      try {
        const base64Token = token.split('.')[1];
        if (!base64Token) {
          throw new Error('Token is not valid.');
        }
        const parsedToken = JSON.parse(atob(base64Token));
        const groups = parsedToken.organizations[organizationId]?.groups;

        return groups;
      } catch {
        return [];
      }
    }

    return [];
  }

  // TODO: Investigate the return type of this function
  public getUserPermissions(organizationId: string): Record<string, number> {
    const token: string = this.activeToken;

    if (token) {
      try {
        const base64Token = token.split('.')[1];

        if (!base64Token) {
          throw new Error('Token is not valid.');
        }

        const parsedToken = JSON.parse(atob(base64Token));
        const permissions =
          parsedToken.organizations[organizationId]?.permissions;

        return permissions;
      } catch {
        return {};
      }
    }

    return {};
  }

  readUser(username: string): Observable<UserProfile[]> {
    return this.apiService.get(this.serviceConfiguration, `/${username}`);
  }

  currentUserIsMemberOfRootOrganization() {
    const token: string = this.activeToken;

    if (token) {
      try {
        const base64Token = token.split('.')[1];

        if (!base64Token) {
          throw new Error('Token is not valid.');
        }

        const parsedToken = JSON.parse(atob(base64Token));
        for (const organizationId of Object.keys(parsedToken.organizations)) {
          if (parsedToken.organizations[organizationId].root) {
            return true;
          }
        }
      } catch {
        return false;
      }
    }

    return false;
  }
}
