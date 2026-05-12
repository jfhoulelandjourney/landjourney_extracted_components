import { TargetEntityType } from '../discussionModel';

export type AiChatResponse = {
  type: string;
  text: string;
};

export type AiChatConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: AiChatResponse[];
};

export interface ChecklistItem {
  description: string;
  expectedValue: string;
  stepNumber: number;
  validationType: string;
  deleted?: boolean;
  checked?: boolean;
}

export interface ChecklistTemplate {
  id?: string;
  attachmentName: string;
  checklistItems: ChecklistItem[];
  taskName: string;
}

interface ChecklistInputArgs {
  documentType: string;
  templateName: string;
  templateDescription: string;
}

export interface CreateDocumentChecklistTemplateInput {
  entityTargetType: TargetEntityType;
  checklist: ChecklistTemplate;
  inputArgs: ChecklistInputArgs;
  isDraft: boolean;
  testDocumentId?: string;
  testDocumentDigest?: string;
  humanVerification?: Record<string, boolean>;
  verificationOutput?: {
    checklistVerification: ChecklistOutputItem[];
  };
}

export interface DocumentChecklistTemplate {
  id: string;
  entityTargetType: string;
  checklist: ChecklistTemplate;
  inputArgs: ChecklistInputArgs;
  createdAt: number;
  updatedAt: number;
  verificationOutput: {
    checklistVerification: ChecklistOutputItem[];
  };
  humanVerification: Record<string, boolean>;
  isDraft: boolean;
  testDocumentId?: string;
  testDocumentDigest?: string;
}

export interface ChecklistOutputItem {
  comments: string;
  passed: boolean;
  reason: string | undefined;
  stepNumber: number;
}

export interface ChecklistOutput {
  id: string;
  checklist: ChecklistTemplate;
  verificationOutput: {
    checklistVerification: ChecklistOutputItem[];
  };
  humanVerification: Record<string, boolean>;
}

export const DocumentTypes = [
  { label: 'Financial Document', value: 'FINANCIAL_DOCUMENT' },
  { label: 'Legal Document', value: 'LEGAL_DOCUMENT' },
  { label: 'Corporate Document', value: 'CORPORATE_DOCUMENT' },
  { label: 'Identity Document', value: 'IDENTITY_DOCUMENT' },
  { label: 'Other Document', value: 'OTHER_DOCUMENT' },
] as const;
