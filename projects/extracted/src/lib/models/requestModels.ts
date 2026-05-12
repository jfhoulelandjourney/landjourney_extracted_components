import { Business } from './businessModels';
import { PhoneNumber } from './phoneNumber';
import { WorkflowProductTypes } from './products/workflow-productTypes';
import { RequestAttachment } from './requestAttachmentModels';
import { Section } from './sectionModels';
import { SharedViewUserProfile } from './userModels';

export enum RequestStatuses {
  DRAFT = 'DRAFT',
  INITIATED = 'INITIATED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  UNDERWRITING = 'UNDERWRITING',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum RequestTypes {
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  ORIGINATION = 'ORIGINATION',
  SERVICE = 'SERVICE',
  SUPPORT = 'SUPPORT',
  INFORMATION = 'INFORMATION',
  COVENANT = 'COVENANT',
}

export enum RequestModes {
  SIMPLE = 'SIMPLE',
  ADVANCED = 'ADVANCED',
}

// REQUEST STEP MODEL
// -----------------------------------------------
export interface RequestStep {
  perApplicant: Section[];
  forRequest: Section[];
  existing?: Section[];
}

export type RequestStepsMap = Record<string, RequestStep>;

export interface TemplateTrackingItem {
  date: number;
  templateId: string;
  templateName: string;
}

export type RequestStepIdentifier = string;
export type RequestSteps = Record<RequestStepIdentifier, RequestStep>;

export enum StageTypes {
  DATA_COLLECTION = 'DATA_COLLECTION',
  REVIEW = 'REVIEW',
  UNDERWRITING = 'UNDERWRITING',
  COMPLETED = 'COMPLETED',
  DOCUMENT_ROOM = 'DOCUMENT_ROOM',
}

export enum RequestUserTypes {
  CORPORATION = 'CORPORATION',
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
  LLC = 'LLC',
  LLP = 'LLP',
  GP = 'GP',
  LP = 'LP',
  TRUST = 'TRUST',
  ESTATE = 'ESTATE',
  INDIVIDUAL = 'INDIVIDUAL',
  LENDER = 'LENDER',
}

export const isRequestUserType = (
  input?: unknown
): input is RequestUserTypes => {
  return (
    typeof input === 'string' &&
    Object.values(RequestUserTypes).includes(input as RequestUserTypes)
  );
};

export enum RequestUserRoles {
  BORROWER = 'BORROWER',
  CO_BORROWER = 'CO_BORROWER',
  GUARANTOR = 'GUARANTOR',
  COLLABORATOR = 'COLLABORATOR',
  LOAN_OFFICER = 'LOAN_OFFICER',
  INTERNAL = 'INTERNAL',
  NON_OBLIGATED_PARTY = 'NON_OBLIGATED_PARTY',
}

export const isRequestUserRole = (
  value?: unknown
): value is RequestUserRoles => {
  return (
    typeof value === 'string' &&
    Object.values<string>(RequestUserRoles).includes(value)
  );
};

export function getRequestUserRolesDisplayName(role: RequestUserRoles): string {
  switch (role) {
    case RequestUserRoles.BORROWER:
      return 'Primary Borrower';
    case RequestUserRoles.CO_BORROWER:
      return 'Co-Borrower';
    case RequestUserRoles.GUARANTOR:
      return 'Guarantor';
    case RequestUserRoles.COLLABORATOR:
      return 'Collaborator';
    case RequestUserRoles.LOAN_OFFICER:
      return 'Loan Officer';
    case RequestUserRoles.NON_OBLIGATED_PARTY:
      return 'Non Obligated Party';
    default:
      return role;
  }
}

export function isUserInternal(user: RequestUser): boolean {
  return [RequestUserRoles.LOAN_OFFICER, RequestUserRoles.INTERNAL].includes(
    user.userRole
  );
}

// REQUEST USER MODEL
// -----------------------------------------------

export type SharedViewProfile = SharedViewUserProfile;

export interface RequestUser {
  userId?: string;
  requestId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: PhoneNumber;
  userType: RequestUserTypes;
  userRole: RequestUserRoles;
  representatives?: string[];
  disabled?: boolean;
  profile?: Business | SharedViewUserProfile;
}

export type RequestUsers = RequestUser[];
export type StatusFlow = string[];

export enum MessageFrequencies {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  EVERY_X_DAY = 'EVERY_X_DAY',
  EVERY_X_WEEK = 'EVERY_X_WEEK',
}

// REQUEST MODEL
// -----------------------------------------------
export interface MessageOverrideAttempt {
  attempt: number;
  message: string;
}

