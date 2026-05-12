export interface NotificationTaskSchema {
  type: string;
  name: string;
  description?: string;
  justification?: string;
  path?: string;
}

export interface NotificationActorSchema {
  name: string;
  initials?: string;
  avatarUrl?: string | boolean;
}

export interface NotificationTenantStyleSchema {
  logoUrl: string;
  primaryColor: string;
  backgroundColor: string;
}

export interface NotificationEmailOverridesSchema {
  to?: string;
  from?: string;
  senderName?: string;
  text?: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
}

export interface NotificationEmailStyleSchema {
  splash: string;
}

export interface PostAdHocNotificationSchema {
  workflowName: string;
  recipients: string[];
  overrides: {
    layoutIdentifier?: string;
    email?: NotificationEmailOverridesSchema;
  };
  requestId?: string;
  sectionId?: string;
  payload: {
    authToken?: string;
    url?: string;
    methods?: string[];
    sendNow?: boolean;
    tenantStyle?: NotificationTenantStyleSchema;
    emailStyle?: Record<string, NotificationEmailStyleSchema>;
    extra?: {
      requestName: string;
      subject?: string;
      message?: string;
      comment?: string;
      requestType?: string;
      ctaUrl?: string;
      tasks?: NotificationTaskSchema[];
      task?: NotificationTaskSchema;
      actor?: NotificationActorSchema;
    };
  };
}
