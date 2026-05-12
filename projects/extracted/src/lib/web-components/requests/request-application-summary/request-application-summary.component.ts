import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { NgTemplateOutlet } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { SummaryComponent } from '../../../dynamic-forms/dynamic-form/components/summary/summary.component';
import type { DynamicForm } from '../../../dynamic-forms/models/dynamic-forms.models';
import type { ExistingFileMetadata } from '../../../models/documents/fileModels';
import {
  AttachmentTypes,
  TaskTypes,
  type ReviewApplicationSignatureAttachmentMetadata,
  type Section,
} from '../../../models/sectionModels';
import type { ClientRequest } from '../../../services/client/requests/client-requests.service';
import { IAMService } from '../../../services/identity/iam.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import {
  getDisplayNameFromProfile,
  getProfileFromRequestUser,
} from '../../../utils/entityUtil';
import {
  isIdentityVerificationTask,
  isReviewApplicationTask,
  sortProcessedSections,
} from '../../../utils/requestUtils/sections';
import { formatEnumValue } from '../../../utils/stringUtil';
import { formatDate, readableDateFromTimestamp } from '../../../utils/timeUtil';
import { LjButton2Component } from '../../button2/button.component';
import { PrintLayoutAdapterComponent } from '../../layout/print-layout-adapter/print-layout-adapter.component';
import {
  RequestSummaryService,
  type GroupedAttachment,
  type ProcessedTask,
} from './request-application-summary.service';
import { RequestUserTypes } from '../../../models/requestModels';

@Component({
  selector: 'lj-request-application-summary',
  imports: [
    ActivateDirective,
    LjButton2Component,
    MatIcon,
    NgTemplateOutlet,
    NgxSkeletonLoaderModule,
    SummaryComponent,
    PrintLayoutAdapterComponent,
  ],
  providers: [RequestSummaryService],
  templateUrl: './request-application-summary.component.html',
  styleUrl: './request-application-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandAndShrink', [
      state(
        'closed',
        style({
          height: '0px',
          opacity: 0,
          overflow: 'hidden',
          transformOrigin: 'top',
          padding: '0 var(--padding-spacious)',
          display: 'none',
        })
      ),
      state(
        'open',
        style({
          height: '*',
          opacity: 1,
          overflow: 'visible',
          transform: 'scaleY(1)',
          transformOrigin: 'top',
          padding: 'var(--padding-comfortable) var(--padding-spacious)',
          display: 'block',
        })
      ),
      transition('closed <=> open', [animate('0.4s ease-in-out')]),
    ]),
  ],
})
export class RequestApplicationSummaryComponent {
  formatDate = readableDateFromTimestamp;
  getSectionStage(section: Section): string {
    return section.step ? formatEnumValue(section.step) : '-';
  }

  private readonly printAdaptor = viewChild(PrintLayoutAdapterComponent);

  /** Enums **/
  readonly AttachmentTypes = AttachmentTypes;
  readonly TaskTypes = TaskTypes;

  /** Dependencies **/
  protected readonly organizationService = inject(OrganizationService);
  private readonly requestSummaryService = inject(RequestSummaryService);
  private readonly iamService = inject(IAMService);
  private readonly appRef = inject(ApplicationRef);

  /** Inputs **/
  readonly isMobile = input(false);
  readonly isClient = input(false);
  readonly request = input.required<ClientRequest>();
  readonly section = input.required<Section>();
  readonly userId = input.required<string>();
  readonly showEditLinks = input<boolean>(true);
  readonly reviewingUser = input<
    | {
        firstName?: string;
        lastName?: string;
        email?: string;
        avatarUri?: string;
      }
    | undefined
  >();

  /** Output **/
  readonly ready = output<boolean>();

  /** UI State **/
  private readonly expandedMap = signal<Record<string, 'open' | 'closed'>>({});
  private readonly hasEmittedReady = signal(false);
  protected readonly exportingPdf = signal(false);
  protected readonly printAdapterActive = signal(false);

  protected firstSectionId: undefined | string = undefined;

  /** Computed properties **/
  readonly data = this.requestSummaryService.data;
  readonly sectionsFilteredByStatusFlowAndUser = computed(() => {
    let sectionsToReturn = [];

    if (!this.isClient()) {
      sectionsToReturn = sortProcessedSections(
        this.requestSummaryService.data().sections
      );
    } else {
      sectionsToReturn = sortProcessedSections(
        this.requestSummaryService.data().sections
      ).filter(section => {
        // Exclude identity verification tasks
        if (isIdentityVerificationTask(section)) {
          return false;
        }

        // Exclude review application tasks
        if (isReviewApplicationTask(section)) {
          return false;
        }

        return true;
      });
    }

    this.firstSectionId = sectionsToReturn.at(0)?.id;

    return sectionsToReturn;
  });

