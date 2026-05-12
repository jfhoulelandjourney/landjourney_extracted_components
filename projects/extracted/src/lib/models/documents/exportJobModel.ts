import { FileTypes } from './fileModels';

export interface CreateExportJob {
  filename: string;
  requestId: string;
  includeAll: boolean;
  sections: string[];
  tasks: string[];
  documents: string[];
}

export interface ExportJob {
  filename: string;
  id: string;
  status: string;
  createdAt: number;
  digest?: string;
}

export interface DownloadDocument {
  id: string;
  name: string;
  digest: string;
  type: FileTypes;
  url?: string | null;
  createdAt: Date;
}
