import { InstantJSONSchema } from '../../types/pspdf';
import type { SignatureMetadata } from '../../web-components/signature/annotation.types';

export enum FileTypes {
  WORD = 'WORD',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  ARCHIVE = 'ARCHIVE',
  ANY = 'ANY',
  ZIP = 'ZIP',
}

export type FileMetadataPayload =
  | InstantJSONSchema
  | SignatureMetadata
  | Record<string, unknown>;

export interface FileMetadata {
  id?: string;
  documentId?: string;
  digest?: string;
  fileType: FileTypes;
  path?: string;
  originalName?: string;
  originalUrl?: string;
  description?: string;
  fileMetadata?: FileMetadataPayload;
  pdfGenerated?: boolean;
  pdfGeneratedAt?: number;
  pdfUrl?: string;
  template?: boolean;
  thumbnailGenerated?: boolean;
  thumbnailGeneratedAt?: number;
  thumbnailUrl?: string;
  pageCount?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface ExistingFileMetadata {
  // Required fields
  id: string; // UUID v4
  originalName: string;
  digest: string; // read-only

  // Optional fields with defaults
  template?: boolean; // default: false
  fileMetadata?: {
    originalName?: string;
    uploadedBy?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }; // default: {}
  fileType?: FileTypes | null; // default: 'ANY'

  // Optional fields
  path?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;

  // PDF related fields
  pdfGenerated?: boolean | null; // default: false
  pdfGeneratedAt?: number | null;
  pdfUrl?: string | null;

  // Thumbnail related fields
  thumbnailGenerated?: boolean | null; // default: false
  thumbnailGeneratedAt?: number | null;
  thumbnailUrl?: string | null;

  // Other optional fields
  pageCount?: number | null;
  originalUrl?: string | null; // Note: there's a typo in the original field name
  description?: string | null;
}

export interface UploadConfiguration {
  url: string;
  // TODO: Investigate this type usage and try to remove the any type
  // Possible solution is replace it with unknown type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any;
}

export const getDefaultFileMetadata = function (): FileMetadata {
  return {
    originalName: '',
    description: '',
    fileType: FileTypes.ANY,
    fileMetadata: {},
  };
};