  constructor() {
    // React to input changes and update services
    effect(() => {
      const currentRequest = this.request();
      const currentSection = this.section();

      untracked(() => {
        this.requestSummaryService.updateRequest(currentRequest);
        this.requestSummaryService.updateSection(currentSection);

        // Reset state when inputs change
        this.requestSummaryService.reset();
        this.resetUIState();
      });
    });

    // Fetch data when attachments change
    effect(() => {
      const dynamicFormAttachments =
        this.requestSummaryService.dynamicFormAttachments();
      untracked(() => {
        this.requestSummaryService.fetchDynamicForms(dynamicFormAttachments);
      });
    });

    // Remove automatic file fetching - files will be fetched on demand

    // Emit ready when dynamic forms are fetched (files are loaded on demand)
    // If any input requires fetching different data, we will reset the state
    effect(
      () => {
        const data = this.data();
        const readyEmitted = this.hasEmittedReady();
        if (data.isDynamicFormsFetched && !readyEmitted) {
          // Wait for multiple animation frames to ensure DOM is fully updated
          // This ensures all expansions and content rendering is complete
          requestAnimationFrame(() => {
            this.ready.emit(true);
            this.hasEmittedReady.set(true);
          });
        }
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        this.autoExpandDynamicForms();
      },
      { allowSignalWrites: true }
    );
  }

  /** UI State Management */
  forcePageBreak(section: Section) {
    return section.tasks.some(t =>
      [TaskTypes.REVIEW_APPLICATION].includes(t.taskType)
    );
  }

  private resetUIState(): void {
    this.expandedMap.set({});
    this.hasEmittedReady.set(false);
    this.exportingPdf.set(false);
    this.ready.emit(false);
  }

  private setExpanded(itemId: string, state: 'open' | 'closed'): void {
    this.expandedMap.update(expanded => ({
      ...expanded,
      [itemId]: state,
    }));
  }

  protected getExpandState(attachmentName: string): 'open' | 'closed' {
    return this.expandedMap()[attachmentName] ?? 'closed';
  }

  protected toggleExpandState(attachmentId: string): void {
    const currentState = this.expandedMap()[attachmentId] ?? 'closed';
    const newState = currentState === 'closed' ? 'open' : 'closed';

    this.expandedMap.update(expanded => ({
      ...expanded,
      [attachmentId]: newState,
    }));
  }

  /** Template Helper Methods */
  protected getEditLink(section?: Pick<Section, 'id'> | null): string {
    const request = this.request();
    if (!section || !request) {
      return '';
    }
    return `/requests/${request.id}/sections/${section.id}`;
  }

  protected getTaskTitle(task: ProcessedTask): string {
    const request = this.request();
    return request?.name ?? task.name;
  }

  protected getDocument(
    attachmentId: string
  ): ExistingFileMetadata | undefined {
    return this.requestSummaryService.getDocument(attachmentId);
  }

  protected getDynamicFormDefinition(
    attachmentId: string
  ): DynamicForm | undefined {
    return this.requestSummaryService.getDynamicForm(attachmentId);
  }

  protected getTitleWithStatus(groupAttachment: GroupedAttachment): string {
    if (groupAttachment.type === AttachmentTypes.IDENTITY_VERIFICATION) {
      return `${groupAttachment.name} - ${groupAttachment.attachments[0]?.status}`;
    }

    if (this.isClient()) {
      return groupAttachment.name;
    }

    return `${groupAttachment.name} - ${groupAttachment.attachments[0]?.status}`;
  }

  protected isDocumentLoading(documentId: string): boolean {
    return this.data().loadingDocuments[documentId] ?? false;
  }

  contentToExport = viewChild.required('contentToExport', {
    read: ElementRef<HTMLDivElement>,
  });

