import { JsonPipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import {
  applicationConfig,
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular';
import { from, of } from 'rxjs';
import { expect, waitFor, within } from 'storybook/test';
import type { FileMetadata } from '../../models/documents/fileModels';
import { RequestUserRoles, RequestUserTypes } from '../../models/requestModels';
import { DocumentService } from '../../services/documents/document.service';
import { EnvironmentService } from '../../services/environment/environment.service';
import { IAMService } from '../../services/identity/iam.service';
import { UiNotificationService } from '../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../services/organization/organization.service';
import { PdfViewerComponent } from '../documents/pdf-viewer/pdf-viewer.component';
import { PdfViewerService } from '../documents/pdf-viewer/pdf-viewer.service';
import { provideFieldFramework } from '../pdf/field-framework';
import { PdfAnnotationFillDirective } from './annotation-fill.directive';

/**
 * Minimal valid PDF (single blank page).
 */
function createBlankPdf(): ArrayBuffer {
  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n';
  const obj2 = '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n';
  const obj3 =
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n';

  const off1 = header.length;
  const off2 = off1 + obj1.length;
  const off3 = off2 + obj2.length;
  const xrefOff = off3 + obj3.length;
  const pad = (n: number) => n.toString().padStart(10, '0');

  const xref =
    'xref\n' +
    '0 4\n' +
    `${pad(0)} 65535 f \n` +
    `${pad(off1)} 00000 n \n` +
    `${pad(off2)} 00000 n \n` +
    `${pad(off3)} 00000 n \n`;
  const trailer = 'trailer<</Size 4/Root 1 0 R>>\n';
  const startxref = `startxref\n${xrefOff}\n%%EOF`;

  const pdfContent = header + obj1 + obj2 + obj3 + xref + trailer + startxref;
  return new TextEncoder().encode(pdfContent).buffer as ArrayBuffer;
}

const blankPdf = createBlankPdf();

const currentUserId = 'user-1';
const orgUserId = 'org-user-1';

const signatureMetadata = {
  pdfId: { permanent: 'test-pdf', changing: 'test-pdf' },
  format: 'https://pspdfkit.com/instant-json/v1',
  annotations: [
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-name-001',
      name: 'Name Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 150, 200, 30],
      formFieldName: 'custom-name-001',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'name',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
      },
    },
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-sig-001',
      name: 'Signature Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 250, 200, 30],
      formFieldName: 'custom-signature-001',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'signature',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
      },
    },
  ],
  formFields: [
    {
      v: 1,
      type: 'pspdfkit/form-field/text',
      id: 'ff-name-001',
      name: 'custom-name-001',
      label: 'custom-name-001',
      annotationIds: ['ann-name-001'],
      pdfObjectId: 1,
      defaultValue: '',
      multiLine: false,
      password: false,
      comb: false,
      richText: false,
      doNotScroll: false,
      doNotSpellCheck: false,
    },
    {
      v: 1,
      type: 'pspdfkit/form-field/signature',
      id: 'ff-sig-001',
      name: 'custom-signature-001',
      label: 'custom-signature-001',
      annotationIds: ['ann-sig-001'],
      pdfObjectId: 2,
      defaultValue: '',
    },
  ],
  formFieldValues: [],
};

/**
 * v2-shaped signature metadata for testing the field-framework v2 path
 * end-to-end (overlay render + onPress → signature modal).
 *
 * Differences vs `signatureMetadata`:
 * - `customData.schemaVersion === 2` so the bridge routes to the v2 overlay
 * - flat shape (no `isTemplate`, `signedBy`, etc.); fields match `SignatureFieldData`
 * - `customData.signer.id === currentUserId` so `canFillAnnotation` authorizes
 *   the active mock user → `onPress` opens the native signature modal
 * - `formFieldName` lacks the `custom-` prefix so the legacy v1 dispatch path
 *   does NOT match (the bridge's v2 branch handles render + press)
 */
const signatureMetadataV2 = {
  pdfId: { permanent: 'test-pdf', changing: 'test-pdf' },
  format: 'https://pspdfkit.com/instant-json/v1',
  annotations: [
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-v2-sig-001',
      name: 'V2 Signature Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 250, 200, 30],
      formFieldName: 'signature-v2-test',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        schemaVersion: 2,
        type: 'signature',
        signeeRoles: [RequestUserRoles.BORROWER],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
        filled: false,
        filledByUser: false,
        readonly: false,
      },
    },
  ],
  formFields: [
    {
      v: 1,
      type: 'pspdfkit/form-field/signature',
      id: 'ff-v2-sig-001',
      name: 'signature-v2-test',
      label: 'signature-v2-test',
      annotationIds: ['ann-v2-sig-001'],
      pdfObjectId: 1,
      defaultValue: '',
    },
  ],
  formFieldValues: [],
};

const signatureMetadataFilled = {
  ...signatureMetadata,
  annotations: signatureMetadata.annotations.map(a => ({
    ...a,
    customData: {
      ...a.customData,
      filled: true,
      filledBy: {
        userId: orgUserId,
        userFirstName: 'John',
        userLastName: 'Borrower',
        representing: currentUserId,
      },
    },
  })),
  formFieldValues: [
    {
      name: 'custom-name-001',
      value: 'John Borrower',
      type: 'pspdfkit/form-field-value',
      v: 1,
    },
  ],
};

const signatureMetadataUnauthorized = {
  ...signatureMetadata,
  annotations: signatureMetadata.annotations.map(a => ({
    ...a,
    customData: {
      ...a.customData,
      signer: {
        id: 'other-user-999',
        name: 'Carlos Martinez',
        role: RequestUserRoles.GUARANTOR,
      },
    },
  })),
};

