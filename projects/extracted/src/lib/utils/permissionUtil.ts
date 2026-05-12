import { SystemGroups } from '../models/authModels';
import { Actions, Resources } from '../models/organizationModels';
import {
  Request,
  RequestUser,
  RequestUserRoles,
  RequestUsers,
  RequestUserTypes,
} from '../models/requestModels';
import {
  AudiencePermissionsLevel,
  Audiences,
  AudiencesPermission,
  Section,
  SectionStatuses,
  TaskStatuses,
} from '../models/sectionModels';
import { UserRoles as LendingUserRoles } from '../services/lending/models/lending.enums';
import { LoanUserBaseSchema } from '../services/lending/models/loans.models';
import { isNil } from './nullishUtil';
import { UserProfile } from '../models/userModels';

export class PermissionUtil {
  // REQUEST PERMISSIONS

  static isRepresentative(
    organizationUserId: string,
    requestUser: RequestUser
  ): boolean {
    return (
      (Boolean(requestUser.representatives) &&
        requestUser.representatives?.includes(organizationUserId)) ??
      false
    );
  }

  static isUserCollaboratorRequest(
    organizationUserId: string,
    users: RequestUser[]
  ): boolean {
    return users.some(
      requestUser =>
        (requestUser.userId === organizationUserId ||
          PermissionUtil.isRepresentative(organizationUserId, requestUser)) &&
        requestUser.userRole === RequestUserRoles.COLLABORATOR
    );
  }

  static isUserBorrowerOnRequest(
    organizationUserId: string,
    users: RequestUser[]
  ): boolean {
    return users.some(
      requestUser =>
        (requestUser.userId === organizationUserId ||
          PermissionUtil.isRepresentative(organizationUserId, requestUser)) &&
        requestUser.userRole === RequestUserRoles.BORROWER
    );
  }

  static userCanDelegate(
    organizationUserId: string,
    request: Request
  ): boolean {
    return request.users.some(
      requestUser =>
        (requestUser.userId === organizationUserId ||
          PermissionUtil.isRepresentative(organizationUserId, requestUser)) &&
        [RequestUserRoles.BORROWER, RequestUserRoles.CO_BORROWER].includes(
          requestUser.userRole
        )
    );
  }

  static userCanInvite(request: Request, organizationUserId: string): boolean {
    if (
      !PermissionUtil.isUserBorrowerOnRequest(organizationUserId, request.users)
    ) {
      return false;
    }

    const stagesConfiguration = request.configuration.stages;

    if (Object.keys(stagesConfiguration).includes(request.status)) {
      if (
        stagesConfiguration[request.status]?.allowAddingApplicants === undefined
      ) {
        return true;
      }

      return (
        stagesConfiguration[request.status]?.allowAddingApplicants ?? false
      );
    }

    return true;
  }

  static userCanSubmit(
    organizationUserId: string,
    users: RequestUsers,
    sections: Section[]
  ): boolean {
    const requestUser: RequestUser | undefined = users.find(
      requestUser =>
        (requestUser.userId === organizationUserId ||
          PermissionUtil.isRepresentative(organizationUserId, requestUser)) &&
        [RequestUserRoles.BORROWER, RequestUserRoles.CO_BORROWER].includes(
          requestUser.userRole
        )
    );

    // If the user is not in the request, return.
    if (!requestUser) {
      return false;
    }

    // Check if all requests are not already in the sumbit stage at least
    const allSectionsAreAlreadySubmitted = !sections.every(section => {
      return ![
        SectionStatuses.APPROVED,
        SectionStatuses.UNDER_REVIEW,
        SectionStatuses.CANCELLED,
        SectionStatuses.SUBMITTED,
      ].includes(section.status);
    });

    if (allSectionsAreAlreadySubmitted) {
      return false;
    }

    // Check if all tasks were provided for sections that are not already submitted, and that the applicant is a borrower.
    const allTasksWereCompleted: boolean = sections.every(section => {
      const tasksAreMissing = section.tasks.some(task =>
        [TaskStatuses.INCOMPLETE, TaskStatuses.REJECTED].includes(task.status)
      );

      return (
        !tasksAreMissing ||
        (tasksAreMissing &&
          [
            SectionStatuses.APPROVED,
            SectionStatuses.UNDER_REVIEW,
            SectionStatuses.CANCELLED,
            SectionStatuses.SUBMITTED,
          ].includes(section.status))
      );
    });

    if (allTasksWereCompleted) {
      return true;
    }

    // Check if the user has access to submit all the section.
    return sections.every(section => {
      return PermissionUtil.userCanSubmitRequest(
        organizationUserId,
        section,
        requestUser.userId
      );
    });
  }

