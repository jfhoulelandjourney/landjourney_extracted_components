import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, tap } from 'rxjs';

import { groupBy } from 'es-toolkit';

import type { DynamicForm } from '../../../dynamic-forms/models/dynamic-forms.models';
import type { ExistingFileMetadata } from '../../../models/documents/fileModels';
import { RequestModes } from '../../../models/requestModels';
import {
  AttachmentTypes,
  type Attachment,
  type Section,
  type Task,
} from '../../../models/sectionModels';
import type { ClientRequest } from '../../../services/client/requests/client-requests.service';
import { DocumentService } from '../../../services/documents/document.service';
import { DynamicFormService } from '../../../services/documents/dynamic-form.service';

export interface FetchableAttachment extends Attachment {
  readonly documentId: string;
  readonly digest: string;
}

export type ProcessedTask = Task & {
  readonly id?: string;
  readonly name: string;
  readonly attachments: Attachment[];
  readonly groupedAttachments: GroupedAttachment[];
};

export type ProcessedSection = Section & {
  readonly id?: string;
  readonly name: string;
  readonly assigneeId?: string;
  readonly tasks: ProcessedTask[];
};

export interface GroupedAttachment {
  readonly name: string;
  readonly type: AttachmentTypes;
  readonly attachments: Attachment[];
}

export interface RequestSummaryData {
  readonly sections: ProcessedSection[];
  readonly documents: Record<string, ExistingFileMetadata>;
  readonly dynamicForms: Record<string, DynamicForm>;
  readonly isDocumentsFetched: boolean;
  readonly isDynamicFormsFetched: boolean;
  readonly isReady: boolean;
  readonly loadingDocuments: Record<string, boolean>;
  readonly mode: RequestModes;
  readonly users: ClientRequest['users'];
}

@Injectable()
export class RequestSummaryService {
  /** Dependencies **/
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentService = inject(DocumentService);
  private readonly dynamicFormService = inject(DynamicFormService);

  /** Input signals */
  private readonly request = signal<ClientRequest | null>(null);
  private readonly section = signal<Section | null>(null);

  /** Data storage signals */
  private readonly documentsMap = signal<Record<string, ExistingFileMetadata>>(
    {}
  );
  private readonly dynamicFormsMap = signal<Record<string, DynamicForm>>({});
  private readonly isDocumentsFetched = signal(false);
  private readonly isDynamicFormsFetched = signal(false);
  private readonly loadingDocuments = signal<Record<string, boolean>>({});

  /** Computed */
  readonly filteredSections = computed<ProcessedSection[]>(() => {
    const currentRequest = this.request();
    const currentSection = this.section();

    if (!currentRequest?.sections || !currentSection) {
      return [];
    }

    return currentRequest.sections
      .filter(section => {
        if (section.assigneeId !== currentSection.assigneeId) {
          return false;
        }

        // Filter by stage - only show sections for the same stage as the application review
        if (section.step !== currentSection.step) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by ordering property (ascending order)
        // Sections without ordering value will be placed at the end
        const orderingA = a.ordering ?? Number.MAX_SAFE_INTEGER;
        const orderingB = b.ordering ?? Number.MAX_SAFE_INTEGER;
        return orderingA - orderingB;
      })
      .map(section => this.processSection(section));
  });

  readonly dynamicFormAttachments = computed<FetchableAttachment[]>(() =>
    this.filteredSections()
      .flatMap(section => section.tasks)
      .flatMap(task => task.attachments)
      .filter(
        attachment =>
          attachment.type === AttachmentTypes.DYNAMIC_FORM &&
          attachment.documentId &&
          attachment.digest
      )
      .map(attachment => ({
        ...attachment,
        documentId: attachment.documentId as string,
        digest: attachment.digest as string,
      }))
  );

  readonly fileAttachments = computed<FetchableAttachment[]>(() =>
    this.filteredSections()
      .flatMap(section => section.tasks)
      .flatMap(task => task.attachments)
      .filter(
        attachment =>
          [AttachmentTypes.FILE, AttachmentTypes.SIGNATURE].includes(
            attachment.type
          ) &&
          attachment.documentId &&
          attachment.digest
      )
      .map(attachment => ({
        ...attachment,
        documentId: attachment.documentId as string,
        digest: attachment.digest as string,
      }))
  );

  // Unify data interface for consumption
  readonly data = computed<RequestSummaryData>(() => ({
    sections: this.filteredSections(),
    documents: this.documentsMap(),
    dynamicForms: this.dynamicFormsMap(),
    isDocumentsFetched: this.isDocumentsFetched(),
    isDynamicFormsFetched: this.isDynamicFormsFetched(),
    isReady: this.isDocumentsFetched() && this.isDynamicFormsFetched(),
    loadingDocuments: this.loadingDocuments(),
    mode: this.request()?.mode ?? RequestModes.SIMPLE,
    users: this.request()?.users ?? [],
  }));

  /** Public API */
  updateRequest(request: ClientRequest): void {
    this.request.set(request);
  }

  updateSection(section: Section): void {
    this.section.set(section);
  }