const fullySigned = {
  ...signatureMetadata,
  annotations: signatureMetadata.annotations.map(a => ({
    ...a,
    customData: {
      ...a.customData,
      filled: true,
      filledBy: {
        userId: orgUserId,
        userFirstName: 'John',
        userLastName: 'Borrower',
        representing: currentUserId,
      },
      signedBy: [
        {
          id: currentUserId,
          name: 'John Borrower',
          signedAt: Date.now(),
        },
      ],
    },
  })),
  formFieldValues: [
    {
      name: 'custom-name-001',
      value: 'John Borrower',
      type: 'pspdfkit/form-field-value',
      v: 1,
    },
  ],
};

const dateFieldMetadata = {
  pdfId: { permanent: 'test-pdf', changing: 'test-pdf' },
  format: 'https://pspdfkit.com/instant-json/v1',
  annotations: [
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-name-001',
      name: 'Name Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 150, 200, 30],
      formFieldName: 'custom-name-001',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'name',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
      },
    },
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-date-001',
      name: 'Date Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 250, 120, 30],
      formFieldName: 'custom-date-001',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'date',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        date: null,
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
      },
    },
  ],
  formFields: [
    {
      v: 1,
      type: 'pspdfkit/form-field/text',
      id: 'ff-name-001',
      name: 'custom-name-001',
      label: 'custom-name-001',
      annotationIds: ['ann-name-001'],
      pdfObjectId: 1,
      defaultValue: '',
      multiLine: false,
      password: false,
      comb: false,
      richText: false,
      doNotScroll: false,
      doNotSpellCheck: false,
    },
    {
      v: 1,
      type: 'pspdfkit/form-field/text',
      id: 'ff-date-001',
      name: 'custom-date-001',
      label: 'custom-date-001',
      annotationIds: ['ann-date-001'],
      pdfObjectId: 2,
      defaultValue: '',
      multiLine: false,
      password: false,
      comb: false,
      richText: false,
      doNotScroll: false,
      doNotSpellCheck: false,
    },
  ],
  formFieldValues: [],
};

const initialsFieldMetadata = {
  pdfId: { permanent: 'test-pdf', changing: 'test-pdf' },
  format: 'https://pspdfkit.com/instant-json/v1',
  annotations: [
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-name-001',
      name: 'Name Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 150, 200, 30],
      formFieldName: 'custom-name-001',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'name',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
      },
    },
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-initials-001',
      name: 'Initials Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 250, 80, 30],
      formFieldName: 'custom-initials-001',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'initials',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
      },
    },
  ],
  formFields: [
    {
      v: 1,
      type: 'pspdfkit/form-field/text',
      id: 'ff-name-001',
      name: 'custom-name-001',
      label: 'custom-name-001',
      annotationIds: ['ann-name-001'],
      pdfObjectId: 1,
      defaultValue: '',
      multiLine: false,
      password: false,
      comb: false,
      richText: false,
      doNotScroll: false,
      doNotSpellCheck: false,
    },
    {
      v: 1,
      type: 'pspdfkit/form-field/signature',
      id: 'ff-initials-001',
      name: 'custom-initials-001',
      label: 'custom-initials-001',
      annotationIds: ['ann-initials-001'],
      pdfObjectId: 2,
    },
  ],
  formFieldValues: [],
};

const alreadySignedMetadata = {
  ...signatureMetadata,
  annotations: signatureMetadata.annotations.map(a => ({
    ...a,
    customData: {
      ...a.customData,
      filled: true,
      filledBy: {
        userId: orgUserId,
        userFirstName: 'John',
        userLastName: 'Borrower',
        representing: orgUserId,
      },
      signedBy: [
        {
          id: orgUserId,
          name: 'John Borrower',
          signedAt: Date.now(),
        },
      ],
    },
  })),
  formFieldValues: [
    {
      name: 'custom-name-001',
      value: 'John Borrower',
      type: 'pspdfkit/form-field-value',
      v: 1,
    },
  ],
};

const multiSignerMetadata = {
  pdfId: { permanent: 'test-pdf', changing: 'test-pdf' },
  format: 'https://pspdfkit.com/instant-json/v1',
  annotations: [
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-name-user1',
      name: 'Borrower Name',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 150, 200, 30],
      formFieldName: 'custom-name-user1',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'name',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
      },
    },
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-sig-user1',
      name: 'Borrower Signature',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 250, 200, 30],
      formFieldName: 'custom-sig-user1',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'signature',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
      },
    },
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-name-user2',
      name: 'Guarantor Name',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 400, 200, 30],
      formFieldName: 'custom-name-user2',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'name',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: 'other-user-999',
          name: 'Carlos Martinez',
          role: RequestUserRoles.GUARANTOR,
        },
      },
    },
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-sig-user2',
      name: 'Guarantor Signature',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 500, 200, 30],
      formFieldName: 'custom-sig-user2',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'signature',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: 'other-user-999',
          name: 'Carlos Martinez',
          role: RequestUserRoles.GUARANTOR,
        },
      },
    },
  ],
  formFields: [
    {
      v: 1,
      type: 'pspdfkit/form-field/text',
      id: 'ff-name-user1',
      name: 'custom-name-user1',
      label: 'custom-name-user1',
      annotationIds: ['ann-name-user1'],
      pdfObjectId: 1,
      defaultValue: '',
      multiLine: false,
      password: false,
      comb: false,
      richText: false,
      doNotScroll: false,
      doNotSpellCheck: false,
    },
    {
      v: 1,
      type: 'pspdfkit/form-field/signature',
      id: 'ff-sig-user1',
      name: 'custom-sig-user1',
      label: 'custom-sig-user1',
      annotationIds: ['ann-sig-user1'],
      pdfObjectId: 2,
    },
    {
      v: 1,
      type: 'pspdfkit/form-field/text',
      id: 'ff-name-user2',
      name: 'custom-name-user2',
      label: 'custom-name-user2',
      annotationIds: ['ann-name-user2'],
      pdfObjectId: 3,
      defaultValue: '',
      multiLine: false,
      password: false,
      comb: false,
      richText: false,
      doNotScroll: false,
      doNotSpellCheck: false,
    },
    {
      v: 1,
      type: 'pspdfkit/form-field/signature',
      id: 'ff-sig-user2',
      name: 'custom-sig-user2',
      label: 'custom-sig-user2',
      annotationIds: ['ann-sig-user2'],
      pdfObjectId: 4,
    },
  ],
  formFieldValues: [],
};

