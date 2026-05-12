export interface DataExtractionItem {
  id: number;
  name: string;
  location: string;
}

export interface DataExtractionList {
  items: DataExtractionItem[];
}

export interface CreateDataExtractionTemplateInput {
  name: string;
  description: string;
  dataExtractionList: DataExtractionList;
  sampleDocumentId?: string;
}

export interface UpdateDataExtractionTemplateInput {
  name?: string;
  description?: string;
  dataExtractionList?: DataExtractionList;
  sampleDocumentId?: string;
}

export interface DataExtractionTemplate {
  id: string;
  name: string;
  description: string;
  dataExtractionList: DataExtractionList;
  sampleDocumentId?: string;
  sampleDocumentDigest?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DataExtractedItem {
  id: number;
  name: string;
  value: string;
  rationale: string;
  confidenceScore: number;
}

export interface DataExtractedList {
  items: DataExtractedItem[];
}

export interface CreateDataExtractionTemplateVerificationTaskInput {
  templateId: string;
  documentsIds: string[];
}