  fetchDocuments(attachments: readonly FetchableAttachment[]): void {
    const fileAttachments = attachments.filter(attachment =>
      [AttachmentTypes.FILE, AttachmentTypes.SIGNATURE].includes(
        attachment.type
      )
    );

    if (fileAttachments.length === 0) {
      this.isDocumentsFetched.set(true);
      return;
    }

    const missingDocuments = fileAttachments.filter(
      attachment => !this.documentsMap()[attachment.documentId]
    );

    if (missingDocuments.length === 0) {
      this.isDocumentsFetched.set(true);
      return;
    }

    this.isDocumentsFetched.set(false);

    const requests = missingDocuments.map(attachment =>
      this.documentService
        .getFileMetadata(attachment.documentId, attachment.digest)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(error => {
            console.error(
              `Failed to fetch document metadata for ${attachment.name}:`,
              error
            );
            return of(null);
          })
        )
    );

    forkJoin(requests)
      .pipe(
        tap(results => {
          const documentsToUpdate: Record<string, ExistingFileMetadata> = {};
          results.forEach(document => {
            if (document?.id) {
              documentsToUpdate[document.id] = document;
            }
          });

          if (Object.keys(documentsToUpdate).length > 0) {
            this.documentsMap.update(docs => ({
              ...docs,
              ...documentsToUpdate,
            }));
          }
        })
      )
      .subscribe({
        complete: () => this.isDocumentsFetched.set(true),
      });
  }

  fetchDocument(attachment: FetchableAttachment): void {
    // Check if already cached
    if (this.documentsMap()[attachment.documentId]) {
      return;
    }

    // Check if already loading
    if (this.loadingDocuments()[attachment.documentId]) {
      return;
    }

    // Set loading state
    this.loadingDocuments.update(loading => ({
      ...loading,
      [attachment.documentId]: true,
    }));

    this.documentService
      .getFileMetadata(attachment.documentId, attachment.digest)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          console.error(
            `Failed to fetch document metadata for ${attachment.name}:`,
            error
          );
          return of(null);
        })
      )
      .subscribe({
        next: document => {
          if (document?.id) {
            this.documentsMap.update(docs => ({
              ...docs,
              [document.id]: document,
            }));
          }
        },
        complete: () => {
          // Clear loading state
          this.loadingDocuments.update(loading => {
            const updated = { ...loading };
            delete updated[attachment.documentId];
            return updated;
          });
        },
      });
  }

  fetchDynamicForms(attachments: readonly FetchableAttachment[]): void {
    const formAttachments = attachments.filter(
      attachment => attachment.type === AttachmentTypes.DYNAMIC_FORM
    );

    if (formAttachments.length === 0) {
      this.isDynamicFormsFetched.set(true);
      return;
    }

    const missingForms = formAttachments.filter(
      attachment => !this.dynamicFormsMap()[attachment.id ?? '']
    );

    if (missingForms.length === 0) {
      this.isDynamicFormsFetched.set(true);
      return;
    }

    this.isDynamicFormsFetched.set(false);

    const requests = missingForms.map(attachment =>
      this.dynamicFormService
        .getDynamicForm(attachment.documentId, attachment.digest)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(error => {
            console.error(
              `Failed to fetch dynamic form for ${attachment.name}:`,
              error
            );
            return of(null);
          })
        )
    );

    forkJoin(requests)
      .pipe(
        tap(results => {
          const formsToUpdate: Record<string, DynamicForm> = {};
          missingForms.forEach((attachment, index) => {
            const form = results[index];
            if (form && attachment.id) {
              formsToUpdate[attachment.id] = form;
            }
          });

          if (Object.keys(formsToUpdate).length > 0) {
            this.dynamicFormsMap.update(forms => ({
              ...forms,
              ...formsToUpdate,
            }));
          }
        })
      )
      .subscribe({
        complete: () => this.isDynamicFormsFetched.set(true),
      });
  }

  reset(): void {
    this.documentsMap.set({});
    this.dynamicFormsMap.set({});
    this.isDocumentsFetched.set(false);
    this.isDynamicFormsFetched.set(false);
    this.loadingDocuments.set({});
  }

  getDocument(documentId: string): ExistingFileMetadata | undefined {
    return this.documentsMap()[documentId];
  }

  getDynamicForm(formId: string): DynamicForm | undefined {
    return this.dynamicFormsMap()[formId];
  }

  /** Data processing methods */
  private processSection(section: Section): ProcessedSection {
    return {
      ...section,
      id: section.id,
      name: section.name,
      assigneeId: section.assigneeId,
      tasks: section.tasks.map(task => this.processTask(task)),
    };
  }

  private processTask(task: Task): ProcessedTask {
    const groupedAttachmentsMap = this.groupAttachmentsByName(task.attachments);
    const groupedAttachments = this.createSortedGroupedAttachments(
      groupedAttachmentsMap
    );

    return {
      ...task,
      id: task.id,
      name: task.name,
      attachments: task.attachments,
      groupedAttachments,
    };
  }

  private groupAttachmentsByName(
    attachments: Attachment[]
  ): Record<string, Attachment[]> {
    return groupBy(attachments, attachment => attachment.name ?? '');
  }

  private createSortedGroupedAttachments(
    groupedMap: Record<string, Attachment[]>
  ): GroupedAttachment[] {
    return Object.keys(groupedMap)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({
        name,
        type: groupedMap[name]?.[0]?.type ?? AttachmentTypes.FILE,
        attachments: groupedMap[name] ?? [],
      }));
  }
}