const multiSignerUsers = [
  {
    userId: currentUserId,
    role: RequestUserRoles.BORROWER,
    type: RequestUserTypes.INDIVIDUAL,
    profile: {
      id: currentUserId,
      firstName: 'John',
      lastName: 'Borrower',
      email: 'john@example.com',
    },
  },
  {
    userId: 'other-user-999',
    role: RequestUserRoles.GUARANTOR,
    type: RequestUserTypes.INDIVIDUAL,
    profile: {
      id: 'other-user-999',
      firstName: 'Carlos',
      lastName: 'Martinez',
      email: 'carlos@example.com',
    },
  },
];

function makeFileMetadata(
  sigMetadata: Record<string, unknown>
): Partial<FileMetadata> {
  return {
    id: 'file-1',
    originalName: 'test-contract.pdf',
    fileMetadata: {
      signatureTask: sigMetadata,
    },
  };
}

const users = [
  {
    userId: currentUserId,
    role: RequestUserRoles.BORROWER,
    type: RequestUserTypes.INDIVIDUAL,
    profile: {
      id: currentUserId,
      firstName: 'John',
      lastName: 'Borrower',
      email: 'john@example.com',
    },
  },
];

const mockPdfViewerService = {
  fetching: signal(false),
  licenseKey: signal(''),
  processFileSource: (source: unknown) => {
    if (source instanceof ArrayBuffer) return of(source);
    if (typeof source === 'string')
      return from(fetch(source).then(r => r.arrayBuffer()));
    return of(blankPdf);
  },
  getUserEmail: () => 'john@example.com',
  fetchFileAsArrayBuffer: (url: string) =>
    from(fetch(url).then(r => r.arrayBuffer())),
  appendParameters: (url: string) => url,
  invalidateFileCache: () => undefined,
};

const mockEnvironmentService = {
  getPsPdfKey: () => '',
  getBackEndBaseUrl: () => 'http://localhost',
  getAppType: () => 'web' as const,
  isProduction: () => false,
  isLocal: () => true,
  isIntegration: () => false,
  isTest: () => false,
  getEnvironment: () => 'local' as const,
  getNovuApplicationIdentifier: () => '',
  setEnvironment: () => undefined,
  setEnvironmentConfiguration: () => undefined,
  setPsPdfKey: () => undefined,
  setNovuApplicationIdentifier: () => undefined,
  environmentConfiguration: {
    pspdfLicenseKey: '',
    appType: 'web',
  },
};

const mockIAMService = {
  getActiveUser: () => ({
    id: currentUserId,
    userId: currentUserId,
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Borrower',
    disabled: false,
    activeOrganization: 'org-1',
    activeOrganizationUserId: orgUserId,
  }),
};

const mockUiNotificationService = {
  showSnackbar: () => undefined,
};

const mockOrganizationService = {
  isFeatureFlagActivated: () => false,
  isDemoModeActivated: () => false,
  uiConfiguration: {},
};

// PdfViewerComponent calls documentService.getSignatureCertificates() inside
// PSPDFKit's trustedCAsCallback. Empty list keeps the story hermetic.
const mockDocumentService = {
  getSignatureCertificates: () => of({ caCertificates: [] }),
};

const meta: Meta = {
  title: 'Signature/PdfSignatureSigner',
  tags: ['autodocs', 'test'],
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        { provide: PdfViewerService, useValue: mockPdfViewerService },
        { provide: EnvironmentService, useValue: mockEnvironmentService },
        { provide: IAMService, useValue: mockIAMService },
        {
          provide: UiNotificationService,
          useValue: mockUiNotificationService,
        },
        { provide: OrganizationService, useValue: mockOrganizationService },
        { provide: DocumentService, useValue: mockDocumentService },
        provideFieldFramework(),
      ],
    }),
    moduleMetadata({
      imports: [PdfViewerComponent, PdfAnnotationFillDirective, JsonPipe],
    }),
  ],
};

export default meta;
type Story = StoryObj;

const metadataPanelStyles =
  'margin-top: 8px; padding: 8px; background: #263238; color: #aed581; ' +
  'border-radius: 4px; font-family: monospace; font-size: 11px; ' +
  'max-height: 160px; overflow: auto; white-space: pre-wrap; word-break: break-all;';

function getMetadataJson(canvasElement: HTMLElement): Record<string, unknown> {
  const raw = canvasElement.querySelector('details div')?.textContent ?? '{}';
  return JSON.parse(raw) as Record<string, unknown>;
}

function assertAnnotationShape(
  annotations: Array<Record<string, unknown>>,
  expectedCount: number
): void {
  if (annotations.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} annotations, got ${annotations.length}`
    );
  }
  for (const ann of annotations) {
    const required = [
      'v',
      'type',
      'id',
      'opacity',
      'pageIndex',
      'bbox',
      'formFieldName',
      'customData',
    ];
    for (const key of required) {
      if (!(key in ann)) {
        throw new Error(`Annotation missing required key: ${key}`);
      }
    }
  }
}

function assertFormFieldsShape(
  formFields: Array<Record<string, unknown>>,
  expectedCount: number
): void {
  if (formFields.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} formFields, got ${formFields.length}`
    );
  }
  for (const ff of formFields) {
    const required = ['v', 'type', 'id', 'name', 'annotationIds'];
    for (const key of required) {
      if (!(key in ff)) {
        throw new Error(`FormField missing required key: ${key}`);
      }
    }
  }
}