  protected async exportToPdf(): Promise<void> {
    if (
      this.organizationService.isFeatureFlagActivated(
        'DOWNLOAD_REVIEW_USING_PRINT'
      )
    ) {
      this.exportingPdf.set(true);
      this.autoExpandDynamicForms();

      this.printAdapterActive.set(true);
      this.appRef.tick();

      const adapter = this.printAdaptor();
      if (adapter) {
        const printContent = this.contentToExport()
          .nativeElement as HTMLElement;
        await adapter.print(printContent);
      }

      this.printAdapterActive.set(false);
      this.exportingPdf.set(false);
      return;
    }

    const request = this.request();

    if (!request) {
      return;
    }

    // Expand all DF before printing
    this.autoExpandDynamicForms();

    // Set exporting state early so copy buttons are hidden before canvas capture
    this.exportingPdf.set(true);

    // Wait for UI to update to see all the expanded content and hide copy buttons
    await new Promise(resolve => setTimeout(resolve, 500));

    const reviewingUser = this.reviewingUser();
    const activeUser = this.iamService.getActiveUser();

    let logoImg: { base64: string; width: number; height: number } | undefined;
    const tenantLogo = this.organizationService.getLogo(true);
    if (tenantLogo) {
      try {
        logoImg = await this.convertImageToBase64(tenantLogo);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load tenant logo for PDF:', error);
        logoImg = undefined;
      }
    }

    const tenantName = this.organizationService.getTenantName();

    html2canvas(this.contentToExport().nativeElement)
      .then(canvas => {
        const pdf = new jsPDF('p', 'mm', 'letter');
        const margin = 10; // 10px margin on all sides
        const imgWidth = 216 - margin * 2; // 2 for left and right margins
        const pageHeight = 279 - margin * 5; // 2 for top and bottom margins, 1 for footer, 2 for logo
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        // Calculate the number of pages
        const totalPages = Math.ceil(imgHeight / pageHeight);

        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          if (pageNum > 0) {
            pdf.addPage();
          }

          const drawHeight = pageHeight;

          // Calculate the vertical offset for the image slice
          const srcY = pageNum * pageHeight * (canvas.height / imgHeight);
          const srcHeight = drawHeight * (canvas.height / imgHeight);
          // Create a temporary canvas for each page slice
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = srcHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              srcY,
              canvas.width,
              srcHeight,
              0,
              0,
              canvas.width,
              srcHeight
            );
            const pageImgData = pageCanvas.toDataURL('image/png');
            // Draw logo at top left (if available) and add a background color
            if (logoImg) {
              pdf.setFillColor(
                this.organizationService.uiConfiguration.colors.primary.color
              ); // Set background color using primary color
              pdf.rect(
                margin,
                margin - 5,
                logoImg.width / 4 + margin,
                logoImg.height / 4 + margin - 5,
                'F'
              );

              pdf.addImage(
                logoImg.base64,
                'PNG',
                margin * 1.5,
                (margin - 5) * 1.5,
                logoImg.width / 4,
                logoImg.height / 4
              );
            }

            // Calculate text space needed
            pdf.setFontSize(12);
            const tenantText = `${tenantName}`;

            pdf.setFontSize(16);
            const titleText = request.name || 'Application Summary';
            const titleLineHeight = pdf.getLineHeight();

            pdf.setFontSize(12);
            const applicantText =
              reviewingUser?.firstName && reviewingUser?.lastName
                ? `Applicant: ${reviewingUser.firstName} ${reviewingUser.lastName}`
                : '';
            const applicantLineHeight = pdf.getLineHeight();

            // Calculate total text height
            const textStartY = margin + 3; // Tenant name starts here
            const textEndY = applicantText
              ? margin + 16 + applicantLineHeight // Applicant ends here
              : margin + 10 + titleLineHeight; // Title ends here if no applicant
            const textHeight = textEndY - textStartY;

            // Calculate logo height
            const logoHeight =
              logoImg && typeof logoImg.height === 'number'
                ? logoImg.height / 4
                : 0;

            // Use the larger of text height or logo height for content positioning
            const headerHeight = Math.max(textHeight, logoHeight);

            // Draw tenant name at the top right
            pdf.setFontSize(12);
            pdf.setTextColor('#333333');
            const tenantWidth = pdf.getTextWidth(tenantText);
            pdf.text(tenantText, 216 - margin - tenantWidth, margin + 3);

            // Draw request name under the tenant name
            pdf.setFontSize(16);
            const titleWidth = pdf.getTextWidth(titleText);
            pdf.text(titleText, 216 - margin - titleWidth, margin + 10);

            // Draw Applicant name below title if available
            if (reviewingUser?.firstName && reviewingUser?.lastName) {
              pdf.setFontSize(12);
              const applicantWidth = pdf.getTextWidth(applicantText);
              pdf.text(
                applicantText,
                216 - margin - applicantWidth,
                margin + 16
              );
            }

            // Draw main page content - use headerHeight instead of logo height
            pdf.addImage(
              pageImgData,
              'PNG',
              margin,
              2 * margin + headerHeight, // leave space for header (text or logo, whichever is larger)
              imgWidth,
              drawHeight - headerHeight // reduce height for header space
            );

            // Draw page number at bottom right
            pdf.setFontSize(8);

            const pageNumberText = `Page ${pageNum + 1} / ${totalPages}`;
            const pageNumberWidth = pdf.getTextWidth(pageNumberText);
            pdf.text(
              pageNumberText,
              216 - margin - pageNumberWidth,
              279 - margin
            );

            // Draw generated by info at bottom left (if available)
            if (activeUser?.firstName && activeUser?.lastName) {
              const generatedByText = `Generated by: ${activeUser.firstName} ${activeUser.lastName}`;
              pdf.text(generatedByText, margin, 279 - margin);
            }

            // Draw created on date at bottom center
            const createdOn = formatDate(new Date(), 'short');
            const textWidth = pdf.getTextWidth(`Created on: ${createdOn}`);
            pdf.text(
              `Created on: ${createdOn}`,
              108 - textWidth / 2,
              279 - margin
            );
          }
        }

