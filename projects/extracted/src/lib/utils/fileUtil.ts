import { clamp } from 'es-toolkit';
import { FileTypes } from '../models/documents/fileModels';
import {
  AttachmentTypes,
  AttachmentTypeVisualDescription,
} from '../models/sectionModels';

const ARCHIVE_FILE_TYPE_MIME_TYPE_WORDS = ['zip', 'compressed', 'tar'];

const WORD_FILE_TYPE_MIME_TYPE = [
  'word',
  'msword',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
];
const EXCEL_FILE_TYPE_MIME_TYPE = [
  'excel',
  'ms-excel',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
];

export function getFileType(fileType: File['type'] = ''): FileTypes {
  if (WORD_FILE_TYPE_MIME_TYPE.some(type => fileType.includes(type))) {
    return FileTypes.WORD;
  }

  if (EXCEL_FILE_TYPE_MIME_TYPE.some(type => fileType.includes(type))) {
    return FileTypes.EXCEL;
  }

  if (fileType.includes('pdf')) {
    return FileTypes.PDF;
  }

  if (fileType.includes('image')) {
    return FileTypes.IMAGE;
  }

  if (ARCHIVE_FILE_TYPE_MIME_TYPE_WORDS.some(term => fileType.includes(term))) {
    return FileTypes.ARCHIVE;
  }

  return FileTypes.ANY;
}

export function getFileIcon(fileType?: FileTypes) {
  switch (fileType) {
    case FileTypes.WORD:
      return 'article';
    case FileTypes.EXCEL:
      return 'table_chart';
    case FileTypes.PDF:
      return 'picture_as_pdf';
    case FileTypes.IMAGE:
      return 'image';
    case FileTypes.ARCHIVE:
      return 'image';
    default:
      return 'description';
  }
}

export function getAttachmentIcon(attachmentType?: AttachmentTypes) {
  switch (attachmentType) {
    case AttachmentTypes.IDENTITY_VERIFICATION:
      return 'identity_platform';
    case AttachmentTypes.CREDIT_CHECK:
      return 'credit_score';
    case AttachmentTypes.SIGNATURE:
      return 'signature';
    case AttachmentTypes.DYNAMIC_FORM:
      return 'edit_document';
    case AttachmentTypes.FILE:
      return 'upload_file';
    default:
      return 'description';
  }
}

export function formatBytes(bytes: number, decimalPlaces = 2) {
  decimalPlaces = Math.max(0, decimalPlaces);
  if (bytes === 0) {
    return '';
  }
  const kilobyte = 1024;
  const sizeUnits = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];
  const sizeIndex = clamp(
    Math.floor(Math.log(bytes) / Math.log(kilobyte)),
    0,
    4
  );
  const fileSize = bytes / Math.pow(kilobyte, sizeIndex);

  const { format } = Intl.NumberFormat('en-US', {
    style: 'unit',
    unit: sizeUnits.at(sizeIndex),
    maximumFractionDigits: decimalPlaces,
    unitDisplay: 'narrow',
  });

  return format(fileSize);
}

export const getAttachmentTypeVisualDescription: () => Record<
  AttachmentTypes,
  AttachmentTypeVisualDescription
> = () => ({
  [AttachmentTypes.SIGNATURE]: {
    key: AttachmentTypes.SIGNATURE,
    label: 'Signature',
    icon: () => 'signature',
  },
  [AttachmentTypes.IDENTITY_VERIFICATION]: {
    key: AttachmentTypes.IDENTITY_VERIFICATION,
    label: 'Identity Verification',
    icon: () => 'identity_platform',
  },
  [AttachmentTypes.DYNAMIC_FORM]: {
    key: AttachmentTypes.DYNAMIC_FORM,
    label: 'Dynamic Form',
    icon: () => 'edit_document',
  },
  [AttachmentTypes.FILE]: {
    key: AttachmentTypes.FILE,
    label: 'File',
    icon: () => 'upload_file',
  },
  [AttachmentTypes.REFERENCE_DOCUMENT]: {
    key: AttachmentTypes.REFERENCE_DOCUMENT,
    label: 'Reference Document',
    icon: (file?: File) => getFileIcon(getFileType(file?.type)),
  },
  [AttachmentTypes.CREDIT_CHECK]: {
    key: AttachmentTypes.CREDIT_CHECK,
    label: 'Credit Check',
    icon: () => 'credit_score',
  },
  [AttachmentTypes.TEXT]: {
    key: AttachmentTypes.TEXT,
    label: 'Text Document',
    icon: () => 'description',
  },
  [AttachmentTypes.REVIEW_APPLICATION_SIGNATURE]: {
    key: AttachmentTypes.REVIEW_APPLICATION_SIGNATURE,
    label: 'Review Application Signature',
    icon: () => 'contract_edit',
  },
});