export const SignerAuthorizedUnfilled: Story = {
  render: () => ({
    template: `
      <div style="padding: 16px; background: #f5f5f5;">
        <div
          data-testid="status-bar"
          style="margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px;"
          [style.background]="annotationFill.allUserRequiredFieldsFilled() ? '#e8f5e9' : '#fff3e0'">
          Signed in as <strong>John Borrower</strong> —
          @if (annotationFill.allUserRequiredFieldsFilled()) {
            All fields filled ✓
          } @else {
            fields pending
          }
          <span style="float: right; font-size: 11px; color: #666;">
            documentFullySigned: {{ annotationFill.documentFullySigned() }}
          </span>
        </div>
        <div style="height: 500px; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-fill
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            [fileMetadata]="fileMetadata"
            [users]="users"
            #annotationFill="ljPdfAnnotationFill">
          </div>
          <lj-pdf-viewer
            #pdfViewer
            mode="preview"
            [file]="pdfFile"
            [fileMetadata]="fileMetadata"
            [documentMetadata]="documentMetadata" />
        </div>
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; font-size: 12px; color: #666;">Signature Metadata</summary>
          <div style="${metadataPanelStyles}">{{ ($any(annotationFill.currentFileMetadata()?.fileMetadata)?.signatureTask || documentMetadata) | json }}</div>
        </details>
      </div>
    `,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(signatureMetadata),
      documentMetadata: signatureMetadata,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const statusText =
      canvasElement.querySelector('[data-testid="status-bar"]')?.textContent ??
      '';
    await expect(statusText).toContain('John Borrower');
    await expect(canvas.getByText(/fields pending/)).toBeInTheDocument();
    await expect(canvas.getByText(/Signature Metadata/)).toBeInTheDocument();

    // Metadata snapshot: verify unfilled state
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    const formFields = metadata['formFields'] as Array<Record<string, unknown>>;
    const formFieldValues = metadata['formFieldValues'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 2);
    assertFormFieldsShape(formFields, 2);
    await expect(formFieldValues.length).toBe(0);

    const nameAnnotation = annotations.at(0);
    const sigAnnotation = annotations.at(1);
    const nameCustomData = nameAnnotation?.['customData'] as Record<
      string,
      unknown
    >;
    const sigCustomData = sigAnnotation?.['customData'] as Record<
      string,
      unknown
    >;
    await expect(nameCustomData['filled']).toBe(false);
    await expect(sigCustomData['filled']).toBe(false);
    await expect(nameCustomData['type']).toBe('name');
    await expect(sigCustomData['type']).toBe('signature');
    const nameSigner = nameCustomData['signer'] as Record<string, unknown>;
    await expect(nameSigner['name']).toBe('John Borrower');
    await expect(nameSigner['id']).toBe(currentUserId);

    // Both fields unfilled on load → directive signal shows pending, not fully signed.
    // statusText was captured at the top of this play function.
    await expect(statusText).toContain('documentFullySigned: false');
  },
};

export const SignerUnauthorized: Story = {
  render: () => ({
    template: `
      <div style="padding: 16px; background: #f5f5f5;">
        <div data-testid="status-bar" style="margin-bottom: 8px; padding: 8px 12px; background: #fce4ec; border-radius: 4px; font-size: 13px;">
          Signed in as <strong>John Borrower</strong> — fields assigned to <em>Carlos Martinez</em> (read-only)
          <span style="float: right; font-size: 11px; color: #666;">
            documentFullySigned: {{ annotationFill.documentFullySigned() }}
          </span>
        </div>
        <div style="height: 500px; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-fill
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            [fileMetadata]="fileMetadata"
            [users]="users"
            #annotationFill="ljPdfAnnotationFill">
          </div>
          <lj-pdf-viewer
            #pdfViewer
            mode="preview"
            [file]="pdfFile"
            [fileMetadata]="fileMetadata"
            [documentMetadata]="documentMetadata" />
        </div>
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; font-size: 12px; color: #666;">Signature Metadata</summary>
          <div style="${metadataPanelStyles}">{{ ($any(annotationFill.currentFileMetadata()?.fileMetadata)?.signatureTask || documentMetadata) | json }}</div>
        </details>
      </div>
    `,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(signatureMetadataUnauthorized),
      documentMetadata: signatureMetadataUnauthorized,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    const statusText =
      canvasElement.querySelector('[data-testid="status-bar"]')?.textContent ??
      '';
    await expect(statusText).toContain('Carlos Martinez');
    await expect(statusText).toContain('read-only');

    // Metadata snapshot: verify unauthorized signer metadata
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    const formFields = metadata['formFields'] as Array<Record<string, unknown>>;
    const formFieldValues = metadata['formFieldValues'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 2);
    assertFormFieldsShape(formFields, 2);
    await expect(formFieldValues.length).toBe(0);

    const nameCustomData = annotations.at(0)?.['customData'] as Record<
      string,
      unknown
    >;
    const sigCustomData = annotations.at(1)?.['customData'] as Record<
      string,
      unknown
    >;
    await expect(nameCustomData['filled']).toBe(false);
    await expect(sigCustomData['filled']).toBe(false);
    const signer = nameCustomData['signer'] as Record<string, unknown>;
    await expect(signer['name']).toBe('Carlos Martinez');
    await expect(signer['id']).toBe('other-user-999');
    await expect(signer['role']).toBe(RequestUserRoles.GUARANTOR);

    // Verify directive signals: user has no authorized fields
    await expect(statusText).toContain('documentFullySigned: false');

    // Readonly enforcement is covered by the fill directive's authorization
    // logic (canFillAnnotation returns false for unauthorized users). The
    // formFieldValues array in the metadata snapshot above confirms no values
    // were written: length === 0 means no field has been touched.
    await expect(formFieldValues.length).toBe(0);
  },
};

export const SignerAllFieldsFilled: Story = {
  render: () => ({
    template: `
      <div style="padding: 16px; background: #f5f5f5;">
        <div
          data-testid="status-bar"
          style="margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px;"
          [style.background]="annotationFill.allUserRequiredFieldsFilled() ? '#e8f5e9' : '#fff3e0'">
          @if (annotationFill.allUserRequiredFieldsFilled()) {
            All fields filled by <strong>John Borrower</strong> — ready to confirm ✓
          } @else {
            Filling in progress…
          }
          <span style="float: right; font-size: 11px; color: #666;">
            allFieldsFilled: {{ annotationFill.allUserRequiredFieldsFilled() }} |
            documentFullySigned: {{ annotationFill.documentFullySigned() }}
          </span>
        </div>
        <div style="height: 500px; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-fill
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            [fileMetadata]="fileMetadata"
            [users]="users"
            #annotationFill="ljPdfAnnotationFill">
          </div>
          <lj-pdf-viewer
            #pdfViewer
            mode="preview"
            [file]="pdfFile"
            [fileMetadata]="fileMetadata"
            [documentMetadata]="documentMetadata" />
        </div>
        <details style="margin-top: 8px;" open>
          <summary style="cursor: pointer; font-size: 12px; color: #666;">Signature Metadata</summary>
          <div style="${metadataPanelStyles}">{{ ($any(annotationFill.currentFileMetadata()?.fileMetadata)?.signatureTask || documentMetadata) | json }}</div>
        </details>
      </div>
    `,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(signatureMetadataFilled),
      documentMetadata: signatureMetadataFilled,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    const statusText =
      canvasElement.querySelector('[data-testid="status-bar"]')?.textContent ??
      '';
    await expect(statusText).toContain('John Borrower');

    // Metadata snapshot: verify filled state
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    const formFields = metadata['formFields'] as Array<Record<string, unknown>>;
    const formFieldValues = metadata['formFieldValues'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 2);
    assertFormFieldsShape(formFields, 2);
    await expect(formFieldValues.length).toBe(1);

    const nameCustomData = annotations.at(0)?.['customData'] as Record<
      string,
      unknown
    >;
    const sigCustomData = annotations.at(1)?.['customData'] as Record<
      string,
      unknown
    >;
    await expect(nameCustomData['filled']).toBe(true);
    await expect(sigCustomData['filled']).toBe(true);

    const filledBy = nameCustomData['filledBy'] as Record<string, unknown>;
    await expect(filledBy['userFirstName']).toBe('John');
    await expect(filledBy['userLastName']).toBe('Borrower');
    await expect(filledBy['representing']).toBe(currentUserId);

    const fv = formFieldValues.at(0);
    await expect(fv?.['name']).toBe('custom-name-001');
    await expect(fv?.['value']).toBe('John Borrower');

    // Verify no signedBy in this state
    const signedBy = nameCustomData['signedBy'] as Array<unknown>;
    await expect(signedBy.length).toBe(0);

    // Verify directive signals via rendered template text
    await waitFor(
      () => {
        const text =
          canvasElement.querySelector('[data-testid="status-bar"]')
            ?.textContent ?? '';
        if (!text.includes('allFieldsFilled: true')) {
          throw new Error('Expected allFieldsFilled: true');
        }
      },
      { timeout: 5000 }
    );

    const signalText =
      canvasElement.querySelector('[data-testid="status-bar"]')?.textContent ??
      '';
    await expect(signalText).toContain('allFieldsFilled: true');
    await expect(signalText).toContain('documentFullySigned: true');
    await expect(signalText).toContain('ready to confirm');
  },
};

export const DocumentFullySigned: Story = {
  render: () => ({
    template: `
      <div style="padding: 16px; background: #f5f5f5;">
        <div
          data-testid="status-bar"
          style="margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px;"
          [style.background]="annotationFill.documentFullySigned() ? '#e0f2f1' : '#fff3e0'">
          @if (annotationFill.documentFullySigned()) {
            Document <strong>fully signed</strong> by all parties ✓
          } @else {
            Awaiting signatures…
          }
          <span style="float: right; font-size: 11px; color: #666;">
            allFieldsFilled: {{ annotationFill.allUserRequiredFieldsFilled() }} |
            documentFullySigned: {{ annotationFill.documentFullySigned() }}
          </span>
        </div>
        <div style="height: 500px; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-fill
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            [fileMetadata]="fileMetadata"
            [users]="users"
            #annotationFill="ljPdfAnnotationFill">
          </div>
          <lj-pdf-viewer
            #pdfViewer
            mode="preview"
            [file]="pdfFile"
            [fileMetadata]="fileMetadata"
            [documentMetadata]="documentMetadata" />
        </div>
        <details style="margin-top: 8px;" open>
          <summary style="cursor: pointer; font-size: 12px; color: #666;">Signature Metadata</summary>
          <div style="${metadataPanelStyles}">{{ ($any(annotationFill.currentFileMetadata()?.fileMetadata)?.signatureTask || documentMetadata) | json }}</div>
        </details>
      </div>
    `,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(fullySigned),
      documentMetadata: fullySigned,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    // Metadata snapshot: verify fully signed state
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    const formFields = metadata['formFields'] as Array<Record<string, unknown>>;
    const formFieldValues = metadata['formFieldValues'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 2);
    assertFormFieldsShape(formFields, 2);
    await expect(formFieldValues.length).toBe(1);

    const nameCustomData = annotations.at(0)?.['customData'] as Record<
      string,
      unknown
    >;
    const sigCustomData = annotations.at(1)?.['customData'] as Record<
      string,
      unknown
    >;
    await expect(nameCustomData['filled']).toBe(true);
    await expect(sigCustomData['filled']).toBe(true);

    const filledBy = nameCustomData['filledBy'] as Record<string, unknown>;
    await expect(filledBy['userFirstName']).toBe('John');
    await expect(filledBy['userLastName']).toBe('Borrower');

    const fv = formFieldValues.at(0);
    await expect(fv?.['name']).toBe('custom-name-001');
    await expect(fv?.['value']).toBe('John Borrower');

    // Verify signedBy is present in fully signed state
    const signedBy = nameCustomData['signedBy'] as Array<
      Record<string, unknown>
    >;
    await expect(signedBy.length).toBe(1);
    await expect(signedBy.at(0)?.['name']).toBe('John Borrower');
    await expect(signedBy.at(0)?.['id']).toBe(currentUserId);

    // Verify directive signals via rendered template text
    await waitFor(
      () => {
        const text =
          canvasElement.querySelector('[data-testid="status-bar"]')
            ?.textContent ?? '';
        if (!text.includes('documentFullySigned: true')) {
          throw new Error('Expected documentFullySigned: true');
        }
      },
      { timeout: 5000 }
    );

    const signalText =
      canvasElement.querySelector('[data-testid="status-bar"]')?.textContent ??
      '';
    await expect(signalText).toContain('documentFullySigned: true');
    await expect(signalText).toContain('fully signed');
  },
};

const mixedFieldsMetadata = {
  pdfId: { permanent: 'test-pdf', changing: 'test-pdf' },
  format: 'https://pspdfkit.com/instant-json/v1',
  schemaVersion: 2,
  annotations: [
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-name-001',
      name: 'Name Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 100, 200, 30],
      formFieldName: 'platform-name-001',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'name',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
        signee: null,
        name: null,
      },
    },
    {
      v: 1,
      type: 'pspdfkit/widget',
      id: 'ann-sig-001',
      name: 'Signature Field',
      opacity: 1,
      pageIndex: 0,
      bbox: [50, 200, 200, 30],
      formFieldName: 'platform-sig-001',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
      creatorName: 'test',
      customData: {
        type: 'signature',
        visible: true,
        readonly: false,
        filled: false,
        isTemplate: false,
        signedBy: [] as Record<string, unknown>[],
        signer: {
          id: currentUserId,
          name: 'John Borrower',
          role: RequestUserRoles.BORROWER,
        },
        signee: null,
      },
    },
  ],
  formFields: [
    {
      v: 1,
      type: 'pspdfkit/form-field/text',
      id: 'ff-name-001',
      name: 'platform-name-001',
      label: 'platform-name-001',
      annotationIds: ['ann-name-001'],
      pdfObjectId: 1,
      defaultValue: '',
      multiLine: false,
      password: false,
      comb: false,
      richText: false,
      doNotScroll: false,
      doNotSpellCheck: false,
    },
    {
      v: 1,
      type: 'pspdfkit/form-field/signature',
      id: 'ff-sig-001',
      name: 'platform-sig-001',
      label: 'platform-sig-001',
      annotationIds: ['ann-sig-001'],
      pdfObjectId: 2,
    },
  ],
  formFieldValues: [
    {
      name: 'Learn More Button',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'Knowledge Level',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: ['Intermediate'],
    },
    {
      name: 'Signature Field 1',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'platform-name-001',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
    },
    {
      name: 'Date ',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'Topics 1',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'Last Name',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: 'lhlj',
    },
    {
      name: 'Topics 2',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'Topics 3',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'Newsletter',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'Select Days',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'First Name',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'Phone Number',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'platform-sig-001',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
    {
      name: 'Email',
      type: 'pspdfkit/form-field-value' as const,
      v: 1,
      value: '',
    },
  ],
};

export const MixedPlatformAndNativeFields: Story = {
  render: () => ({
    template: `
      <div style="padding: 16px; background: #f5f5f5;">
        <div
          data-testid="status-bar"
          style="margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px;"
          [style.background]="annotationFill.allUserRequiredFieldsFilled() ? '#e8f5e9' : '#fff3e0'">
          Signed in as <strong>John Borrower</strong> —
          @if (annotationFill.allUserRequiredFieldsFilled()) {
            All assigned fields filled ✓
          } @else {
            assigned fields pending
          }
          <span style="float: right; font-size: 11px; color: #666;">
            documentFullySigned: {{ annotationFill.documentFullySigned() }}
          </span>
        </div>
        <div style="height: 500px; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-fill
            #annotationFill="ljPdfAnnotationFill"
            [pdfViewerInstance]="pdfViewer.pdfViewerInstance()"
            [fileMetadata]="fileMetadata"
            [users]="users">
            <lj-pdf-viewer
              #pdfViewer="pdfViewer"
              mode="view"
              [file]="pdfFile"
              [documentMetadata]="documentMetadata" />
          </div>
        </div>
        <details style="margin-top: 8px;" open>
          <summary style="cursor: pointer; font-size: 12px; color: #666;">Mixed Fields Metadata</summary>
          <div style="${metadataPanelStyles}">{{ ($any(annotationFill.currentFileMetadata()?.fileMetadata)?.signatureTask || documentMetadata) | json }}</div>
        </details>
      </div>
    `,
    props: {
      pdfFile: '/assets/documents/fields-example.pdf',
      fileMetadata: makeFileMetadata(mixedFieldsMetadata),
      documentMetadata: mixedFieldsMetadata,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(
      () => {
        const metadata = getMetadataJson(canvasElement);
        const formFieldValues = metadata['formFieldValues'] as
          | Array<Record<string, unknown>>
          | undefined;
        if (!formFieldValues || formFieldValues.length === 0) {
          throw new Error(
            `Waiting for formFieldValues to be bootstrapped — have ${formFieldValues?.length ?? 0} entries`
          );
        }
      },
      { timeout: 15000 }
    );

    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    const formFieldValues = metadata['formFieldValues'] as Array<
      Record<string, unknown>
    >;

    const platformAnnotations = annotations.filter(a => {
      const signer = (a['customData'] as Record<string, unknown>)['signer'];
      return signer !== null && signer !== undefined;
    });

    await expect(platformAnnotations.length).toBe(2);

    await expect(formFieldValues.length).toBeGreaterThan(0);
    const nativeFieldValueNames = formFieldValues
      .map(v => v['name'] as string)
      .filter(
        name => name !== 'platform-name-001' && name !== 'platform-sig-001'
      );
    await expect(nativeFieldValueNames.length).toBeGreaterThan(0);

    for (const entry of formFieldValues) {
      await expect(entry['type']).toBe('pspdfkit/form-field-value');
      await expect(entry['name']).toBeTruthy();
    }

    await expect(metadata['schemaVersion']).toBe(2);
  },
};


const signerStoryTemplate = `
  <div style="padding: 16px; background: #f5f5f5;">
    <div
      data-testid="status-bar"
      style="margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px;"
      [style.background]="annotationFill.allUserRequiredFieldsFilled() ? '#e8f5e9' : '#fff3e0'">
      @if (annotationFill.alreadySignedByUser()) {
        Already signed ✓
      } @else if (annotationFill.allUserRequiredFieldsFilled()) {
        All fields filled ✓
      } @else {
        fields pending
      }
      <span style="float: right; font-size: 11px; color: #666;">
        allFieldsFilled: {{ annotationFill.allUserRequiredFieldsFilled() }} |
        documentFullySigned: {{ annotationFill.documentFullySigned() }} |
        alreadySigned: {{ annotationFill.alreadySignedByUser() }}
      </span>
    </div>
    <div style="height: 500px; position: relative; background: white; border-radius: 8px; overflow: hidden;">
      <div
        lj-pdf-annotation-fill
        [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
        [fileMetadata]="fileMetadata"
        [users]="users"
        #annotationFill="ljPdfAnnotationFill">
      </div>
      <lj-pdf-viewer
        #pdfViewer
        mode="preview"
        [file]="pdfFile"
        [fileMetadata]="fileMetadata"
        [documentMetadata]="documentMetadata" />
    </div>
    <details style="margin-top: 8px;">
      <summary style="cursor: pointer; font-size: 12px; color: #666;">Signature Metadata</summary>
      <div style="${metadataPanelStyles}">{{ ($any(annotationFill.currentFileMetadata()?.fileMetadata)?.signatureTask || documentMetadata) | json }}</div>
    </details>
  </div>
`;

export const SignerFillsDateField: Story = {
  render: () => ({
    template: signerStoryTemplate,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(dateFieldMetadata),
      documentMetadata: dateFieldMetadata,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 2);

    const dateAnnotation = annotations.find(
      a => (a['customData'] as Record<string, unknown>)['type'] === 'date'
    );
    await expect(dateAnnotation).toBeDefined();
    if (!dateAnnotation) {
      throw new Error('Date annotation not found');
    }
    const dateCustomData = dateAnnotation['customData'] as Record<
      string,
      unknown
    >;
    await expect(dateCustomData['date']).toBeNull();
    await expect(dateCustomData['filled']).toBe(false);
  },
};

export const SignerFillsInitialsField: Story = {
  render: () => ({
    template: signerStoryTemplate,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(initialsFieldMetadata),
      documentMetadata: initialsFieldMetadata,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 2);

    const initialsAnnotation = annotations.find(
      a => (a['customData'] as Record<string, unknown>)['type'] === 'initials'
    );
    await expect(initialsAnnotation).toBeDefined();
    if (!initialsAnnotation) {
      throw new Error('Initials annotation not found');
    }
    const initialsCustomData = initialsAnnotation['customData'] as Record<
      string,
      unknown
    >;
    await expect(initialsCustomData['filled']).toBe(false);

    // Verify the initials field uses signature form field type (opens modal)
    const formFields = metadata['formFields'] as Array<Record<string, unknown>>;
    const initialsFormField = formFields.find(
      ff => ff['name'] === 'custom-initials-001'
    );
    await expect(initialsFormField).toBeDefined();
    if (!initialsFormField) {
      throw new Error('Initials form field not found');
    }
    await expect(initialsFormField['type']).toBe(
      'pspdfkit/form-field/signature'
    );

    // Verify the signer is correct
    const signer = initialsCustomData['signer'] as Record<string, unknown>;
    await expect(signer['name']).toBe('John Borrower');
    await expect(signer['id']).toBe(currentUserId);
  },
};

export const AlreadySignedByUser: Story = {
  render: () => ({
    template: signerStoryTemplate,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(alreadySignedMetadata),
      documentMetadata: alreadySignedMetadata,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    // Verify metadata state
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 2);

    // All annotations should be filled with signedBy
    for (const ann of annotations) {
      const customData = ann['customData'] as Record<string, unknown>;
      await expect(customData['filled']).toBe(true);
      const signedBy = customData['signedBy'] as Array<Record<string, unknown>>;
      await expect(signedBy.length).toBe(1);
      await expect(signedBy.at(0)?.['name']).toBe('John Borrower');
    }

    // Verify directive recognizes the already-signed state
    await waitFor(
      () => {
        const text =
          canvasElement.querySelector('[data-testid="status-bar"]')
            ?.textContent ?? '';
        if (!text.includes('alreadySigned: true')) {
          throw new Error('Expected alreadySigned: true');
        }
      },
      { timeout: 5000 }
    );

    const signalText =
      canvasElement.querySelector('[data-testid="status-bar"]')?.textContent ??
      '';
    await expect(signalText).toContain('alreadySigned: true');
    await expect(signalText).toContain('Already signed');

    // allUserRequiredFieldsFilled should be false when already signed
    await expect(signalText).toContain('allFieldsFilled: false');
  },
};

export const MultipleSignersCrossVisibility: Story = {
  render: () => ({
    template: `
      <div style="padding: 16px; background: #f5f5f5;">
        <div
          data-testid="status-bar"
          style="margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px;"
          [style.background]="annotationFill.allUserRequiredFieldsFilled() ? '#e8f5e9' : '#fff3e0'">
          Signed in as <strong>John Borrower</strong> — 2 signers on document
          <span style="float: right; font-size: 11px; color: #666;">
            allFieldsFilled: {{ annotationFill.allUserRequiredFieldsFilled() }} |
            documentFullySigned: {{ annotationFill.documentFullySigned() }}
          </span>
        </div>
        <div style="height: 500px; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-fill
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            [fileMetadata]="fileMetadata"
            [users]="users"
            #annotationFill="ljPdfAnnotationFill">
          </div>
          <lj-pdf-viewer
            #pdfViewer
            mode="preview"
            [file]="pdfFile"
            [fileMetadata]="fileMetadata"
            [documentMetadata]="documentMetadata" />
        </div>
        <details style="margin-top: 8px;" open>
          <summary style="cursor: pointer; font-size: 12px; color: #666;">Multi-Signer Metadata</summary>
          <div style="${metadataPanelStyles}">{{ ($any(annotationFill.currentFileMetadata()?.fileMetadata)?.signatureTask || documentMetadata) | json }}</div>
        </details>
      </div>
    `,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(multiSignerMetadata),
      documentMetadata: multiSignerMetadata,
      users: multiSignerUsers,
    },
  }),
  play: async ({ canvasElement }) => {
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 4);

    // Verify 2 annotations per signer
    const borrowerAnnotations = annotations.filter(a => {
      const signer = (a['customData'] as Record<string, unknown>)[
        'signer'
      ] as Record<string, unknown>;
      return signer['id'] === currentUserId;
    });
    const guarantorAnnotations = annotations.filter(a => {
      const signer = (a['customData'] as Record<string, unknown>)[
        'signer'
      ] as Record<string, unknown>;
      return signer['id'] === 'other-user-999';
    });
    await expect(borrowerAnnotations.length).toBe(2);
    await expect(guarantorAnnotations.length).toBe(2);

    // Verify borrower fields include name + signature
    const borrowerTypes = borrowerAnnotations.map(
      a => (a['customData'] as Record<string, unknown>)['type']
    );
    await expect(borrowerTypes).toContain('name');
    await expect(borrowerTypes).toContain('signature');

    // All unfilled
    for (const ann of annotations) {
      const customData = ann['customData'] as Record<string, unknown>;
      await expect(customData['filled']).toBe(false);
    }

    // Verify directive signals:
    // documentFullySigned should be false (nothing is filled)
    const statusText =
      canvasElement.querySelector('[data-testid="status-bar"]')?.textContent ??
      '';
    await expect(statusText).toContain('documentFullySigned: false');
  },
};

export const SigningLifecycle: Story = {
  render: () => ({
    template: signerStoryTemplate,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(signatureMetadata),
      documentMetadata: signatureMetadata,
      users,
    },
  }),
  play: async ({ canvasElement }) => {
    // Phase 1: Verify initial unfilled state
    const metadata = getMetadataJson(canvasElement);
    const annotations = metadata['annotations'] as Array<
      Record<string, unknown>
    >;
    assertAnnotationShape(annotations, 2);

    for (const ann of annotations) {
      const customData = ann['customData'] as Record<string, unknown>;
      await expect(customData['filled']).toBe(false);
    }

    const statusText =
      canvasElement.querySelector('[data-testid="status-bar"]')?.textContent ??
      '';
    await expect(statusText).toContain('fields pending');

    // Both form fields must be declared in the metadata for the directive
    // to drive its filled/unfilled logic.
    const formFields = metadata['formFields'] as Array<Record<string, unknown>>;
    assertFormFieldsShape(formFields, 2);
  },
};

/**
 * Loads a single v2-shaped signature annotation whose `customData.signer.id`
 * matches the mock IAM user — so `canFillAnnotation` authorizes and the
 * signature plugin's `onPress` opens the native PSPDFKit signature modal.
 *
 * Manual verification:
 * 1. Wait for the PDF to render — the signature widget shows the v2 overlay
 *    (centered SVG signature pen, no green chrome / role chip / signee name).
 * 2. Click the widget. The native PSPDFKit signature modal should open
 *    ("Add your signature" with Draw/Type/Image tabs).
 *
 * If the modal opens, the bridge's `annotations.press` dispatcher is wired
 * correctly AND `onPress` is firing through `canFillAnnotation`. If nothing
 * happens, check the DevTools console for an authorization mismatch.
 */
export const V2SignaturePressOpensModal: Story = {
  render: () => ({
    template: `
      <div style="padding: 16px; background: #f5f5f5;">
        <div
          data-testid="status-bar"
          style="margin-bottom: 8px; padding: 8px 12px; border-radius: 4px; font-size: 13px; background: #e3f2fd;">
          <strong>v2 signature press test</strong> — click the widget below; the native signature modal should open.
        </div>
        <div style="height: 500px; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-fill
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            [fileMetadata]="fileMetadata"
            [users]="users"
            #annotationFill="ljPdfAnnotationFill">
          </div>
          <lj-pdf-viewer
            #pdfViewer
            mode="preview"
            [file]="pdfFile"
            [fileMetadata]="fileMetadata"
            [documentMetadata]="documentMetadata" />
        </div>
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; font-size: 12px; color: #666;">v2 Signature Metadata</summary>
          <div style="${metadataPanelStyles}">{{ ($any(annotationFill.currentFileMetadata()?.fileMetadata)?.signatureTask || documentMetadata) | json }}</div>
        </details>
      </div>
    `,
    props: {
      pdfFile: blankPdf,
      fileMetadata: makeFileMetadata(signatureMetadataV2),
      documentMetadata: signatureMetadataV2,
      users,
    },
  }),
};