  static userCanSubmitRequest(
    organizationUserId: string,
    section: Section,
    currentRequestUserId: string | undefined
  ): boolean {
    return (
      section.audiencesPermission[organizationUserId] ===
        AudiencePermissionsLevel.SUBMIT ||
      section.assigneeId === organizationUserId ||
      section.assigneeId === currentRequestUserId
    );
  }

  // TODO: Review object argument
  static getAudiencePermission(
    organizationUserId: string,
    userRole: RequestUserRoles,
    userAudiences: Audiences[],
    // TODO: Review object argument
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object: any
  ): AudiencePermissionsLevel | undefined {
    // IMPORTANT: This algorithm is adapted from the backend algorithm contained in the audienceable mixin in the project shared_api_base.
    // IF YOU UPDATE IT HERE, YOU NEED TO UPDATE IT THERE AS WELL...
    let permissionLevel: AudiencePermissionsLevel | null = null;

    const objectAudiences: AudiencesPermission =
      object.audiencesPermission || {};

    if (Object.keys(objectAudiences).includes(organizationUserId)) {
      const level = objectAudiences[organizationUserId];
      if (level) {
        permissionLevel = level;
      }
    }

    if (
      Object.keys(object).includes('assigneeId') &&
      object.assigneeId === organizationUserId
    ) {
      if (!userAudiences.includes(Audiences.ASSIGNED_CLIENT)) {
        userAudiences.push(Audiences.ASSIGNED_CLIENT);
      }

      if (
        !userAudiences.includes(Audiences.ALL_CLIENTS) &&
        [
          RequestUserRoles.BORROWER,
          RequestUserRoles.CO_BORROWER,
          RequestUserRoles.GUARANTOR,
        ].includes(userRole)
      ) {
        userAudiences.push(Audiences.ALL_CLIENTS);
      }
    }

    for (const audience of userAudiences) {
      if (Object.keys(objectAudiences).includes(audience)) {
        if (isNil(permissionLevel)) {
          permissionLevel = objectAudiences[audience] ?? null;
        } else {
          const objectAudiencesPermissionLevel =
            objectAudiences[audience] ?? null;
          if (
            objectAudiencesPermissionLevel &&
            objectAudiencesPermissionLevel > permissionLevel
          ) {
            permissionLevel = objectAudiencesPermissionLevel;
          }
        }
      }
    }

    return permissionLevel || AudiencePermissionsLevel.VIEW_STATUS;
  }

  // LENDING PERMISSIONS

  static isUserCollaboratorOnLoan(
    organizationUserId: string,
    users: LoanUserBaseSchema[]
  ): boolean {
    return users.some(
      user =>
        user.userId === organizationUserId &&
        user.role === LendingUserRoles.COLLABORATOR
    );
  }

  static isUserCollaboratorOnCreditLine(
    organizationUserId: string,
    users: LoanUserBaseSchema[]
  ): boolean {
    return users.some(
      user =>
        user.userId === organizationUserId &&
        user.role === LendingUserRoles.COLLABORATOR
    );
  }

  // GENERAL PERMISSIONS

  static isAuthorized(
    // TODO: Review userPermissions type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userPermissions: any,
    resource: Resources,
    action: Actions
  ): boolean {
    if (userPermissions) {
      if (!userPermissions[resource]) {
        return false;
      }
      return userPermissions[resource] >= action;
    }

    return false;
  }

