export interface Retailer {
  id?: string;
  name: string;
  parentId?: string;
  mobileappFQDN?: string | null;
  syncEnabled?: boolean;
  disabled?: boolean;
  logoUri?: string | null;
  logoUriSmall?: string | null;
  externalMetadata?: Record<string, unknown> | null;
}

export interface RetailerQueryResult {
  items: Retailer[];
  totalCount: number;
}

export const TemplateType = {
  REQUEST_TEMPLATES: 'REQUEST_TEMPLATES',
  FILE_TEMPLATES: 'FILE_TEMPLATES',
  DYNAMIC_FORMS_TEMPLATES: 'DYNAMIC_FORMS_TEMPLATES',
  PDF_SIGNATURE_TEMPLATES: 'PDF_SIGNATURE_TEMPLATES',
  DOCUMENTS_CHECKLIST_TEMPLATES: 'DOCUMENTS_CHECKLIST_TEMPLATES',
  DOCUMENTS_DATA_EXTRACTION_TEMPLATES: 'DOCUMENTS_DATA_EXTRACTION_TEMPLATES',
} as const;

export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];

export interface TemplateRetailerAssignment {
  id: string;
  templateId: string;
  retailerId: string;
  type: string;
  createdAt: number;
  updatedAt: number | null;
}

export interface TemplateRetailerAssignmentQueryResult {
  items: TemplateRetailerAssignment[];
  totalCount: number;
}
