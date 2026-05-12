import { RequestUserRoles } from '../../../models/requestModels';

/** Current version of the field data schema. V2 can evolve in-place without version bumps. */
export const FIELD_DATA_SCHEMA_VERSION = 2 as const;

/** Default field width in PDF page units when the drag item does not specify one. */
export const DEFAULT_FIELD_WIDTH_PX = 200 as const;

/** Default field height in PDF page units when the drag item does not specify one. */
export const DEFAULT_FIELD_HEIGHT_PX = 30 as const;

/** Standard kind identifier for label annotations. */
export const ANNOTATION_KIND_LABEL = 'label' as const;

/** Kind identifier for per-option label annotations (checkbox/radio). */
export const ANNOTATION_KIND_OPTION_LABEL = 'option-label' as const;

/** Default roles that can sign documents. */
export const DEFAULT_SIGNEE_ROLES: readonly RequestUserRoles[] = [
  RequestUserRoles.BORROWER,
  RequestUserRoles.CO_BORROWER,
  RequestUserRoles.GUARANTOR,
] as const;