export interface MessageCadenceBase {
  enabled?: boolean;
  value?: number;
  frequency: MessageFrequencies;
  maximum?: number;
  messageOverrides?: MessageOverrideAttempt[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FollowUpCadence extends MessageCadenceBase {}

export interface DueDateCadence extends MessageCadenceBase {
  startOffset?: number; // use negative number to start before the due date
}

export interface StageConfiguration {
  description: string;
  type?: StageTypes;
  visibleTo?: RequestUserRoles[];
  allowAddingApplicants: boolean;
  requireReviewBeforeSubmission: boolean;
  followUpCadence?: FollowUpCadence;
  dueDateCadence?: DueDateCadence;
}

export function getDefaultStageConfiguration(): StageConfiguration {
  return {
    description: '',
    allowAddingApplicants: false,
    requireReviewBeforeSubmission: false,
  };
}

export interface RequestConfiguration {
  stages: Record<string, StageConfiguration>;
}

export function getDefaultRequestConfiguration(): RequestConfiguration {
  return {
    stages: {},
  };
}

export interface DefaultMessage {
  subject?: string;
  body?: string;
}

export interface UnsavedRequest {
  draftId?: string;
  products: string[];
  name: string | null;
  mode: RequestModes;
  clientCanInitiate: boolean;
  requestType: RequestTypes;
  productType: WorkflowProductTypes;
  status: string;
  statusFlow: string[];
  configuration: RequestConfiguration;
  users: RequestUser[];
  requestSteps: RequestStepsMap;
  defaultMessage?: DefaultMessage;
  usersDigest?: string;
  workgroupId: string | null;
  sections: Section[] | null;
  businesses: Business[];
  isTemplate?: boolean;
  templateTracking?: TemplateTrackingItem[];
  productCompliance?: string[];
  /** Role -> userId (string) when sending; role -> RequestUser when receiving from API */
  internalRoles?: Record<string, string | RequestUser>;
}

export interface Request extends UnsavedRequest {
  id?: string;
  closed?: boolean;
  createdAt?: number;
  updatedAt?: number | null;
  requestDigest: string;
  attachments?: RequestAttachment[];
  userSummaries?: Record<string, TaskSummary>;
  history?: RequestHistory[];
}

export interface TaskSummary {
  approved: number;
  submitted: number;
  incomplete: number;
  need_updates: number;
}

export interface RequestHistory {
  previousStatus: string;
  newStatus: string;
  changedAt: number;
  changedBy: string;
}

// REQUEST OVERVIEW MODEL
// -----------------------------------------------

export interface BasicRequestInformation {
  id: string;
  name?: string;
  productType: WorkflowProductTypes;
  status: string;
  workgroupId?: string;
  createdAt: number;
  updatedAt?: number;
  requestType: RequestTypes;
  closed: boolean;
}

export interface RequestOverviewSection {
  followUpNeeded: BasicRequestInformation[];
  reviewNeeded: BasicRequestInformation[];
  total: number;
}

export interface TaskOverviewItem {
  requestId: string;
  requestName?: string;
  sectionId: string;
  sectionName: string;
  taskId: string;
  taskName?: string;
  taskType: string;
  taskStatus: string;
  sectionStatus: string;
  dueDate?: number;
  createdAt: number;
}

export interface RequestOverview {
  myRequestsOverview: RequestOverviewSection;
  workgroupRequestsOverview: RequestOverviewSection;
  myTasksOverview: TaskOverviewItem[];
}

//  CLIENT INITIATED REQUESTS SCHEMAS

export interface CustomerInitiableRequestTemplate {
  id: string;
  name: string;
  mode: RequestModes;
  clientCanInitiate: boolean;
  productType: WorkflowProductTypes;
  statusFlow: string[];
  isTemplate: boolean;
}

export interface CreateRequestAsCustomerParams {
  template_id: string;
  users: RequestUser[];
}

export interface CustomerInitiableRequestTemplateQueryResult {
  items: CustomerInitiableRequestTemplate[];
  totalCount: number;
}

//  REQUEST QUERY RESULT MODEL
// -----------------------------------------------
export interface RequestQueryResult {
  items: Request[];
  totalCount: number;
}

export function getDefaultRequest(): Request {
  return {
    id: '',
    name: '',
    mode: RequestModes.SIMPLE,
    clientCanInitiate: false,
    requestType: RequestTypes.ORIGINATION,
    productType: WorkflowProductTypes.LAND_LOAN,
    status: RequestStatuses.INITIATED as string,
    statusFlow: [
      RequestStatuses.INITIATED as string,
      RequestStatuses.PROCESSING as string,
      RequestStatuses.APPROVED as string,
      RequestStatuses.CLOSED as string,
    ],
    configuration: {
      stages: {},
    },
    users: [],
    requestDigest: '',
    requestSteps: {
      INITIATED: {
        forRequest: [],
        perApplicant: [],
        existing: [],
      },
      PROCESSING: {
        forRequest: [],
        perApplicant: [],
        existing: [],
      },
      APPROVED: {
        forRequest: [],
        perApplicant: [],
        existing: [],
      },
      CLOSED: {
        forRequest: [],
        perApplicant: [],
        existing: [],
      },
    },
    defaultMessage: {},
    workgroupId: null,
    sections: null,
    businesses: [],
    templateTracking: [],
    products: [],
    internalRoles: {},
  };
}