        // Download PDF using the new filename generator
        const fileName = this.generateApplicationSummaryFileName(
          request.name || 'application-summary',
          request.status
        );

        pdf.save(fileName);

        this.exportingPdf.set(false);
      })
      .catch(error => {
        console.error('PDF export failed:', error);
        this.exportingPdf.set(false);
      });
  }

  private autoExpandDynamicForms() {
    const data = this.data();

    if (data.isDynamicFormsFetched) {
      Object.keys(data.dynamicForms).forEach(formId => {
        this.setExpanded(formId, 'open');
      });
    }
  }

  /**
   * Generate filename for Application Summary PDF
   */
  private generateApplicationSummaryFileName(
    requestName: string,
    stage?: string
  ): string {
    const safeName = requestName.replace(/[^a-zA-Z0-9]/g, '-');
    const safeStage = stage ? stage.replace(/[^a-zA-Z0-9]/g, '-') : '';

    return this.generateSafeFileName(safeName, safeStage);
  }

  /**
   * Generate safe filename for PDF
   */
  private generateSafeFileName(
    baseName: string,
    suffix?: string,
    includeDate = true
  ): string {
    const date = includeDate ? new Date().toISOString().split('T')[0] : '';
    const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '-');
    const safeSuffix = suffix ? suffix.replace(/[^a-zA-Z0-9]/g, '-') : '';

    const parts = [date, safeName, safeSuffix].filter(Boolean);
    return `${parts.join('_')}.pdf`;
  }

  /**
   * Convert image URL to base64 for PDF embedding
   */
  private async convertImageToBase64(imageUrl: string): Promise<{
    base64: string;
    width: number;
    height: number;
  }> {
    if (!imageUrl) {
      return Promise.reject('No image URL provided');
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const base64 = canvas.toDataURL('image/png');
          resolve({
            base64,
            width: img.width,
            height: img.height,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };

      // Handle relative URLs
      if (imageUrl.startsWith('/assets/')) {
        img.src = window.location.origin + imageUrl;
      } else {
        img.src = imageUrl;
      }
    });
  }

  getUserName(userId: string | undefined): string {
    if (!userId) {
      return 'Unknown User';
    }

    const users = this.data().users;

    // 1. Direct match by userId
    let user = users.find(u => u.userId === userId);

    // 2. Match by representative or user if not found and type is not individual
    if (!user) {
      user = users.find(
        u =>
          u.userType !== RequestUserTypes.INDIVIDUAL && u.representatives?.includes(userId)
      );
    }

    if (user) {
      const profile = getProfileFromRequestUser(user);

      return getDisplayNameFromProfile(profile);
    }

    return 'Unknown User';
  }

  getSignatureAttachment(
    task: ProcessedTask
  ): ReviewApplicationSignatureAttachmentMetadata | null {
    const attachment = task.attachments.find(
      a => a.type === AttachmentTypes.REVIEW_APPLICATION_SIGNATURE
    );
    return (
      (attachment?.metadata as ReviewApplicationSignatureAttachmentMetadata) ??
      null
    );
  }
}
