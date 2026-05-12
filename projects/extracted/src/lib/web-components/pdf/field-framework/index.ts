/**
 * Public surface of the v2 PDF field framework.
 */

export type { AssignmentMode } from './assignment-mode';
export { provideFieldFramework } from './provide-field-framework';

export type { SignedBy, SigneeInfo, SignerInfo } from './types/field-data';
export type {
  CheckboxFormField,
  ComboBoxFormField,
  FormFieldEntry,
  ListBoxFormField,
  RadioFormField,
  SignatureFormField,
  SignatureInstantJSON,
  TextFormField,
} from './types/instant-json';

export { FieldsBridgeService } from './services/fields-bridge.service';
export {
  FieldsService,
  type CreateFieldOutput,
} from './services/fields.service';

export type { Bbox } from './api/types';
export { materializeOptionFieldsInJson } from './api/materialize-options';
export {
  signaturePlugin,
  type SignatureFieldData,
} from './plugins/signature/signature.plugin';

export {
  initialsPlugin,
  type InitialsFieldData,
} from './plugins/initials/initials.plugin';

export { DEFAULT_FIELD_HEIGHT_PX, DEFAULT_FIELD_WIDTH_PX } from './constants';
export {
  FIELD_PLUGINS,
  isRegisteredFieldType,
  isUnassignedInRecipientsMode,
  isUnassignedInSigneesMode,
  type RegisteredFieldType,
} from './plugins/field-plugin';
export { isV2Custom, type V2FieldData } from './utils/custom-data-guards';
export {
  isV1Custom,
  migrateV1Annotation,
  migrateV1InstantJson,
  type V1FieldCustomData,
} from './migration/v1-to-v2';
export {
  canFillAnnotation,
  isAuthorizedForAnnotation,
  type AuthorizableAnnotation,
  type AuthorizationUser,
} from './authorization/can-fill-annotation';

export { BaseFieldInspector } from './components/base-field-inspector';
export { FieldInspectorComponent } from './components/field-inspector.component';
export { InitialsInspectorComponent } from './plugins/initials/initials.inspector';
export { SignatureInspectorComponent } from './plugins/signature/signature.inspector';
