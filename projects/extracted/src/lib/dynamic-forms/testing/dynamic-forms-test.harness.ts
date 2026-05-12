import type { Provider } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MONACO_PATH } from '@materia-ui/ngx-monaco-editor';
import { Subject } from 'rxjs';

import { ENVIRONMENT_CONFIG } from '../../services/environment/environment.service';
import { UserActivityService } from '../../services/identity/userActivity';
import type { OrganizationUIConfiguration } from '../../services/organization/organization.models';
import { OrganizationService } from '../../services/organization/organization.service';
import { RealtimeMessagingService } from '../../services/realtimeMessaging/realtime-messaging.service';
import {
  FormTypes,
  SectionLayouts,
  type DynamicForm,
  type DynamicFormData,
  type DynamicFormField,
  type DynamicFormSection,
  DynamicFormFieldTypes,
  type FormOptions,
} from '../models/dynamic-forms.models';
import { getDefaultBorrower } from '../models/fields.models';
import type { CssRootNode } from '../utilities/dynamicFormsUtil';

export { FormTypes, SectionLayouts };

export const realtimeMessagingServiceTestMock = {
  messages: new Subject<unknown>(),
  connect: (): void => undefined,
  sendMessage: (): void => undefined,
};

const organizationUiConfigurationTestStub: OrganizationUIConfiguration = {
  id: '',
  name: '',
  dnsPrefix: '',
  logoUri: '',
  logoUriSmall: '',
  colors: {
    primary: { color: '', variations: {} },
    secondary: { color: '', variations: {} },
    tertiary: { color: '', variations: {} },
  },
  defaultGroups: [],
  activatedFeatures: [],
  novuApplicationIdentifier: '',
  sharedDomain: false,
  contactDetails: '',
  allowCollaboratorsToTriggerBorrowerCreditCheck: false,
  allowCollaboratorsToValidateBorrowerIdentity: false,
  fileExportConfiguration: {
    separator: '_',
    exportFilename: [],
    filenameAssignedTask: [],
    filenameCommonTask: [],
    folderStructureAssignedTask: [],
    folderStructureCommonTask: [],
  },
  termsOfUseUrl: '',
  privacyPolicyUrl: '',
};

export const organizationServiceTestMock = {
  isFeatureFlagActivated: (): boolean => false,
  uiConfiguration: organizationUiConfigurationTestStub,
};

export const userActivityServiceTestMock = {
  registerActivity: (): void => undefined,
};

const emptyCssRoot: CssRootNode = { parent: null, children: [] };

export const DYNAMIC_FORMS_TEST_PROVIDERS: Provider[] = [
  { provide: ENVIRONMENT_CONFIG, useValue: { appType: 'backoffice' as const } },
  {
    provide: OrganizationService,
    useValue: organizationServiceTestMock as unknown as OrganizationService,
  },
  { provide: MONACO_PATH, useValue: 'assets/monaco-editor/vs' },
];

export const DYNAMIC_FORMS_TEST_IMPORTS = [HttpClientTestingModule] as const;

export const DYNAMIC_FORMS_ROOT_TEST_PROVIDERS: Provider[] = [
  ...DYNAMIC_FORMS_TEST_PROVIDERS,
  {
    provide: RealtimeMessagingService,
    useValue: realtimeMessagingServiceTestMock,
  },
  {
    provide: UserActivityService,
    useValue: userActivityServiceTestMock as unknown as UserActivityService,
  },
];

export function minimalDynamicForm(): DynamicForm {
  return {
    name: 'test-form',
    formType: FormTypes.INLINE,
    formDefinition: [],
    formOptions: {},
    data: {},
  };
}

export function minimalFormOptions(): FormOptions {
  return {};
}

export function minimalInputDynamicFormField(): DynamicFormField<unknown> {
  return {
    id: 'test-field',
    name: 'test',
    column: 0,
    label: 'Test',
    fieldType: DynamicFormFieldTypes.INPUT,
    required: false,
    parameters: {},
  };
}

export function minimalDynamicFormSection(): DynamicFormSection {
  return {
    id: 'section-1',
    layout: SectionLayouts.ONE_COLUMN,
    fields: [],
  };
}

export function seedEditorAbstractFieldFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('containerLayout', SectionLayouts.ONE_COLUMN);
}

export function seedEditorFieldFixture<T>(
  fixture: ComponentFixture<T>,
  field: DynamicFormField<unknown>
): void {
  seedEditorAbstractFieldFixture(fixture);
  fixture.componentRef.setInput('field', field);
}

export function seedDynamicFormAbstractFieldFixture<T>(
  fixture: ComponentFixture<T>
): void {
  fixture.componentRef.setInput('formData', {} as DynamicFormData);
  fixture.componentRef.setInput('containerLayout', SectionLayouts.ONE_COLUMN);
}

export function seedDynamicFormFieldFixture<T>(
  fixture: ComponentFixture<T>,
  field: DynamicFormField<unknown>,
  formData: DynamicFormData = {} as DynamicFormData
): void {
  fixture.componentRef.setInput('formData', formData);
  fixture.componentRef.setInput('containerLayout', SectionLayouts.ONE_COLUMN);
  fixture.componentRef.setInput('field', field);
}

export function seedDynamicFormSubmitButtonFixture<T>(
  fixture: ComponentFixture<T>
): void {
  seedDynamicFormAbstractFieldFixture(fixture);
  fixture.componentRef.setInput('formType', FormTypes.INLINE);
}

export function seedDynamicFormFieldRouterFixture<T>(
  fixture: ComponentFixture<T>
): void {
  fixture.componentRef.setInput('field', minimalInputDynamicFormField());
  fixture.componentRef.setInput('formData', {} as DynamicFormData);
  fixture.componentRef.setInput('formType', FormTypes.INLINE);
  fixture.componentRef.setInput('containerLayout', SectionLayouts.ONE_COLUMN);
}

export function seedEditorFieldRouterFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('field', minimalInputDynamicFormField());
  fixture.componentRef.setInput('containerLayout', SectionLayouts.ONE_COLUMN);
}

export function seedFieldConfigurationFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('field', minimalInputDynamicFormField());
  fixture.componentRef.setInput('options', {
    required: true,
    inputType: true,
    minMaxLength: false,
    minMaxValue: false,
    conditionalLogic: false,
    validator: false,
    decimalPrecision: false,
    prefillable: false,
    visible: true,
  });
}

export function seedDynamicFormTabsFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('formData', {} as DynamicFormData);
  fixture.componentRef.setInput('formType', FormTypes.INLINE);
  fixture.componentRef.setInput('formOptions', minimalFormOptions());
}

export function seedStepperFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('formData', {} as DynamicFormData);
  fixture.componentRef.setInput('formType', FormTypes.INLINE);
  fixture.componentRef.setInput('formOptions', minimalFormOptions());
}

export function seedSummaryFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('formData', {} as DynamicFormData);
}

export function seedSectionFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('section', minimalDynamicFormSection());
  fixture.componentRef.setInput('formData', {} as DynamicFormData);
  fixture.componentRef.setInput('formType', FormTypes.INLINE);
}

export function seedDynamicFormEditorFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('form', minimalDynamicForm());
}

export function seedEditorBorrowerInformationFixture<T>(
  fixture: ComponentFixture<T>
): void {
  fixture.componentRef.setInput('borrower', getDefaultBorrower());
}

export function seedBorrowerInformationFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('borrower', getDefaultBorrower());
  fixture.componentRef.setInput('customStyle', emptyCssRoot);
}

export function seedQuickRequiredConfigurationFixture<T>(
  fixture: ComponentFixture<T>
): void {
  fixture.componentRef.setInput('field', minimalInputDynamicFormField());
}

export function seedOptionsConfigurationFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('field', {
    ...minimalInputDynamicFormField(),
    fieldType: DynamicFormFieldTypes.SELECT,
    parameters: { options: [], placeholder: '' },
  } as DynamicFormField<unknown>);
}

export function seedSectionConfigurationFixture<T>(fixture: ComponentFixture<T>): void {
  fixture.componentRef.setInput('section', minimalDynamicFormSection());
}

export {
  afterEachDisposeDynamicFormFixture,
  disposeDynamicFormFixture,
  tryFlushDynamicFormZoneInFakeAsync,
} from './dynamic-forms-spec-teardown';
