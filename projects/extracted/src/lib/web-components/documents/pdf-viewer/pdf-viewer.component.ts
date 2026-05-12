import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  AnnotationsUnion,
  Comment,
  Instance,
  MentionableUser,
  ToolbarItem,
} from '@nutrient-sdk/viewer';
import { debounceTime, finalize, lastValueFrom, Subject } from 'rxjs';
import {
  FileMetadata,
  type ExistingFileMetadata,
} from '../../../models/documents/fileModels';
import { DocumentService } from '../../../services/documents/document.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { InstantJSONSchema } from '../../../types/pspdf';
import { migrateV1Annotation } from '../../pdf/field-framework/migration/v1-to-v2';
import type { SignatureInstantJSON } from '../../pdf/field-framework/types/instant-json';
import { PDF_VIEWER_LOCALES, setupLocales } from './pdf-viewer.locales';
import { PdfViewerService, type PdfDocumentSource } from './pdf-viewer.service';
import { loadPSPDFKit } from './pspdfkit-loader';
import {
  ANNOTATION_TOOLS,
  BASIC_TOOLBAR,
  EDITION_TOOLBAR,
  MOBILE_BASIC_TOOLBAR,
  PREVIEW_ONLY_TOOLBAR,
} from './toolbarItems';

export type PdfViewerMode = 'minimum' | 'preview' | 'view' | 'edit';

