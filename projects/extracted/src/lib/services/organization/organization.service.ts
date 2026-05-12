import { inject, Injectable, type OnDestroy } from '@angular/core';
import { isUndefined, omitBy } from 'es-toolkit';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { Address } from '../../models/addressModels';
import { SystemGroups } from '../../models/authModels';
import { Business, BusinessQueryResult } from '../../models/businessModels';
import {
  FeatureFlag,
  Group,
  Organization,
} from '../../models/organizationModels';
import type { Retailer } from '../../models/retailersModel';
import {
  BasicUserProfile,
  SafeUserCreate,
  UpdateOrganizationUserSchema,
  UserProfile,
  UserQueryResult,
} from '../../models/userModels';
import {
  PaginatedApiQueryOptions,
  type ApiQueryParameters,
} from '../api/api.models';
import {
  ApiMessage,
  ApiService,
  ServiceConfiguration,
} from '../api/api.service';
import { CacheService } from '../cache/cache.service';
import { EnvironmentService } from '../environment/environment.service';
import { IAMService } from '../identity/iam.service';
import { Condition } from './conditions.models';
import {
  OrganizationUIConfiguration,
  type PasswordResetArgs,
  type PasswordResetResponse,
  type QueryOptions,
  type UnauthenticatedInitiatePasswordResetMethod,
  type UserQueryParams,
} from './organization.models';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService implements OnDestroy {
  private apiService = inject(ApiService);
  private iamService = inject(IAMService);
  private environmentService = inject(EnvironmentService);
  private cacheService = inject(CacheService);

  private serviceConfiguration: ServiceConfiguration;

  public readonly uiConfiguration$ =
    new BehaviorSubject<OrganizationUIConfiguration | null>(null);

  public readonly sharedDomainUiConfigurations$ = new BehaviorSubject<
    OrganizationUIConfiguration[]
  >([]);

  private selectedOrganizationKey: string | null = null;
  private destroy$ = new Subject<void>();

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.IAM;

    this.selectedOrganizationKey = localStorage.getItem(
      'selectedOrganizationKey'
    );

    this.iamService.loggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loggedIn => {
        if (!loggedIn) {
          this.setSelectedOrganization(null);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ORGANIZATION UI PARAMS
  public sharedDomainUiConfigurations: OrganizationUIConfiguration[] = [];

  public uiConfiguration: OrganizationUIConfiguration = {
    id: '',
    name: '',
    dnsPrefix: '',
    logoUri: '',
    logoUriSmall: '',
    colors: {
      primary: {
        color: '',
        variations: {},
      },
      secondary: {
        color: '',
        variations: {},
      },
      tertiary: {
        color: '',
        variations: {},
      },
    },
    activatedFeatures: [],
    defaultGroups: [],
    novuApplicationIdentifier: '',
    sharedDomain: false,
    contactDetails: '',
    allowCollaboratorsToTriggerBorrowerCreditCheck: false,
    allowCollaboratorsToValidateBorrowerIdentity: false,
    fileExportConfiguration: {
      separator: '_',
      exportFilename: [],
      filenameAssignedTask: [],
      filenameCommonTask: [],
      folderStructureAssignedTask: [],
      folderStructureCommonTask: [],
    },
  };

  public setSelectedOrganization(organizationKey: string | null) {
    this.selectedOrganizationKey = organizationKey;
    localStorage.setItem('selectedOrganizationKey', organizationKey ?? '');
  }

  public getSelectedOrganization(): string | null {
    if (
      this.selectedOrganizationKey &&
      this.selectedOrganizationKey.trim() === ''
    ) {
      return null;
    }

    return this.selectedOrganizationKey;
  }

  getOrganizationKey(): string {
    if (this.configurationIsValid()) {
      return this.uiConfiguration.dnsPrefix;
    }

    return this.apiService.getOrganizationKeyFromHost();
  }

  upsertUIConfiguration(
    configuration: OrganizationUIConfiguration,
    setAsActive = false
  ) {
    if (setAsActive) {
      this.setUIConfiguration(configuration);
      this.setColors(configuration);
    }

    this.sharedDomainUiConfigurations.filter(c => c.id !== configuration.id);
    this.sharedDomainUiConfigurations.push(configuration);
  }

  setUIConfiguration(
    configuration: OrganizationUIConfiguration,
    saveInCache = true
  ) {
    this.uiConfiguration = configuration;
    this.uiConfiguration$.next(configuration);
    this.iamService.setSharedDomainAuthentication(configuration.sharedDomain);
    this.iamService.setActiveOrganization(
      configuration.id,
      configuration.organizationUserId ?? ''
    );

    if (saveInCache) {
      const appType = this.environmentService.getAppType();
      const cacheKey = `uiConfiguration_${appType}`;
      // Cache for 48 hours (2880 minutes)
      this.cacheService.put(cacheKey, configuration, 2880);
    }

    if (this.configurationIsValid()) {
      this.apiService.organizationKey = configuration.dnsPrefix;
    }
  }

  setColors(configuration: OrganizationUIConfiguration) {
    if (!this.isFeatureFlagActivated('CUSTOM_BRAND_COLOR')) {
      return;
    }

    this.setColor(
      'primary',
      configuration.colors.primary.color,
      configuration.colors.primary.variations
    );
    this.setColor(
      'secondary',
      configuration.colors.secondary.color,
      configuration.colors.secondary.variations
    );
    this.setColor(
      'tertiary',
      configuration.colors.tertiary.color,
      configuration.colors.tertiary.variations
    );
    const body = document.getElementById('application-body');
    if (body) {
      body.classList.remove(`default-colors`);
      body.classList.add(`custom-colors`);
    }
  }

  setColor(
    type: 'primary' | 'secondary' | 'tertiary',
    color: string,
    variations: Record<string, string>
  ) {
    const body = document.getElementById('application-body');

    if (!body) {
      return;
    }

    if (color && color.trim() !== '') {
      body.style.setProperty(`--brand-${type}`, color);
    }

    for (const variation of Object.keys(variations)) {
      const variationColor = variations[variation];
      if (variationColor && variationColor.trim() !== '') {
        body.style.setProperty(`--brand-${type}-${variation}`, variationColor);
      }
    }

    const html = document.getElementById('application-html');

    if (!html) {
      return;
    }

    if (color && color.trim() !== '') {
      html.style.setProperty(`--html-brand-${type}`, color);
    }

    for (const variation of Object.keys(variations)) {
      const variationColor = variations[variation];
      if (variationColor && variationColor.trim() !== '') {
        html.style.setProperty(
          `--html-brand-${type}-${variation}`,
          variationColor
        );
      }
    }
  }

  setSharedDomainUIConfigurations(
    configurations: OrganizationUIConfiguration[]
  ) {
    this.sharedDomainUiConfigurations = configurations;
    this.sharedDomainUiConfigurations$.next(configurations);
  }

  configurationIsValid(): boolean {
    return this.uiConfiguration.dnsPrefix !== 'hello@landjourney.ai';
  }

  getEmailAddress(emailKey: string): string | null {
    if (this.uiConfiguration.emails) {
      const email = this.uiConfiguration.emails[emailKey];
      if (email) {
        return email;
      }
    }

    return null;
  }

  getTenantName(): string {
    if (this.configurationIsValid()) {
      return this.uiConfiguration.name;
    }

    return 'LandJourney';
  }

  getLogo(small = false): string {
    if (this.configurationIsValid()) {
      if (small && this.uiConfiguration.logoUriSmall.trim() !== '') {
        return this.uiConfiguration.logoUriSmall;
      }

      if (!small && this.uiConfiguration.logoUri.trim() !== '') {
        return this.uiConfiguration.logoUri;
      }
    }

    return this.getLogoFromOrganizationKey(this.getOrganizationKey(), small);
  }

  getLogoFromOrganizationKey(organizationKey: string, small = false) {
    if (small) {
      switch (organizationKey) {
        case 'landjourney':
          return '/assets/logos/landjourney-logo-small-white.svg';
        case 'root':
          return '/assets/logos/landjourney-logo-small-white.svg';
        case 'demo':
          return '/assets/misc/external-logos/dakota-mac-small-logo.svg';
        case 'aglender':
          return '/assets/misc/external-logos/aglender-logo-small-white.png';
        default:
          return '/assets/logos/landjourney-logo-small-white.svg';
      }
    } else {
      switch (organizationKey) {
        case 'landjourney':
          return '/assets/logos/landjourney-logo-white.svg';
        case 'root':
          return '/assets/logos/landjourney-logo-white.svg';
        case 'demo':
          return '/assets/misc/external-logos/dakota-mac-logo.svg';
        case 'aglender':
          return '/assets/misc/external-logos/aglender-logo-white.png';
        default:
          return '/assets/logos/landjourney-logo-white.svg';
      }
    }
  }

  // CONDITIONS

  public getAllConditions() {
    return this.apiService.get<Condition[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/conditions`
    );
  }

  public createCondition(condition: Condition) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/conditions`,
      condition
    );
  }

  public updateCondition(condition: Condition) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/conditions/${condition.id}`,
      condition
    );
  }

  public deleteCondition(condition: Condition) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/conditions/${condition.id}`
    );
  }

  public acceptCondition(condition: Condition) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/conditions/${condition.id}/accept`,
      {}
    );
  }

  public getAllConditionsForUser() {
    return this.apiService.get<Condition[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/conditions/me/accepted`
    );
  }

  // FEATURE FLAGS

  public getOrganizations(options?: { searchTerm?: string }) {
    const { searchTerm } = options ?? {};
    const searchParameters = new URLSearchParams();
    if (searchTerm) {
      searchParameters.set('search_term', searchTerm);
    }
    const queryString =
      searchParameters.size > 0 ? `?${searchParameters.toString()}` : '';
    return this.apiService.get<Organization[]>(
      this.serviceConfiguration,
      `/organizations${queryString}`
    );
  }

  public getGlobalFeatureFlags() {
    return this.apiService.get<FeatureFlag[]>(
      this.serviceConfiguration,
      '/features'
    );
  }

  public getOrganizationFeatureFlags(organizationId: string) {
    return this.apiService.get<FeatureFlag[]>(
      this.serviceConfiguration,
      `/features/organizations/${organizationId}`
    );
  }

  public updateGlobalFeatureFlags(featureFlags: FeatureFlag[]) {
    return this.apiService.put(
      this.serviceConfiguration,
      '/features',
      featureFlags
    );
  }

  public updateOrganizationFeatureFlags(
    organizationId: string,
    featureFlags: FeatureFlag[]
  ) {
    return this.apiService.put(
      this.serviceConfiguration,
      `/features/organizations/${organizationId}`,
      featureFlags
    );
  }

  public getAllFeatureFlags() {
    return this.apiService.get<Record<string, FeatureFlag[]>>(
      this.serviceConfiguration,
      '/features/all'
    );
  }

  public isDemoModeActivated(): boolean {
    return this.uiConfiguration.activatedFeatures.includes('DEMO_MODE');
  }

  public isFeatureFlagActivated(featureFlagName: string): boolean {
    if (
      this.uiConfiguration.activatedFeatures.includes('ALL') &&
      featureFlagName !== 'PSPDF_DIGITAL_SIGNATURE_ENABLED'
    ) {
      return true;
    }

    const featureFlag = this.uiConfiguration.activatedFeatures.find(
      feature => feature === featureFlagName
    );

    if (featureFlag) {
      return true;
    }

    // If not found in UI configuration, check JWT token feature flags
    const jwtToken = this.iamService.getJWTToken();
    if (jwtToken?.organizations) {
      const currentOrganizationId = this.getOrganizationId();
      const organization = jwtToken.organizations[currentOrganizationId];

      if (
        organization?.featureFlags &&
        organization.featureFlags[featureFlagName] === true
      ) {
        return true;
      }
    }

    return false;
  }

  // ORGANIZATION

  public getOrganizationId(): string {
    return (
      this.uiConfiguration.id ??
      this.iamService.getActiveUser()?.activeOrganization ??
      ''
    );
  }

  public getOrganizationUserId(): string {
    return (
      this.uiConfiguration.organizationUserId ??
      this.iamService.getActiveUser()?.activeOrganizationUserId ??
      ''
    );
  }

  public getOrganizationUserDigest(): string {
    return (
      this.uiConfiguration.userDigest ??
      this.iamService.getActiveUser()?.digest ??
      ''
    );
  }

  public getOrganizationConfiguration() {
    return this.apiService.get<Organization>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}`
    );
  }

  public saveOrganizationConfiguration(organization: Organization) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}`,
      organization
    );
  }

  public getOrganizationSettings(
    organizationKey: string,
    options: Parameters<ApiService['get']>[3]
  ) {
    return this.apiService.get<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${organizationKey}/configuration`,
      null,
      options
    );
  }

  public getAllSharedDomains() {
    return this.apiService.get<Organization[]>(
      this.serviceConfiguration,
      '/organizations/shared-domains'
    );
  }

  // UI CONFIGURATION

  public getUIConfiguration() {
    return this.apiService.get<OrganizationUIConfiguration>(
      this.serviceConfiguration,
      '/organizations/external/ui-configuration'
    );
  }

  public getCachedUIConfiguration(): OrganizationUIConfiguration | undefined {
    const appType = this.environmentService.getAppType();
    const cacheKey = `uiConfiguration_${appType}`;

    const cachedConfiguration = this.cacheService.get(
      cacheKey
    ) as OrganizationUIConfiguration | null;

    if (cachedConfiguration) {
      const saveCache = false;
      this.setUIConfiguration(cachedConfiguration, saveCache);
      return cachedConfiguration;
    }

    return undefined;
  }

  public getSharedDomainConfigurations(mainOrganizationId: string) {
    return this.apiService.get<OrganizationUIConfiguration[]>(
      this.serviceConfiguration,
      `/organizations/${mainOrganizationId}/shared-domains`
    );
  }

  // USERS

  public initiatePasswordReset(userId: string, organizationId?: string) {
    const organizationIdToUse = organizationId ?? this.getOrganizationId();
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${organizationIdToUse}/users/${userId}/password-reset/initiate`,
      {},
      true
    );
  }

  public initiatePasswordResetClientWithEmail(email: string) {
    return this.apiService.post<UnauthenticatedInitiatePasswordResetMethod>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/password-reset/initiate`,
      {
        email: email.trim(),
      },
      true
    );
  }

  public executePasswordReset(args: PasswordResetArgs) {
    return this.apiService.post<PasswordResetResponse>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/${args.organizationUserId}/password-reset/complete`,
      args,
      true
    );
  }

  public getUsers(
    groups: (SystemGroups | string)[],
    includeDisabled = false,
    options: QueryOptions = {},
    bypassCache = false
  ) {
    const {
      includeDisabled: inclDisabled,
      pageSize,
      sortDirection,
      retailerId,
      ...rest
    } = {
      ...options,
      groups,
      includeDisabled,
    } satisfies UserQueryParams;

    const params = omitBy(
      {
        ...rest,
        include_disabled: inclDisabled,
        page_size: pageSize,
        sort_direction: sortDirection,
        retailer_id: retailerId,
      },
      isUndefined
    );

    return this.apiService.get<UserQueryResult>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users`,
      params,
      bypassCache
    );
  }

  public searchUsers(
    searchExpression: string,
    employeesOnly = false,
    groups: string[] | null = null,
    customersOnly = false
  ) {
    const queryParams: UserQueryParams = {
      search: searchExpression,
    };

    if (employeesOnly) {
      queryParams['groups'] = SystemGroups.EMPLOYEES;
    }

    if (customersOnly) {
      queryParams['groups'] = SystemGroups.CUSTOMERS;
    }

    if (groups) {
      const groupFilter: string = groups.join(',');

      if (queryParams['groups']) {
        queryParams['groups'] = [queryParams['groups'], groupFilter].join(',');
      } else {
        queryParams['groups'] = groupFilter;
      }
    }

    return this.apiService.get<UserProfile[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users`,
      queryParams,
      true
    );
  }

  public getUsersFromIdsAndDigest(users: string[], digest: string) {
    const queryParams = {
      users: users.join(','),
      digest: digest,
    };

    return this.apiService.get<BasicUserProfile[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users`,
      queryParams,
      true
    );
  }

  public getUser(userId: string) {
    return this.apiService.get<UserProfile>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/${userId}`,
      null,
      true
    );
  }

  public updateUser(update: UpdateOrganizationUserSchema) {
    const organizationId = update.organizationId? update.organizationId : this.getOrganizationId();
    return this.apiService.patch<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${organizationId}/users/${update.userId}`,
      update
    );
  }

  public safeAddUserToOrganization(user: SafeUserCreate) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/safe`,
      user
    );
  }

  public safeAddUsersToOrganization(users: SafeUserCreate[]) {
    return this.apiService.post<ApiMessage[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/batch`,
      { users, organizationId: this.getOrganizationId() }
    );
  }

  public saveUserInOrganization(user: SafeUserCreate) {
    if (!user.id) {
      return;
    }
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/${user.id}`,
      user
    );
  }

  public deleteUserFromOrganization(userId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/${userId}`
    );
  }

  // GROUPS

  public addUserToGroup(userId: string, groupId: string, organizationId?: string) {
    const selectedOrganizationId = organizationId? organizationId : this.getOrganizationId();
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${selectedOrganizationId}/groups/${groupId}/users/${userId}`,
      {}
    );
  }

  public removeUserFromGroup(userId: string, groupId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/groups/${groupId}/users/${userId}`
    );
  }

  public createGroup(group: Group) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/groups`,
      group
    );
  }

  public getGroups(workgroupsOnly = false, organizationId?: string) {
    let queryParams = undefined;

    if (workgroupsOnly) {
      queryParams = {
        workgroups_only: true,
      };
    }
    const selectedOrganizationId = organizationId? organizationId : this.getOrganizationId();

    return this.apiService.get<Group[]>(
      this.serviceConfiguration,
      `/organizations/${selectedOrganizationId}/groups`,
      queryParams
    );
  }

  public getGroup(groupId: string) {
    return this.apiService.get<Group>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/groups/${groupId}`
    );
  }

  public saveGroup(group: Group) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/groups/${group.id}`,
      group
    );
  }

  public deleteGroup(groupId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/groups/${groupId}`
    );
  }

  // BUSINESSES

  public getBusinessUsers(businessId: string) {
    return this.apiService.get<UserProfile[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}/users`
    );
  }

  public addUserToBusiness(userId: string, businessId: string) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}/users/${userId}`,
      {}
    );
  }

  public removeUserFromBusiness(userId: string, businessId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}/users/${userId}`
    );
  }

  public markUserAsPrimaryContact(userId: string, businessId: string) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}/users/${userId}/primary`,
      {}
    );
  }

  public markUserAsAuthorizedSigner(userId: string, businessId: string) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}/users/${userId}/authorized-signer`,
      {}
    );
  }

  public removeAuthorizedSigner(userId: string, businessId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}/users/${userId}/authorized-signer`
    );
  }

  public createBusiness(business: Business) {
    return this.apiService.post<{ id: string; users: BasicUserProfile[] }>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses`,
      business
    );
  }

  public createBusinesses(businesses: Business[]) {
    return this.apiService.post<{ id: string; users: BasicUserProfile[] }[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/batch`,
      { businesses, organizationId: this.getOrganizationId() }
    );
  }

  public getBusinesses(queryOptions: PaginatedApiQueryOptions) {
    const apiQueryParamers: ApiQueryParameters = {
      ...queryOptions,
    };
    return this.apiService.get<BusinessQueryResult | Business[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses`,
      apiQueryParamers
    );
  }

  public searchBusinesses(searchExpression: string) {
    return this.apiService.get<Business[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses?search=${searchExpression}`
    );
  }

  public searchBusinessByUniqueBusinessIdentifier(
    uniqueBusinessIdentifier: string
  ) {
    return this.apiService.get<Business[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses?uniqueBusinessIdentifier=${uniqueBusinessIdentifier}`
    );
  }

  public getBusinessesFromIds(businessIds: string[]) {
    return this.apiService.get<Business[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses?ids=${businessIds.join(',')}`
    );
  }

  public getBusinessesForUser() {
    return this.apiService.get<Business[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/users`
    );
  }

  public getBusiness(businessId: string) {
    return this.apiService.get<Business>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}`
    );
  }

  public saveBusiness(business: Business) {
    return this.apiService.put<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${business.id}`,
      business
    );
  }

  public deleteBusiness(businessId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}`
    );
  }

  public getBusinessAddresses(businessId: string) {
    return this.apiService.get<Address[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}/addresses`
    );
  }

  public createBusinessAddress(address: Address) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${address.entityId}/addresses`,
      address
    );
  }

  public saveBusinessAddress(address: Address) {
    return this.apiService.put<Address>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${address.entityId}/addresses/${address.id}`,
      address
    );
  }

  public deleteBusinessAddress(businessId: string, addressId: string) {
    return this.apiService.delete<Address>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/businesses/${businessId}/addresses/${addressId}`
    );
  }

  public getUserAddresses(userId: string) {
    return this.apiService.get<Address[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/${userId}/addresses`
    );
  }

  public createUserAddress(address: Address) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/${address.entityId}/addresses`,
      address
    );
  }

  public saveUserAddress(address: Address) {
    return this.apiService.put<Address>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/${address.entityId}/addresses/${address.id}`,
      address
    );
  }

  public deleteUserAddress(userId: string, addressId: string) {
    return this.apiService.delete<Address>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/users/${userId}/addresses/${addressId}`
    );
  }

  // RETAILERS
  public getRetailers(queryOptions: PaginatedApiQueryOptions) {
    const apiQueryParamers: ApiQueryParameters = {
      ...queryOptions,
    };
    return this.apiService.get<Retailer[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers`,
      apiQueryParamers
    );
  }

  public deleteRetailer(retailerId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers/${retailerId}`
    );
  }

  public createRetailer(retailer: Retailer) {
    return this.apiService.post<Retailer>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers`,
      retailer
    );
  }

  public saveRetailer(retailer: Retailer) {
    return this.apiService.put<Retailer>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers/${retailer.id}`,
      retailer
    );
  }

  public patchRetailer(
    retailerId: string,
    patch: {
      name?: string | null;
      disabled?: boolean | null;
      externalMetadata?: Record<string, unknown> | null;
    }
  ) {
    return this.apiService.patch<Retailer>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers/${retailerId}`,
      patch
    );
  }

  public getRetailerById(retailerId: string) {
    return this.apiService.get<Retailer>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers/${retailerId}`
    );
  }

  public removeUserFromRetailer(retailerId: string, userId: string) {
    return this.apiService.delete<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers/${retailerId}/users/${userId}`
    );
  }

  public saveRetailerAddress(address: Address) {
    return this.apiService.put<Address>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers/${address.entityId}/addresses/${address.id}`,
      address
    );
  }

  public searchAddresses(searchExpression: string) {
    return this.apiService.get<Address[]>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/addresses`,
      { search: searchExpression }
    );
  }

  public createRetailerAddress(address: Address) {
    return this.apiService.post<ApiMessage>(
      this.serviceConfiguration,
      `/organizations/${this.getOrganizationId()}/retailers/${address.entityId}/addresses`,
      address
    );
  }
}
