import type {
  Annotation,
  Bookmark,
  Comment,
  FormField,
  FormFieldValue,
} from '@nutrient-sdk/viewer';

export interface InstantJSONSchema {
  annotations?: Annotation[];
  attachments?: Record<string, unknown>;
  formFieldValues?: FormFieldValue[];
  formFields?: FormField[];
  bookmarks?: Bookmark[];
  comments?: Comment[];
}

export function getDefaultInstantJson(): InstantJSONSchema {
  return {
    annotations: [],
    attachments: {},
    formFieldValues: [],
    formFields: [],
    bookmarks: [],
    comments: [],
  };
}