  static isInGroup(userGroups: string[], group: SystemGroups): boolean {
    if (userGroups) {
      return userGroups.includes(group);
    }

    return false;
  }

  static isInSomeGroup(userGroups: string[], groups: SystemGroups[]): boolean {
    if (userGroups) {
      return groups.some(group => userGroups.includes(group));
    }

    return false;
  }

  static isRetailerEmployee(userGroups: string[]): boolean {
    return PermissionUtil.isInGroup(userGroups, SystemGroups.RETAILER_EMPLOYEES);
  }

  static getParticipantsInBusiness(
    users: RequestUser[],
    businessId: string
  ): string[] {
    if (users.length === 0 || !businessId) {
      return [];
    }
    const business = users.find(user => user.userId === businessId);
    if (!business) {
      return [];
    }
    const userIds: string[] = [];
    const profile = business.profile;
    if (profile && 'primaryContactId' in profile && profile?.primaryContactId) {
      userIds.push(profile.primaryContactId);
    }

    if (profile && 'representatives' in profile && profile?.representatives) {
      profile.representatives.forEach(user => {
        userIds.push(user.userId ?? '');
      });
    }

    if (userIds.length === 0 && profile?.users) {
      const firstUserId = (profile.users as UserProfile[])[0]?.id ?? '';
      userIds.push(firstUserId);
    }

    return userIds.filter(Boolean);
  }
  static getParticipantsInSection(
    section: Section,
    users: RequestUser[],
    exclude_list: string[],
    taggedUserIds: string[]
  ): string[] {
    const userIdsOrAudiences = Object.keys(section.audiencesPermission).filter(
      key => (section.audiencesPermission?.[key] ?? 0) > 0
    );

    const assigneeId = section.assigneeId ?? '';
    const isAssigneeIdIndividual = Boolean(
      users.find(
        user =>
          user.userId === section.assigneeId &&
          user.userType === RequestUserTypes.INDIVIDUAL
      )
    );
    const userIds: string[] = [];
    if (assigneeId && isAssigneeIdIndividual) {
      userIds.push(assigneeId);
    }

    // Loan officer ids
    if (userIdsOrAudiences.includes(Audiences.ALL_PROCESSORS)) {
      const loanOfficers = users.filter(
        user => user.userRole === RequestUserRoles.LOAN_OFFICER
      );
      userIds.push(...loanOfficers.map(user => user.userId ?? ''));
    }

    if (section.scope === 'applicant') {
      // Business users from the assignee business
      if (assigneeId && !isAssigneeIdIndividual) {
        userIds.push(
          ...PermissionUtil.getParticipantsInBusiness(users, assigneeId)
        );
      }

      // Collaborators
      const collaborators = users
        .filter(user => user.userRole === RequestUserRoles.COLLABORATOR)
        .map(user => user.userId ?? '');
      userIds.push(
        ...userIdsOrAudiences.filter(element => collaborators.includes(element))
      );

      userIds.push(...taggedUserIds);
    }

    if (section.scope === 'request') {
      // All representative/primary contact from all business
      const businesses = users.filter(
        user => user.userType !== RequestUserTypes.INDIVIDUAL
      );
      businesses.forEach(business => {
        userIds.push(
          ...PermissionUtil.getParticipantsInBusiness(
            users,
            business.userId ?? ''
          )
        );
      });

      // All Collaborators
      const collaborators = users
        .filter(user => user.userRole === RequestUserRoles.COLLABORATOR)
        .map(user => user.userId ?? '');
      userIds.push(...collaborators);

      userIds.push(...taggedUserIds);
    }
    if (section.scope !== 'applicant' && section.scope !== 'request') {
      console.error(
        `Section scope "${section.scope}" is not supported for getParticipantsInSection.`
      );
    }

    return Array.from(new Set(userIds))
      .filter(Boolean)
      .filter(userId => !exclude_list.includes(userId));
  }
}