@Component({
  selector: 'lj-pdf-viewer',
  imports: [],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'pdfViewer',
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  private service = inject(PdfViewerService);
  private documentService = inject(DocumentService);
  private uiNotificationService = inject(UiNotificationService);
  private organizationService = inject(OrganizationService);
  mode = input<PdfViewerMode>('preview');
  file = input<PdfDocumentSource>(undefined);
  fileName = input<string>('');
  fileMetadata = input<
    Partial<FileMetadata | ExistingFileMetadata> | undefined | null
  >(undefined);
  mentionableUsers = input<Array<MentionableUser>>([]);
  documentMetadata = input<InstantJSONSchema>({});
  showAnnotationTools = input<boolean>(false);
  mobile = input<boolean>(false);
  customCss = input<string | undefined>(undefined);

  readonly documentChange = output<ArrayBuffer>();
  readonly documentMetadataChange = output<InstantJSONSchema>();
  readonly fileUpload = output<boolean>();
  readonly signaturesChange = output<unknown>();
  readonly onDocumentDownloaded = output<void>();
  readonly fileLoaded = output<{
    source: PdfDocumentSource;
    buffer: ArrayBuffer;
  }>();
  readonly fileUnloaded = output<PdfDocumentSource>();

  // INTERNAL STATE
  readonly fileTimestamp = signal<number>(Date.now());
  readonly pdfContainer = viewChild.required<ElementRef>('container');
  readonly pdfViewerInstance = signal<Instance | null>(null);
  readonly pdfViewerLoading = signal<boolean>(false);

  private readonly toolbarItems = signal<ToolbarItem[]>([]);
  readonly previousFile = signal<PdfDocumentSource>(undefined);
  // It's derived from the `file` input and represents the *processed* document data.
  private readonly documentContent = signal<ArrayBuffer | undefined>(undefined);
  private readonly previousContent = signal<ArrayBuffer | undefined>(undefined);

  private readonly debounceTimeId = signal<number>(0);
  private readonly metadataChangedSubject = new Subject<InstantJSONSchema>();
  private readonly METADATA_DEBOUNCE_TIME_MS = 1000;
  private readonly VIEW_UPDATE_DEBOUNCE_TIME_MS = 100;

  // Cached PSPDFKit module after lazy loading
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pspdfkitModule: any = null;

  destroyed = signal(false);

  constructor() {
    // Download the file and save it internally as an ArrayBuffer
    // so we do not download it multiple times.
    effect(
      () => {
        const currentFile = this.file();

        if (currentFile === undefined) {
          this.documentContent.set(undefined);
          this.pdfViewerLoading.set(false);
          return;
        }
        this.pdfViewerLoading.set(true);
        this.service
          .processFileSource(currentFile)
          .pipe(
            finalize(() => {
              this.pdfViewerLoading.set(false);
            })
          )
          .subscribe({
            next: buffer => {
              this.pdfViewerLoading.set(false);
              if (buffer) {
                this.documentContent.set(buffer);
                this.fileTimestamp.set(Date.now());
                this.fileLoaded.emit({
                  source: currentFile,
                  buffer,
                });
                this.previousFile.set(currentFile);
              }
            },
            error: err => {
              this.pdfViewerLoading.set(false);
              console.error('Error processing/fetching file:', err);
              this.uiNotificationService.showSnackbar(
                'Failed to load document.',
                'red'
              );
            },
          });
      },
      {
        allowSignalWrites: true,
      }
    );

    // Setup toolbar items based on mode and mobile state
    effect(
      () => {
        this.mode();
        this.mobile();
        this.configureToolbar();
        const viewerInstance = this.pdfViewerInstance();
        if (viewerInstance) {
          viewerInstance.setToolbarItems(this.toolbarItems());
          // Change the `mediaQueries` for the zoom items
          // so that they're always shown on any device.
          viewerInstance.setToolbarItems(items =>
            items.map(item => {
              if (
                item.type === 'zoom-in' ||
                item.type === 'zoom-out' ||
                item.type === 'zoom-mode'
              ) {
                item.mediaQueries = ['all'];
              }
              return item;
            })
          );
        }
      },
      {
        allowSignalWrites: true,
      }
    );

    // Load or reload the PSPDFKit instance when document content changes
    effect(
      () => {
        const documentMetadata = this.documentMetadata();
        const documentContent = this.documentContent();

        if (
          documentContent?.byteLength &&
          documentMetadata &&
          documentContent !== this.previousContent()
        ) {
          this.previousContent.set(documentContent);
          this.loadPdfViewer();
        }
      },
      {
        allowSignalWrites: true,
      }
    );
  }

  ngOnInit() {
    this.configureToolbar();
    this.metadataChangedSubject
      .pipe(debounceTime(this.METADATA_DEBOUNCE_TIME_MS))
      .subscribe(metadata => {
        if (!this.pdfViewerLoading()) {
          this.documentMetadataChange.emit(metadata);
        }
      });
  }

  ngOnDestroy() {
    const container = this.pdfContainer().nativeElement;
    this.cleanup(container);
    this.destroyed.set(true);
  }

  reload(options?: { pageIndex?: number }): Promise<Instance | null> {
    return this.loadPdfViewer(options);
  }

  /**
   * Normalize widget annotations from v1 customData to v2 before handing the
   * blob to PSPDFKit. Idempotent (already-v2 entries pass through). Non-widget
   * annotations are returned as-is.
   */
  private getMigratedAnnotations(): unknown[] {
    const raw = this.documentMetadata().annotations ?? [];
    return (raw as unknown[]).map(ann => {
      const a = ann as { type?: string };
      return a?.type === 'pspdfkit/widget'
        ? migrateV1Annotation(
            ann as SignatureInstantJSON['annotations'][number]
          )
        : ann;
    });
  }

  private unloadPdfViewer() {
    const container = this.pdfContainer().nativeElement;
    if (!container) return;

    // If the container is not empty, we need to clean it up
    if (container.firstChild) {
      this.cleanup(container);
      this.pdfViewerInstance.set(null);
      this.fileUnloaded.emit(this.previousFile());
    }
  }

  private async loadPdfViewer(options?: {
    pageIndex?: number;
  }): Promise<Instance> {
    const documentContent = this.documentContent();
    const documentMetadata = this.documentMetadata();

    if (!documentMetadata || !documentContent?.byteLength) {
      return Promise.reject('No data available to load PDF viewer');
    }

    this.pdfViewerLoading.set(true);

    const baseUrl = location.protocol + '//' + location.host + '/assets/';
    const container = this.pdfContainer().nativeElement;

    if (!document || !container) {
      return Promise.reject('No document or container available');
    }

    this.unloadPdfViewer();
    let instance: Instance | null = null;

    await setupLocales();

    try {
      const licenseKey = this.service.licenseKey();
      const customCss = this.customCss();
      const trustedCAsCallback = async () => {
        try {
          const res = await lastValueFrom(
            this.documentService.getSignatureCertificates()
          );
          return res.caCertificates.map(cert => atob(cert));
        } catch (err) {
          console.error('Failed to load trusted CA certificates', err);
          throw err;
        }
      };

      // Lazy load PSPDFKit to keep it out of the main bundle
      const PSPDFKit = await loadPSPDFKit();
      this.pspdfkitModule = PSPDFKit;

      instance = await PSPDFKit.load({
        baseUrl,
        container,
        document: documentContent.slice(0),
        disableWebAssemblyStreaming: true,
        enableClipboardActions: true,
        enableHistory: true,
        licenseKey,
        locale: PDF_VIEWER_LOCALES.BASE,
        toolbarItems: this.toolbarItems(),
        styleSheets: customCss ? [customCss] : [],
        trustedCAsCallback,
        initialViewState: new PSPDFKit.ViewState({
          layoutMode: PSPDFKit.LayoutMode.SINGLE,
          zoom: PSPDFKit.ZoomMode.FIT_TO_WIDTH,
          currentPageIndex: options?.pageIndex ?? 0,
        }),
        instantJSON: {
          format: 'https://pspdfkit.com/instant-json/v1',
          // eslint-disable-next-line
          attachments: documentMetadata.attachments as any,
          // eslint-disable-next-line
          annotations: this.getMigratedAnnotations() as any,
          // eslint-disable-next-line
          formFields: documentMetadata.formFields as any,
          // eslint-disable-next-line
          formFieldValues: documentMetadata.formFieldValues as any,
          // eslint-disable-next-line
          bookmarks: documentMetadata.bookmarks as any,
          // eslint-disable-next-line
          comments: documentMetadata.comments as any,
        },
      });
      this.pdfViewerInstance.set(instance);
      return instance;
    } catch (error) {
      console.error('Error loading PSPDFKit instance:', error);
      this.pdfViewerLoading.set(false);
      return Promise.reject('Failed to load PSPDFKit instance');
      // This will most likely always throw an error if we switch to another document before one is fully initialized
    } finally {
      try {
        const pdfViewerInstance = this.pdfViewerInstance();
        if (pdfViewerInstance) {
          if (this.file() !== this.previousFile()) {
            this.fileLoaded.emit({
              source: this.file(),
              buffer: documentContent.slice(0),
            });
            this.previousFile.set(this.file());
          }

          this.setCreatorName(pdfViewerInstance);
          this.setIsEditable(pdfViewerInstance);
          this.setMentionableUsers(pdfViewerInstance, this.mentionableUsers());
          this.addEventListeners(pdfViewerInstance);

          setTimeout(() => {
            this.pdfViewerLoading.set(false);
          }, this.VIEW_UPDATE_DEBOUNCE_TIME_MS);
        }
      } catch {
        // Nothing to do
      }
    }
  }

  private configureToolbar() {
    const downloadAsPdfButton: ToolbarItem = {
      type: 'custom',
      id: 'download-pdf',
      icon: '/assets/icons/picture-as-pdf.svg',
      title: 'Download PDF',
      onPress: () => {
        this.downloadPdf();
      },
    };

    const downloadOriginalButton: ToolbarItem = {
      type: 'custom',
      id: 'download-original',
      icon: '/assets/icons/file-save.svg',
      title: 'Download Original',
      onPress: () => {
        this.downloadOriginal();
      },
    };

    const analyzeInExcelButton: ToolbarItem = {
      type: 'custom',
      id: 'analyze-in-excel',
      icon: '/assets/icons/excel.svg',
      title: 'Analyze in Excel',
      onPress: () => {
        this.demoExportToExcel();
      },
    };

    switch (this.mode()) {
      case 'minimum': {
        const toolbarItems = [downloadAsPdfButton];

        if (this.fileHasMetadataAndHasOriginal()) {
          toolbarItems.push(downloadOriginalButton);
        }

        this.toolbarItems.set(toolbarItems);
        break;
      }
      case 'preview': {
        const toolbarItems = [...PREVIEW_ONLY_TOOLBAR, downloadAsPdfButton];

        if (this.fileHasMetadataAndHasOriginal()) {
          toolbarItems.push(downloadOriginalButton);
        }
        this.toolbarItems.set(toolbarItems);
        break;
      }
      case 'view': {
        const baseToolbar: ToolbarItem[] = this.mobile()
          ? MOBILE_BASIC_TOOLBAR
          : BASIC_TOOLBAR;

        const annotationTools: ToolbarItem[] = this.showAnnotationTools()
          ? ANNOTATION_TOOLS
          : [];
        const extraItems: ToolbarItem[] = [downloadAsPdfButton];

        if (this.fileHasMetadataAndHasOriginal()) {
          extraItems.push(downloadOriginalButton);
        }

        if (
          this.organizationService.isFeatureFlagActivated('DEMO_MODE') &&
          this.demoShowDownloadToExcelButton()
        ) {
          extraItems.push(analyzeInExcelButton);
        }

        if (
          this.organizationService.isFeatureFlagActivated('DEMO_MODE') &&
          this.demoShowDownloadToExcelButton()
        ) {
          extraItems.push(analyzeInExcelButton);
        }

        this.toolbarItems.set([
          ...baseToolbar,
          ...annotationTools,
          ...extraItems,
        ]);

        break;
      }
      case 'edit': {
        const extraItems: ToolbarItem[] = [
          {
            type: 'custom',
            id: 'upload-pdf',
            icon: '/assets/icons/upload.svg',
            title: 'Upload',
            onPress: () => {
              this.fileUpload.emit(true);
            },
          },
          downloadAsPdfButton,
        ];

        if (this.fileHasMetadataAndHasOriginal()) {
          extraItems.push(downloadOriginalButton);
        }

        this.toolbarItems.set([...EDITION_TOOLBAR, ...extraItems]);
        break;
      }
    }
  }

  private processFile(file: string | File): Promise<string | ArrayBuffer> {
    if (typeof file === 'string') {
      return Promise.resolve(file ?? '');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = function () {
        return resolve(reader.result ?? '');
      };
      reader.onerror = function (error) {
        console.error('Error: ', error);
        return reject(reader.result ?? '');
      };
    });
  }

  private isEditableAnnotation(annotation: AnnotationsUnion) {
    const userEmail = this.service.getUserEmail();
    const PSPDFKit = this.pspdfkitModule;
    if (!PSPDFKit) return true; // Fallback if not loaded yet
    return (
      !(annotation instanceof PSPDFKit.Annotations.CommentMarkerAnnotation) ||
      annotation.creatorName === userEmail
    );
  }

  private isEditableComment(comment: Comment) {
    return (
      comment.creatorName === this.service.getUserEmail() ||
      comment.pageIndex === null
    );
  }

  private setIsEditable(instance: Instance) {
    if (this.mode() === 'edit') {
      return;
    }

    instance.setAnnotationCreatorName(this.service.getUserEmail());
    instance.setIsEditableAnnotation(annotation => {
      return this.isEditableAnnotation(annotation);
    });
    instance.setIsEditableComment(comment => {
      return this.isEditableComment(comment);
    });
  }

  private emitDocumentChange() {
    const viewerInstance = this.pdfViewerInstance();
    const viewerLoading = this.pdfViewerLoading();

    if ((!this.fileLoaded && viewerLoading) || !viewerInstance) {
      return;
    }

    viewerInstance.exportPDF().then(value => this.documentChange.emit(value));
  }

  private async handleSignatures() {
    const PSPDFKit = this.pspdfkitModule;
    if (!PSPDFKit) return;

    const formFields = await this.pdfViewerInstance()?.getFormFields();

    if (formFields) {
      const signatureFields = formFields.filter(
        field => field instanceof PSPDFKit.FormFields.SignatureFormField
      );

      for (const field of signatureFields) {
        const overlappingAnnotations =
          (await this.pdfViewerInstance()?.getOverlappingAnnotations(field)) ??
          [];

        const signatureJsons = overlappingAnnotations.map(annotation =>
          annotation.toJSON()
        );
        this.signaturesChange.emit(signatureJsons);
      }
    }
  }

  private emitDocumentMetadataChange() {
    if (this.pdfViewerLoading() || !this.pdfViewerInstance()) {
      return;
    }

    this.pdfViewerLoading.set(true);

    this.pdfViewerInstance()
      ?.save()
      .then(_ => {
        if (!this.pdfViewerInstance()) {
          return;
        }

        this.pdfViewerInstance()
          ?.exportInstantJSON()
          // @ts-expect-error PSPdf Schema is a mess.
          .then((value: InstantJSONSchema) => {
            this.metadataChangedSubject.next({
              annotations: value.annotations,
              comments: value.comments,
              attachments: value.attachments,
              bookmarks: value.bookmarks,
              formFields: value.formFields,
              formFieldValues: value.formFieldValues,
            });

            this.handleSignatures();
          })
          .catch((error: unknown) => {
            console.error(error);
          })
          .finally(() => {
            this.pdfViewerLoading.set(false);
          });
      });
  }

  private addEventListeners(instance: Instance) {
    instance.addEventListener('document.change', () => {
      this.emitDocumentChange();
    });
    instance.addEventListener('annotations.change', () =>
      this.emitDocumentMetadataChange()
    );
    instance.addEventListener('comments.change', () =>
      this.emitDocumentMetadataChange()
    );
    instance.addEventListener('formFields.change', () =>
      this.emitDocumentMetadataChange()
    );
    instance.addEventListener('inkSignatures.change', () =>
      this.emitDocumentMetadataChange()
    );
    instance.addEventListener('storedSignatures.change', () =>
      this.emitDocumentMetadataChange()
    );
  }

  private setMentionableUsers(
    instance: Instance,
    mentionableUsers: MentionableUser[]
  ) {
    instance.setMentionableUsers(mentionableUsers);
  }

  private setCreatorName(instance: Instance) {
    instance.setAnnotationCreatorName(this.service.getUserEmail());
  }

  private fileHasMetadataAndHasPdf(): boolean {
    const castedMetadata = this.fileMetadata();
    return Boolean(
      castedMetadata?.pdfGenerated ||
      castedMetadata?.originalName?.toLowerCase().includes('.pdf')
    );
  }

  private fileHasMetadataAndHasOriginal(): boolean {
    const castedMetadata = this.fileMetadata();
    return Boolean(castedMetadata?.originalUrl);
  }

  downloadOriginal() {
    const castedMetadata = this.fileMetadata();
    if (castedMetadata?.originalUrl) {
      this.downloadFromUrl(castedMetadata.originalUrl);
      this.onDocumentDownloaded.emit();
    }
  }

  downloadPdf() {
    const viewerInstance = this.pdfViewerInstance();
    if (!viewerInstance) {
      return;
    }

    let objectUrl: string | undefined = undefined;

    if (this.fileMetadata() && this.fileHasMetadataAndHasPdf()) {
      const castedMetadata = this.fileMetadata() as FileMetadata;

      if (castedMetadata.pdfGenerated && castedMetadata.pdfUrl) {
        objectUrl = castedMetadata.pdfUrl;
      } else {
        objectUrl = castedMetadata.originalName?.toLowerCase().endsWith('.pdf')
          ? castedMetadata.originalUrl
          : undefined;
      }
    } else {
      viewerInstance.exportPDF().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/pdf' });
        objectUrl = window.URL.createObjectURL(blob);
      });
    }

    if (objectUrl) {
      this.downloadFromUrl(objectUrl);
      this.onDocumentDownloaded.emit();
    }
  }

  async downloadFromUrl(url: string) {
    let fileName = this.fileName() || url.split('/').pop() || 'document.pdf';

    if (!fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }

    try {
      // We fetch the file as a blob to enforce the filename
      // Chrome and some browsers was inconsistent with the `a.download` attribute when using the url to download directly.
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.style.display = 'none';
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      this.uiNotificationService.showSnackbar(
        'Failed to download document.',
        'red'
      );
    }
  }

  private cleanup(container: string | HTMLElement | Instance | null) {
    const PSPDFKit = this.pspdfkitModule;
    if (!PSPDFKit) return;
    return PSPDFKit.unload(container);
  }

  // DEMO FUNCTIONS

  demoShowDownloadToExcelButton(): boolean {
    return this.demoIsBalanceSheet() || this.demoIs1040();
  }

  demoFileName(): string {
    const metadataFileName =
      // @ts-expect-error demo purposes
      this.fileMetadata?.fileMetadata?.originalName ?? '';
    const filename = this.fileName()
      .toLowerCase()
      .concat(metadataFileName.toLowerCase());

    return filename;
  }

  demoIs1040(): boolean {
    const filename = this.demoFileName();
    return filename.includes('1040');
  }

  demoIsBalanceSheet(): boolean {
    const filename = this.demoFileName();
    return (
      filename.includes('personal') &&
      filename.includes('balance') &&
      filename.includes('balance')
    );
  }

  demoExportToExcel() {
    if (this.demoIsBalanceSheet()) {
      return this.downloadFromUrl(
        '/assets/demo-documents/personal-balance-sheet.xlsx'
      );
    }

    if (this.demoIs1040()) {
      return this.downloadFromUrl('/assets/demo-documents/1040-analysis.xlsx');
    }

    return Promise.reject('No document or container available');
  }
}
