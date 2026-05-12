import { DragDropModule } from '@angular/cdk/drag-drop';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import {
    applicationConfig,
    type Meta,
    moduleMetadata,
    type StoryObj,
} from '@storybook/angular';
import { of } from 'rxjs';
import { expect, within } from 'storybook/test';
import { RequestUserRoles } from '../../models/requestModels';
import { EnvironmentService } from '../../services/environment/environment.service';
import { IAMService } from '../../services/identity/iam.service';
import { UiNotificationService } from '../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../services/organization/organization.service';
import { DocumentService } from '../../services/documents/document.service';
import { FieldsService } from '../../services/products/fields/fields.service';
import { PdfViewerComponent } from '../documents/pdf-viewer/pdf-viewer.component';
import { PdfViewerService } from '../documents/pdf-viewer/pdf-viewer.service';
import { FieldInspectorComponent, provideFieldFramework } from '../pdf/field-framework';
import { PdfAnnotationDropZoneDirective } from './annotation-drop-zone.directive';
import type { SignerInfo } from '../pdf/field-framework/types/field-data';
import { AnnotationsMenuComponent } from './annotations-menu/annotations-menu.component';

/**
 * Minimal valid PDF (single blank page, 612x792 pt).
 * Generated inline to avoid external file dependencies.
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

const testSigner: SignerInfo = {
  id: 'signer-1',
  name: 'John Borrower',
  role: RequestUserRoles.BORROWER,
  image: null,
  imageUrl: null,
};

const blankPdf = createBlankPdf();


const mockPdfViewerService = {
  fetching: signal(false),
  licenseKey: signal(''),
  processFileSource: () => of(blankPdf),
  getUserEmail: () => 'test@example.com',
  fetchFileAsArrayBuffer: () => of(blankPdf),
  appendParameters: (url: string) => url,
  invalidateFileCache: () => undefined,
};

const mockEnvironmentService = {
  getPsPdfKey: () => '',
  getBackEndBaseUrl: () => 'http://localhost',
  getAppType: () => 'backoffice' as const,
  // Returning false routes signature drops through the v2 PDF field framework
  // (the dev/test path); production keeps the v1 factory.
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
    appType: 'backoffice',
  },
};

const mockIAMService = {
  getActiveUser: () => ({
    id: 'user-1',
    userId: 'user-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    disabled: false,
    activeOrganization: 'org-1',
    activeOrganizationUserId: 'org-user-1',
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

const mockFieldsService = {
  getFields: () => of({ items: [] }),
};

// PdfViewerComponent calls documentService.getSignatureCertificates() inside
// PSPDFKit's trustedCAsCallback. Returning an empty list keeps stories hermetic
// (no network) and lets PSPDFKit.load resolve.
const mockDocumentService = {
  getSignatureCertificates: () => of({ caCertificates: [] }),
};

const meta: Meta = {
  title: 'Signature/PdfSignatureBuilder',
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
        { provide: FieldsService, useValue: mockFieldsService },
        { provide: DocumentService, useValue: mockDocumentService },
        provideFieldFramework(),
      ],
    }),
    moduleMetadata({
      imports: [
        DragDropModule,
        PdfViewerComponent,
        AnnotationsMenuComponent,
        PdfAnnotationDropZoneDirective,
        FieldInspectorComponent,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const TemplateBuilder: Story = {
  render: () => ({
    template: `
      <lj-pdf-field-inspector />
      <div cdkDropListGroup style="display: flex; height: 600px; gap: 16px; padding: 16px; background: #f5f5f5;">
        <div style="width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; padding: 12px; background: white; border-radius: 8px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600;">Add fields</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">Drag and drop fields on the document</p>
          <lj-annotations-menu
            [connectedTo]="['pdf-drop-area']"
            [signer]="signer"
            [isTemplate]="false" />
        </div>

        <div style="flex: 1; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-dropzone
            dropListId="pdf-drop-area"
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            (create)="onAnnotationCreated($event)"
            (fail)="onDropFail($event)"
            style="width: 100%; height: 100%;">
            <lj-pdf-viewer
              #pdfViewer
              mode="edit"
              [file]="pdfFile" />
          </div>
        </div>
      </div>
    `,
    props: {
      signer: testSigner,
      pdfFile: blankPdf,
      onAnnotationCreated: (event: unknown) =>
        console.error('[Story] Annotation created:', event),
      onDropFail: (event: unknown) =>
        console.error('[Story] Drop failed:', event),
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Signature')).toBeInTheDocument();
    await expect(canvas.getByText('Initials')).toBeInTheDocument();
    await expect(canvas.getByText('Date')).toBeInTheDocument();
  },
};

export const TemplateBuilderWithSignerSelected: Story = {
  render: () => ({
    template: `
      <div cdkDropListGroup style="display: flex; height: 600px; gap: 16px; padding: 16px; background: #f5f5f5;">
        <div style="width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; padding: 12px; background: white; border-radius: 8px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600;">Signer</h3>
          <div style="padding: 8px; background: #e3f2fd; border-radius: 4px; font-size: 13px;">
            <strong>{{ signer.name }}</strong>
            <span style="display: block; color: #666; font-size: 11px;">{{ signer.role }}</span>
          </div>
          <h3 style="margin: 8px 0 0; font-size: 14px; font-weight: 600;">Add fields</h3>
          <lj-annotations-menu
            [connectedTo]="['pdf-drop-area']"
            [signer]="signer"
            [isTemplate]="false" />
        </div>

        <div style="flex: 1; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-dropzone
            dropListId="pdf-drop-area"
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            (create)="onAnnotationCreated($event)"
            (fail)="onDropFail($event)"
            style="width: 100%; height: 100%;">
            <lj-pdf-viewer
              #pdfViewer
              mode="edit"
              [file]="pdfFile" />
          </div>
        </div>
      </div>
    `,
    props: {
      signer: testSigner,
      pdfFile: blankPdf,
      onAnnotationCreated: (event: unknown) =>
        console.error('[Story] Annotation created:', event),
      onDropFail: (event: unknown) =>
        console.error('[Story] Drop failed:', event),
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('John Borrower')).toBeInTheDocument();
    await expect(canvas.getByText('Name')).toBeInTheDocument();
    await expect(canvas.getByText('Signature')).toBeInTheDocument();
  },
};

export const BuilderNoSigner: Story = {
  render: () => ({
    template: `
      <div cdkDropListGroup style="display: flex; height: 600px; gap: 16px; padding: 16px; background: #f5f5f5;">
        <div style="width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; padding: 12px; background: white; border-radius: 8px;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600;">Add fields</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">Select a signer first to enable drag and drop</p>
          <lj-annotations-menu
            [disabled]="true"
            [connectedTo]="['pdf-drop-area']"
            [isTemplate]="false" />
        </div>

        <div style="flex: 1; position: relative; background: white; border-radius: 8px; overflow: hidden;">
          <div
            lj-pdf-annotation-dropzone
            dropListId="pdf-drop-area"
            [droppable]="false"
            [pdfViewerInstance]="pdfViewer?.pdfViewerInstance()"
            (fail)="onDropFail($event)"
            style="width: 100%; height: 100%;">
            <lj-pdf-viewer
              #pdfViewer
              mode="edit"
              [file]="pdfFile" />
          </div>
        </div>
      </div>
    `,
    props: {
      pdfFile: blankPdf,
      onDropFail: (event: unknown) =>
        console.error('[Story] Drop failed:', event),
    },
  }),
  play: async ({ canvasElement }) => {
    const annotations = Array.from(
      canvasElement.querySelectorAll('lj-draggable-annotation')
    );
    for (const annotation of annotations) {
      await expect(annotation.getAttribute('aria-disabled')).toBe('true');
    }
  },
};
